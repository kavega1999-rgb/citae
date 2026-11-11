DO $fix$
DECLARE def text;
BEGIN
 SELECT pg_get_functiondef(oid) INTO def FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='create_public_appointment_v2';
 def:=regexp_replace(def,'p_service_ids(\s*\) AS available)',E'p_service_ids, p_business_slug\\1');
 def:=regexp_replace(def,'(VALUES \(\s*)(v_client_id,)',E'\\1public.resolve_booking_business(p_business_slug), \\2');
 def:=regexp_replace(def,'(SELECT\s*)(v_appointment_id,\s*s.id,)',E'\\1public.resolve_booking_business(p_business_slug), \\2');
 def:=regexp_replace(def,'(VALUES \(\s*)(v_appointment_id,\s*v_deposit,)',E'\\1public.resolve_booking_business(p_business_slug), \\2');
 EXECUTE def;
END $fix$;
CREATE OR REPLACE FUNCTION public.current_business_id() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT business_id FROM public.user_roles WHERE user_id=(SELECT auth.uid()) AND role='owner' LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT public.current_business_id() IS NOT NULL $$;
ALTER FUNCTION public.get_my_business() SECURITY INVOKER;
ALTER FUNCTION public.approve_payment(uuid) SECURITY INVOKER;
ALTER FUNCTION public.reject_payment(uuid,text) SECURITY INVOKER;
CREATE OR REPLACE FUNCTION public.resolve_booking_business(p_slug text DEFAULT NULL) RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT id FROM public.businesses WHERE (p_slug IS NULL AND is_legacy) OR slug=p_slug LIMIT 1 $$;
REVOKE EXECUTE ON FUNCTION public.resolve_booking_business(text) FROM anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.create_public_appointment(text,text,text,timestamptz,uuid[],text,text) FROM service_role;
COMMENT ON FUNCTION public.get_public_services(text) IS 'Intentional public security-definer catalog: explicitly scoped to resolved business, active services only; direct table reads remain private.';
COMMENT ON FUNCTION public.get_public_booking_settings(text) IS 'Intentional public security-definer settings: scoped to resolved business; only configured public booking fields returned.';
COMMENT ON FUNCTION public.get_public_business_hours(text) IS 'Intentional public security-definer hours: scoped to resolved business, active only.';
COMMENT ON FUNCTION public.get_available_slots(date,uuid[],text) IS 'Intentional public security-definer availability: validates service ownership, scopes bookings and blocks to resolved business.';
COMMENT ON FUNCTION public.create_public_appointment_v2(text,text,text,timestamptz,uuid[],text,text,text) IS 'Intentional public security-definer booking: resolves business, validates services and availability, serializes writes, returns secret capability once.';
COMMENT ON FUNCTION public.get_public_business(text) IS 'Intentional public security-definer business identity: returns only name, slug, activity, agenda mode and public id.';
COMMENT ON FUNCTION public.create_my_business(text,text,text,text) IS 'Authenticated onboarding only; validates auth.uid, serializes one business per user, creates membership atomically; does not trust account metadata.';