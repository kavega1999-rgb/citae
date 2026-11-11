ALTER TABLE public.businesses
  ADD COLUMN primary_color text,
  ADD COLUMN secondary_color text,
  ADD COLUMN logo_path text,
  ADD CONSTRAINT businesses_primary_color_hex CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9a-fA-F]{6}$'),
  ADD CONSTRAINT businesses_secondary_color_hex CHECK (secondary_color IS NULL OR secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  ADD CONSTRAINT businesses_logo_path_scope CHECK (logo_path IS NULL OR logo_path LIKE id::text || '/%');

CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 120),
  specialty text CHECK (specialty IS NULL OR length(specialty) <= 150),
  photo_path text CHECK (photo_path IS NULL OR photo_path LIKE business_id::text || '/%'),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professionals_business_id_unique UNIQUE (business_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professionals TO authenticated;
GRANT ALL ON public.professionals TO service_role;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY professionals_owner_all ON public.professionals FOR ALL TO authenticated
  USING (business_id = public.current_business_id()) WITH CHECK (business_id = public.current_business_id());
CREATE TRIGGER set_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL DEFAULT public.current_business_id(),
  professional_id uuid NOT NULL,
  service_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_services_unique UNIQUE (professional_id, service_id),
  CONSTRAINT professional_services_tenant_professional FOREIGN KEY (business_id, professional_id) REFERENCES public.professionals(business_id, id) ON DELETE CASCADE,
  CONSTRAINT professional_services_tenant_service FOREIGN KEY (business_id, service_id) REFERENCES public.services(business_id, id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_services TO authenticated;
GRANT ALL ON public.professional_services TO service_role;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY professional_services_owner_all ON public.professional_services FOR ALL TO authenticated
  USING (business_id = public.current_business_id()) WITH CHECK (business_id = public.current_business_id());

CREATE TABLE public.professional_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL DEFAULT public.current_business_id(),
  professional_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens_at time NOT NULL,
  closes_at time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_hours_order CHECK (closes_at > opens_at),
  CONSTRAINT professional_hours_tenant_professional FOREIGN KEY (business_id, professional_id) REFERENCES public.professionals(business_id, id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_hours TO authenticated;
GRANT ALL ON public.professional_hours TO service_role;
ALTER TABLE public.professional_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY professional_hours_owner_all ON public.professional_hours FOR ALL TO authenticated
  USING (business_id = public.current_business_id()) WITH CHECK (business_id = public.current_business_id());
CREATE TRIGGER set_professional_hours_updated_at BEFORE UPDATE ON public.professional_hours FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.appointments ADD COLUMN professional_id uuid,
  ADD CONSTRAINT appointments_tenant_professional FOREIGN KEY (business_id, professional_id) REFERENCES public.professionals(business_id, id);
ALTER TABLE public.appointments DROP CONSTRAINT appointments_no_overlap;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
  business_id WITH =,
  (COALESCE(professional_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
  tsrange(timezone('UTC', start_at), timezone('UTC', end_at) + (buffer_minutes::double precision * interval '1 minute'), '[)') WITH &&
) WHERE (status = ANY (ARRAY['pending_payment','pending_verification','confirmed']));

-- Storage: business media in folders named by business id
CREATE POLICY business_media_read ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'business-media');
CREATE POLICY business_media_owner_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-media' AND (storage.foldername(name))[1] = public.current_business_id()::text);
CREATE POLICY business_media_owner_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-media' AND (storage.foldername(name))[1] = public.current_business_id()::text);
CREATE POLICY business_media_owner_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'business-media' AND (storage.foldername(name))[1] = public.current_business_id()::text);

DROP FUNCTION public.get_my_business();
CREATE FUNCTION public.get_my_business()
 RETURNS TABLE(id uuid, name text, slug text, activity text, agenda_mode text, primary_color text, secondary_color text, logo_path text)
 LANGUAGE sql STABLE SET search_path TO ''
AS $$ SELECT b.id,b.name,b.slug,b.activity,b.agenda_mode,b.primary_color,b.secondary_color,b.logo_path FROM public.businesses b WHERE b.id=public.current_business_id() $$;
REVOKE ALL ON FUNCTION public.get_my_business() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_business() TO authenticated, service_role;

DROP FUNCTION public.get_public_business(text);
CREATE FUNCTION public.get_public_business(p_slug text DEFAULT NULL)
 RETURNS TABLE(id uuid, name text, slug text, activity text, agenda_mode text, primary_color text, secondary_color text, logo_path text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$ SELECT b.id,b.name,b.slug,b.activity,b.agenda_mode,b.primary_color,b.secondary_color,b.logo_path FROM public.businesses b WHERE b.id=public.resolve_booking_business(p_slug) $$;
COMMENT ON FUNCTION public.get_public_business(text) IS 'Public: returns only presentation fields of a business resolved by its booking slug.';
GRANT EXECUTE ON FUNCTION public.get_public_business(text) TO anon, authenticated, service_role;

CREATE FUNCTION public.get_public_professionals(p_business_slug text, p_service_ids uuid[] DEFAULT NULL)
 RETURNS TABLE(id uuid, full_name text, specialty text, photo_path text, display_order integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  SELECT p.id, p.full_name, p.specialty, p.photo_path, p.display_order
  FROM public.professionals p
  WHERE p.business_id = public.resolve_booking_business(p_business_slug) AND p.is_active
    AND (p_service_ids IS NULL OR cardinality(p_service_ids) = 0 OR (
      SELECT count(DISTINCT ps.service_id) FROM public.professional_services ps
      WHERE ps.professional_id = p.id AND ps.service_id = ANY(p_service_ids)) = cardinality(p_service_ids))
  ORDER BY p.display_order, p.full_name
$$;
COMMENT ON FUNCTION public.get_public_professionals(text, uuid[]) IS 'Public: active professionals of a business who perform all requested services.';
GRANT EXECUTE ON FUNCTION public.get_public_professionals(text, uuid[]) TO anon, authenticated, service_role;

DROP FUNCTION public.get_available_slots(date, uuid[], text);
CREATE FUNCTION public.get_available_slots(p_date date, p_service_ids uuid[], p_business_slug text DEFAULT NULL, p_professional_id uuid DEFAULT NULL)
 RETURNS TABLE(slot_start timestamptz, slot_end timestamptz, total_duration_minutes integer, total_amount bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_business uuid := public.resolve_booking_business(p_business_slug);
  v_duration integer; v_total bigint; v_buffer integer; v_timezone text; v_service_count integer;
  v_pro_has_hours boolean := false;
BEGIN
  IF p_date IS NULL OR p_service_ids IS NULL OR cardinality(p_service_ids) = 0 THEN
    RAISE EXCEPTION 'Debes indicar una fecha y al menos un servicio.';
  END IF;
  IF cardinality(p_service_ids) <> (SELECT COUNT(DISTINCT x) FROM unnest(p_service_ids) AS x) THEN
    RAISE EXCEPTION 'No se permiten servicios duplicados.';
  END IF;
  SELECT bs.timezone, bs.buffer_minutes INTO v_timezone, v_buffer FROM public.business_settings bs WHERE bs.business_id = v_business LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Primero debes configurar el negocio.'; END IF;

  SELECT SUM(s.duration_minutes)::integer, SUM(s.price)::bigint, COUNT(*)::integer INTO v_duration, v_total, v_service_count
  FROM public.services s WHERE s.business_id = v_business AND s.id = ANY(p_service_ids) AND s.is_active;
  IF v_service_count <> cardinality(p_service_ids) THEN RAISE EXCEPTION 'Uno o más servicios no existen o están inactivos.'; END IF;

  IF p_professional_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.professionals p WHERE p.business_id = v_business AND p.is_active) THEN
      RAISE EXCEPTION 'Elige un profesional.';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = p_professional_id AND p.business_id = v_business AND p.is_active)
       OR (SELECT count(DISTINCT ps.service_id) FROM public.professional_services ps WHERE ps.professional_id = p_professional_id AND ps.service_id = ANY(p_service_ids)) <> cardinality(p_service_ids) THEN
      RAISE EXCEPTION 'El profesional no está disponible para estos servicios.';
    END IF;
    v_pro_has_hours := EXISTS (SELECT 1 FROM public.professional_hours ph WHERE ph.professional_id = p_professional_id);
  END IF;

  RETURN QUERY
  WITH candidate_times AS (
    SELECT gs.candidate_local::time AS candidate_time
    FROM public.business_hours bh
    CROSS JOIN LATERAL generate_series((p_date + bh.opens_at), (p_date + bh.closes_at - make_interval(mins => v_duration)), make_interval(mins => bh.interval_minutes)) AS gs(candidate_local)
    WHERE bh.business_id = v_business AND bh.weekday = EXTRACT(DOW FROM p_date)::smallint AND bh.is_active AND bh.slot_mode = 'interval' AND bh.closes_at > bh.opens_at
    UNION
    SELECT hs.slot_time FROM public.business_hours bh JOIN public.business_hour_slots hs ON hs.business_hours_id = bh.id
    WHERE bh.business_id = v_business AND bh.weekday = EXTRACT(DOW FROM p_date)::smallint AND bh.is_active AND bh.slot_mode = 'specific'
      AND hs.slot_time >= bh.opens_at AND hs.slot_time + make_interval(mins => v_duration) <= bh.closes_at
  ), filtered AS (
    SELECT ct.candidate_time FROM candidate_times ct
    WHERE NOT v_pro_has_hours OR EXISTS (
      SELECT 1 FROM public.professional_hours ph
      WHERE ph.professional_id = p_professional_id AND ph.weekday = EXTRACT(DOW FROM p_date)::smallint
        AND ct.candidate_time >= ph.opens_at AND ct.candidate_time + make_interval(mins => v_duration) <= ph.closes_at)
  ), calculated_slots AS (
    SELECT DISTINCT timezone(v_timezone, (p_date + f.candidate_time)) AS start_time,
      timezone(v_timezone, (p_date + f.candidate_time)) + make_interval(mins => v_duration) AS end_time
    FROM filtered f
  )
  SELECT cs.start_time, cs.end_time, v_duration, v_total FROM calculated_slots cs
  WHERE cs.start_time > now()
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.business_id = v_business AND a.status IN ('pending_payment','pending_verification','confirmed')
        AND (p_professional_id IS NULL OR a.professional_id IS NULL OR a.professional_id = p_professional_id)
        AND tstzrange(a.start_at, a.end_at + make_interval(mins => a.buffer_minutes), '[)') && tstzrange(cs.start_time, cs.end_time + make_interval(mins => v_buffer), '[)'))
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_slots b
      WHERE b.business_id = v_business AND tstzrange(b.start_at, b.end_at, '[)') && tstzrange(cs.start_time, cs.end_time + make_interval(mins => v_buffer), '[)'))
  ORDER BY cs.start_time;
END;
$function$;
COMMENT ON FUNCTION public.get_available_slots(date, uuid[], text, uuid) IS 'Public: availability for a business slug and optional professional; returns only times and totals.';
GRANT EXECUTE ON FUNCTION public.get_available_slots(date, uuid[], text, uuid) TO anon, authenticated, service_role;

DROP FUNCTION public.create_public_appointment_v2(text, text, text, timestamptz, uuid[], text, text, text);
CREATE FUNCTION public.create_public_appointment_v2(p_full_name text, p_phone text, p_email text, p_start_at timestamptz, p_service_ids uuid[], p_payment_method text, p_client_notes text DEFAULT NULL, p_business_slug text DEFAULT NULL, p_professional_id uuid DEFAULT NULL)
 RETURNS TABLE(appointment_id uuid, payment_id uuid, payment_amount bigint, total_amount bigint, payment_deadline_at timestamptz, access_token text)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_business uuid := public.resolve_booking_business(p_business_slug);
  v_client_id uuid; v_appointment_id uuid; v_payment_id uuid;
  v_full_name text := trim(p_full_name); v_phone text := trim(p_phone); v_email text := NULLIF(trim(COALESCE(p_email, '')), '');
  v_timezone text; v_deposit_percentage numeric; v_buffer_minutes integer; v_hold_minutes integer;
  v_duration integer; v_total bigint; v_deposit bigint; v_deadline timestamptz; v_service_count integer; v_token text;
BEGIN
  IF v_full_name IS NULL OR v_full_name = '' OR v_phone IS NULL OR v_phone = '' THEN RAISE EXCEPTION 'El nombre y teléfono son obligatorios.'; END IF;
  IF length(v_full_name) > 150 OR length(v_phone) > 30 OR (v_email IS NOT NULL AND length(v_email) > 254) THEN RAISE EXCEPTION 'Uno de los datos supera la longitud permitida.'; END IF;
  IF p_start_at IS NULL OR p_start_at <= now() THEN RAISE EXCEPTION 'La fecha de reserva debe ser futura.'; END IF;
  IF p_service_ids IS NULL OR cardinality(p_service_ids) = 0 THEN RAISE EXCEPTION 'Selecciona al menos un servicio.'; END IF;
  IF cardinality(p_service_ids) <> (SELECT COUNT(DISTINCT x) FROM unnest(p_service_ids) AS x) THEN RAISE EXCEPTION 'No se permiten servicios duplicados.'; END IF;
  IF p_payment_method IS NULL OR p_payment_method NOT IN ('nequi','daviplata','bank_transfer') THEN RAISE EXCEPTION 'El medio de pago no es válido.'; END IF;

  SELECT bs.timezone, bs.deposit_percentage, bs.buffer_minutes, bs.hold_minutes INTO v_timezone, v_deposit_percentage, v_buffer_minutes, v_hold_minutes
  FROM public.business_settings bs WHERE bs.business_id = v_business LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'No existe configuración del negocio.'; END IF;

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
  v_deposit := GREATEST(1, ROUND(v_total * v_deposit_percentage / 100)::bigint);
  v_deadline := now() + make_interval(mins => v_hold_minutes);

  INSERT INTO public.appointments (business_id, client_id, professional_id, start_at, end_at, duration_minutes, duration_is_manual, buffer_minutes, total_amount, status, payment_deadline_at, client_notes, access_token_hash)
  VALUES (v_business, v_client_id, p_professional_id, p_start_at, p_start_at + make_interval(mins => v_duration), v_duration, false, v_buffer_minutes, v_total, 'pending_payment', v_deadline, NULLIF(trim(COALESCE(p_client_notes, '')), ''), extensions.digest(v_token, 'sha256'))
  RETURNING id INTO v_appointment_id;

  INSERT INTO public.appointment_services (business_id, appointment_id, service_id, service_name, unit_price, duration_minutes, display_order)
  SELECT v_business, v_appointment_id, s.id, s.name, s.price, s.duration_minutes, ROW_NUMBER() OVER (ORDER BY s.display_order, s.name)::integer
  FROM public.services s WHERE s.business_id = v_business AND s.id = ANY(p_service_ids) AND s.is_active;

  INSERT INTO public.payments (business_id, appointment_id, amount, payment_type, payment_method, status)
  VALUES (v_business, v_appointment_id, v_deposit, 'deposit', p_payment_method, 'pending') RETURNING id INTO v_payment_id;

  RETURN QUERY SELECT v_appointment_id, v_payment_id, v_deposit, v_total, v_deadline, v_token;
END;
$function$;
COMMENT ON FUNCTION public.create_public_appointment_v2(text, text, text, timestamptz, uuid[], text, text, text, uuid) IS 'Public: creates a pending reservation after revalidating availability; prices come from the database.';
GRANT EXECUTE ON FUNCTION public.create_public_appointment_v2(text, text, text, timestamptz, uuid[], text, text, text, uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_appointment(p_appointment_id uuid, p_token text)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_result jsonb;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Credenciales de reserva inválidas.'; END IF;
  SELECT jsonb_build_object(
    'appointment_id', a.id, 'business_id', a.business_id, 'status', a.status, 'start_at', a.start_at, 'end_at', a.end_at,
    'duration_minutes', a.duration_minutes, 'total_amount', a.total_amount, 'payment_deadline_at', a.payment_deadline_at,
    'professional_name', (SELECT p.full_name FROM public.professionals p WHERE p.id = a.professional_id),
    'services', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name', aps.service_name, 'price', aps.unit_price, 'duration_minutes', aps.duration_minutes) ORDER BY aps.display_order), '[]'::jsonb)
                 FROM public.appointment_services aps WHERE aps.appointment_id = a.id),
    'payment', (SELECT jsonb_build_object('amount', p.amount, 'method', p.payment_method, 'status', p.status, 'payment_type', p.payment_type)
                FROM public.payments p WHERE p.appointment_id = a.id AND p.payment_type = 'deposit' ORDER BY p.created_at DESC LIMIT 1))
  INTO v_result FROM public.appointments a
  WHERE a.id = p_appointment_id AND a.access_token_hash = extensions.digest(p_token, 'sha256');
  IF v_result IS NULL THEN RAISE EXCEPTION 'Reserva no encontrada o token inválido.'; END IF;
  RETURN v_result;
END;
$function$;