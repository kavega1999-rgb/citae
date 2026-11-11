ALTER TABLE public.blocked_slots ADD COLUMN professional_id uuid;
ALTER TABLE public.blocked_slots ADD CONSTRAINT blocked_slots_tenant_professional FOREIGN KEY (business_id, professional_id) REFERENCES public.professionals(business_id,id);

CREATE FUNCTION public.booking_slots_internal(p_date date, p_service_ids uuid[], p_business_slug text, p_professional_id uuid, p_exclude uuid DEFAULT NULL, p_duration integer DEFAULT NULL)
RETURNS TABLE(slot_start timestamptz, slot_end timestamptz, total_duration_minutes integer, total_amount bigint)
LANGUAGE plpgsql STABLE SET search_path = '' AS $$
DECLARE b uuid := public.resolve_booking_business(p_business_slug); dur integer; total bigint; buf integer; tz text; cnt integer; own_hours boolean := false;
BEGIN
 IF p_date IS NULL OR cardinality(p_service_ids) IS NULL OR cardinality(p_service_ids)=0 THEN RAISE EXCEPTION 'Selecciona una fecha y servicios.'; END IF;
 IF cardinality(p_service_ids)<>(SELECT count(DISTINCT x) FROM unnest(p_service_ids) x) THEN RAISE EXCEPTION 'Servicios duplicados.'; END IF;
 SELECT s.timezone,s.buffer_minutes INTO tz,buf FROM public.business_settings s WHERE s.business_id=b;
 IF NOT FOUND THEN RAISE EXCEPTION 'Primero debes configurar el negocio.'; END IF;
 SELECT sum(s.duration_minutes)::integer,sum(s.price)::bigint,count(*)::integer INTO dur,total,cnt FROM public.services s WHERE s.business_id=b AND s.id=ANY(p_service_ids) AND (s.is_active OR p_exclude IS NOT NULL);
 IF cnt<>cardinality(p_service_ids) THEN RAISE EXCEPTION 'Uno o más servicios no están disponibles.'; END IF;
 dur:=COALESCE(p_duration,dur);
 IF p_professional_id IS NULL THEN
  IF EXISTS(SELECT 1 FROM public.professionals p WHERE p.business_id=b AND p.is_active) THEN RAISE EXCEPTION 'Elige un profesional.'; END IF;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM public.professionals p WHERE p.id=p_professional_id AND p.business_id=b AND p.is_active) OR (SELECT count(DISTINCT ps.service_id) FROM public.professional_services ps WHERE ps.business_id=b AND ps.professional_id=p_professional_id AND ps.service_id=ANY(p_service_ids))<>cardinality(p_service_ids) THEN RAISE EXCEPTION 'El profesional no realiza todos los servicios o está inactivo.'; END IF;
  own_hours:=EXISTS(SELECT 1 FROM public.professional_hours ph WHERE ph.business_id=b AND ph.professional_id=p_professional_id);
 END IF;
 RETURN QUERY WITH candidates AS (
  SELECT gs.t AS local_start FROM public.professional_hours ph CROSS JOIN LATERAL generate_series(p_date+ph.opens_at,p_date+ph.closes_at-make_interval(mins=>dur),make_interval(mins=>COALESCE((SELECT min(bh.interval_minutes) FROM public.business_hours bh WHERE bh.business_id=b AND bh.is_active AND bh.weekday=ph.weekday),30))) gs(t)
  WHERE own_hours AND ph.business_id=b AND ph.professional_id=p_professional_id AND ph.weekday=EXTRACT(DOW FROM p_date)::smallint
  UNION
  SELECT gs.t FROM public.business_hours bh CROSS JOIN LATERAL generate_series(p_date+bh.opens_at,p_date+bh.closes_at-make_interval(mins=>dur),make_interval(mins=>bh.interval_minutes)) gs(t)
  WHERE NOT own_hours AND bh.business_id=b AND bh.weekday=EXTRACT(DOW FROM p_date)::smallint AND bh.is_active AND bh.slot_mode='interval'
  UNION
  SELECT p_date+hs.slot_time FROM public.business_hours bh JOIN public.business_hour_slots hs ON hs.business_hours_id=bh.id AND hs.business_id=b
  WHERE NOT own_hours AND bh.business_id=b AND bh.weekday=EXTRACT(DOW FROM p_date)::smallint AND bh.is_active AND bh.slot_mode='specific' AND hs.slot_time>=bh.opens_at AND hs.slot_time+make_interval(mins=>dur)<=bh.closes_at
 ), slots AS(SELECT DISTINCT timezone(tz,c.local_start) AS st,timezone(tz,c.local_start)+make_interval(mins=>dur) AS en FROM candidates c)
 SELECT s.st,s.en,dur,total FROM slots s WHERE s.st>now()
 AND NOT EXISTS(SELECT 1 FROM public.appointments a WHERE a.business_id=b AND (p_exclude IS NULL OR a.id<>p_exclude) AND a.status IN ('pending_payment','pending_verification','confirmed') AND (p_professional_id IS NULL OR a.professional_id IS NULL OR a.professional_id=p_professional_id) AND tstzrange(a.start_at,a.end_at+make_interval(mins=>a.buffer_minutes),'[)') && tstzrange(s.st,s.en+make_interval(mins=>buf),'[)'))
 AND NOT EXISTS(SELECT 1 FROM public.blocked_slots c WHERE c.business_id=b AND (c.professional_id IS NULL OR p_professional_id IS NULL OR c.professional_id=p_professional_id) AND tstzrange(c.start_at,c.end_at,'[)') && tstzrange(s.st,s.en+make_interval(mins=>buf),'[)')) ORDER BY s.st;
END; $$;
REVOKE ALL ON FUNCTION public.booking_slots_internal(date,uuid[],text,uuid,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.get_available_slots(p_date date,p_service_ids uuid[],p_business_slug text DEFAULT NULL,p_professional_id uuid DEFAULT NULL)
RETURNS TABLE(slot_start timestamptz,slot_end timestamptz,total_duration_minutes integer,total_amount bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ SELECT * FROM public.booking_slots_internal(p_date,p_service_ids,p_business_slug,p_professional_id); $$;

CREATE FUNCTION public.get_reschedule_slots(p_appointment_id uuid,p_date date,p_professional_id uuid)
RETURNS TABLE(slot_start timestamptz,slot_end timestamptz,total_duration_minutes integer,total_amount bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE a public.appointments; slug text; ids uuid[];
BEGIN
 SELECT * INTO a FROM public.appointments WHERE id=p_appointment_id AND business_id=public.current_business_id();
 IF NOT FOUND OR NOT public.is_admin() THEN RAISE EXCEPTION 'Reserva no disponible.'; END IF;
 IF a.status NOT IN ('pending_payment','pending_verification','confirmed') THEN RAISE EXCEPTION 'Esta reserva no se puede mover.'; END IF;
 SELECT b.slug INTO slug FROM public.businesses b WHERE b.id=a.business_id;
 SELECT array_agg(s.service_id) INTO ids FROM public.appointment_services s WHERE s.appointment_id=a.id AND s.business_id=a.business_id;
 RETURN QUERY SELECT * FROM public.booking_slots_internal(p_date,ids,slug,p_professional_id,a.id,a.duration_minutes);
END; $$;
REVOKE ALL ON FUNCTION public.get_reschedule_slots(uuid,date,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_reschedule_slots(uuid,date,uuid) TO authenticated,service_role;

CREATE FUNCTION public.reschedule_appointment(p_appointment_id uuid,p_start_at timestamptz,p_professional_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE a public.appointments; tz text;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acceso reservado al propietario.'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(public.current_business_id()::text,987));
 SELECT * INTO a FROM public.appointments WHERE id=p_appointment_id AND business_id=public.current_business_id() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reserva no disponible.'; END IF;
 SELECT s.timezone INTO tz FROM public.business_settings s WHERE s.business_id=a.business_id;
 IF NOT EXISTS(SELECT 1 FROM public.get_reschedule_slots(a.id,(p_start_at AT TIME ZONE tz)::date,p_professional_id) s WHERE s.slot_start=p_start_at) THEN RAISE EXCEPTION 'El horario ya no está disponible.'; END IF;
 UPDATE public.appointments SET start_at=p_start_at,end_at=p_start_at+make_interval(mins=>a.duration_minutes),professional_id=p_professional_id WHERE id=a.id AND business_id=a.business_id;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.reschedule_appointment(uuid,timestamptz,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reschedule_appointment(uuid,timestamptz,uuid) TO authenticated,service_role;

CREATE FUNCTION public.guard_appointment_overlap() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.business_id::text,987));
 IF NEW.status IN ('pending_payment','pending_verification','confirmed') AND EXISTS(SELECT 1 FROM public.appointments a WHERE a.business_id=NEW.business_id AND a.id<>NEW.id AND a.status IN ('pending_payment','pending_verification','confirmed') AND (a.professional_id IS NULL OR NEW.professional_id IS NULL OR a.professional_id=NEW.professional_id) AND tstzrange(a.start_at,a.end_at+make_interval(mins=>a.buffer_minutes),'[)') && tstzrange(NEW.start_at,NEW.end_at+make_interval(mins=>NEW.buffer_minutes),'[)')) THEN RAISE EXCEPTION 'El horario ya no está disponible.'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_appointment_overlap BEFORE INSERT OR UPDATE OF start_at,end_at,professional_id,status ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_overlap();