CREATE OR REPLACE FUNCTION public.validate_schedule_owner(p_exclude uuid) RETURNS boolean LANGUAGE plpgsql STABLE SET search_path='' AS $$ BEGIN IF p_exclude IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.appointments a WHERE a.id=p_exclude AND a.business_id=public.current_business_id()) THEN RAISE EXCEPTION 'Reserva no disponible.'; END IF; RETURN true; END; $$;
REVOKE ALL ON FUNCTION public.validate_schedule_owner(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.validate_schedule_owner(uuid) TO authenticated,service_role;
ALTER FUNCTION public.get_reschedule_slots(uuid,date,uuid) SECURITY INVOKER;
ALTER FUNCTION public.reschedule_appointment(uuid,timestamptz,uuid) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.booking_slots_internal(date,uuid[],text,uuid,uuid,integer) TO authenticated,service_role;
DO $$ DECLARE definition text; BEGIN SELECT pg_get_functiondef('public.booking_slots_internal(date,uuid[],text,uuid,uuid,integer)'::regprocedure) INTO definition; definition:=replace(definition,'BEGIN','BEGIN' || E'\n PERFORM public.validate_schedule_owner(p_exclude);'); EXECUTE definition; END; $$;
COMMENT ON FUNCTION public.get_available_slots(date,uuid[],text,uuid) IS 'Intentionally public: only available times and public catalog totals, scoped by business slug and professional. No customer data returned.';