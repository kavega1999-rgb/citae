ALTER TABLE public.business_settings ADD COLUMN requires_deposit boolean NOT NULL DEFAULT true;

DROP FUNCTION public.get_public_booking_settings(text);
CREATE FUNCTION public.get_public_booking_settings(p_business_slug text DEFAULT NULL)
 RETURNS TABLE(business_name text, timezone text, currency text, deposit_percentage numeric, buffer_minutes integer, hold_minutes integer, payment_instructions text, nequi_number text, daviplata_number text, bank_name text, account_type text, account_number text, account_holder text, requires_deposit boolean, cancellation_policy text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  SELECT bs.business_name, bs.timezone, bs.currency, bs.deposit_percentage, bs.buffer_minutes, bs.hold_minutes, bs.payment_instructions,
         bs.nequi_number, bs.daviplata_number, bs.bank_name, bs.account_type, bs.account_number, bs.account_holder, bs.requires_deposit, bs.cancellation_policy
  FROM public.business_settings bs WHERE bs.business_id = public.resolve_booking_business(p_business_slug) LIMIT 1
$$;
COMMENT ON FUNCTION public.get_public_booking_settings(text) IS 'Public: booking presentation settings for a business slug.';
GRANT EXECUTE ON FUNCTION public.get_public_booking_settings(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_public_appointment_v2(p_full_name text, p_phone text, p_email text, p_start_at timestamptz, p_service_ids uuid[], p_payment_method text, p_client_notes text DEFAULT NULL, p_business_slug text DEFAULT NULL, p_professional_id uuid DEFAULT NULL)
 RETURNS TABLE(appointment_id uuid, payment_id uuid, payment_amount bigint, total_amount bigint, payment_deadline_at timestamptz, access_token text)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_business uuid := public.resolve_booking_business(p_business_slug);
  v_client_id uuid; v_appointment_id uuid; v_payment_id uuid;
  v_full_name text := trim(p_full_name); v_phone text := trim(p_phone); v_email text := NULLIF(trim(COALESCE(p_email, '')), '');
  v_timezone text; v_deposit_percentage numeric; v_buffer_minutes integer; v_hold_minutes integer; v_requires boolean;
  v_duration integer; v_total bigint; v_deposit bigint; v_deadline timestamptz; v_service_count integer; v_token text;
BEGIN
  IF v_full_name IS NULL OR v_full_name = '' OR v_phone IS NULL OR v_phone = '' THEN RAISE EXCEPTION 'El nombre y teléfono son obligatorios.'; END IF;
  IF length(v_full_name) > 150 OR length(v_phone) > 30 OR (v_email IS NOT NULL AND length(v_email) > 254) THEN RAISE EXCEPTION 'Uno de los datos supera la longitud permitida.'; END IF;
  IF p_start_at IS NULL OR p_start_at <= now() THEN RAISE EXCEPTION 'La fecha de reserva debe ser futura.'; END IF;
  IF p_service_ids IS NULL OR cardinality(p_service_ids) = 0 THEN RAISE EXCEPTION 'Selecciona al menos un servicio.'; END IF;
  IF cardinality(p_service_ids) <> (SELECT COUNT(DISTINCT x) FROM unnest(p_service_ids) AS x) THEN RAISE EXCEPTION 'No se permiten servicios duplicados.'; END IF;

  SELECT bs.timezone, bs.deposit_percentage, bs.buffer_minutes, bs.hold_minutes, bs.requires_deposit INTO v_timezone, v_deposit_percentage, v_buffer_minutes, v_hold_minutes, v_requires
  FROM public.business_settings bs WHERE bs.business_id = v_business LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'No existe configuración del negocio.'; END IF;
  IF v_requires AND (p_payment_method IS NULL OR p_payment_method NOT IN ('nequi','daviplata','bank_transfer')) THEN RAISE EXCEPTION 'El medio de pago no es válido.'; END IF;

  SELECT SUM(s.duration_minutes)::integer, SUM(s.price)::bigint, COUNT(*)::integer INTO v_duration, v_total, v_service_count
  FROM public.services s WHERE s.business_id = v_business AND s.id = ANY(p_service_ids) AND s.is_active;
  IF v_service_count <> cardinality(p_service_ids) THEN RAISE EXCEPTION 'Uno o más servicios no están disponibles.'; END IF;
  IF v_total <= 0 THEN RAISE EXCEPTION 'El total debe ser mayor que cero.'; END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_business::text || v_phone, 0));
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_business::text || p_start_at::text, 1));

  IF NOT EXISTS (SELECT 1 FROM public.get_available_slots((p_start_at AT TIME ZONE v_timezone)::date, p_service_ids, p_business_slug, p_professional_id) av WHERE av.slot_start = p_start_at) THEN
    RAISE EXCEPTION 'El horario ya no está disponible.';
  END IF;

  SELECT c.id INTO v_client_id FROM public.clients c WHERE c.business_id = v_business AND c.phone = v_phone ORDER BY c.created_at LIMIT 1;
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (business_id, full_name, phone, email) VALUES (v_business, v_full_name, v_phone, v_email) RETURNING id INTO v_client_id;
  END IF;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  IF v_requires THEN
    v_deposit := GREATEST(1, ROUND(v_total * v_deposit_percentage / 100)::bigint);
    v_deadline := now() + make_interval(mins => v_hold_minutes);
  ELSE
    v_deposit := 0; v_deadline := NULL;
  END IF;

  INSERT INTO public.appointments (business_id, client_id, professional_id, start_at, end_at, duration_minutes, duration_is_manual, buffer_minutes, total_amount, status, payment_deadline_at, client_notes, access_token_hash)
  VALUES (v_business, v_client_id, p_professional_id, p_start_at, p_start_at + make_interval(mins => v_duration), v_duration, false, v_buffer_minutes, v_total,
          CASE WHEN v_requires THEN 'pending_payment' ELSE 'confirmed' END, v_deadline, NULLIF(trim(COALESCE(p_client_notes, '')), ''), extensions.digest(v_token, 'sha256'))
  RETURNING id INTO v_appointment_id;

  INSERT INTO public.appointment_services (business_id, appointment_id, service_id, service_name, unit_price, duration_minutes, display_order)
  SELECT v_business, v_appointment_id, s.id, s.name, s.price, s.duration_minutes, ROW_NUMBER() OVER (ORDER BY s.display_order, s.name)::integer
  FROM public.services s WHERE s.business_id = v_business AND s.id = ANY(p_service_ids) AND s.is_active;

  IF v_requires THEN
    INSERT INTO public.payments (business_id, appointment_id, amount, payment_type, payment_method, status)
    VALUES (v_business, v_appointment_id, v_deposit, 'deposit', p_payment_method, 'pending') RETURNING id INTO v_payment_id;
  END IF;

  RETURN QUERY SELECT v_appointment_id, v_payment_id, v_deposit, v_total, v_deadline, v_token;
END;
$function$;