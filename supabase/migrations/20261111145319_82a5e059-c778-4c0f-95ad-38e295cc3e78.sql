CREATE TABLE public.businesses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 150), slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 80), activity text NOT NULL DEFAULT '', agenda_mode text NOT NULL DEFAULT 'business' CHECK(agenda_mode IN ('business','solo')), is_legacy boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE, role text NOT NULL DEFAULT 'owner' CHECK(role='owner'), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id), UNIQUE(business_id,user_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_membership_read ON public.user_roles FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE FUNCTION public.current_business_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT business_id FROM public.user_roles WHERE user_id=(SELECT auth.uid()) AND role='owner' LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.current_business_id() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.current_business_id() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT public.current_business_id() IS NOT NULL $$;
CREATE POLICY owner_business_read ON public.businesses FOR SELECT TO authenticated USING(id=public.current_business_id());
CREATE POLICY owner_business_update ON public.businesses FOR UPDATE TO authenticated USING(id=public.current_business_id()) WITH CHECK(id=public.current_business_id());
CREATE TRIGGER businesses_updated BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER user_roles_updated BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.businesses(id,name,slug,is_legacy) SELECT id,business_name,'negocio-piloto',true FROM public.business_settings LIMIT 1;
DO $$ BEGIN IF (SELECT count(*) FROM public.businesses WHERE is_legacy)<>1 THEN RAISE EXCEPTION 'Expected exactly one pilot configuration; migration stopped safely'; END IF; END $$;
CREATE UNIQUE INDEX businesses_single_legacy ON public.businesses(is_legacy) WHERE is_legacy;
INSERT INTO public.user_roles(user_id,business_id) SELECT p.id,b.id FROM public.profiles p CROSS JOIN public.businesses b WHERE p.role='owner' AND b.is_legacy;
CREATE FUNCTION public.resolve_booking_business(p_slug text DEFAULT NULL) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT id FROM public.businesses WHERE (p_slug IS NULL AND is_legacy) OR slug=p_slug LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.resolve_booking_business(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_booking_business(text) TO anon,authenticated,service_role;
DO $migration$
DECLARE t text; pilot uuid;
BEGIN
 SELECT id INTO pilot FROM public.businesses WHERE is_legacy;
 FOREACH t IN ARRAY ARRAY['business_settings','services','clients','business_hours','business_hour_slots','blocked_slots','appointments','appointment_services','payments'] LOOP
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN business_id uuid REFERENCES public.businesses(id)',t);
  EXECUTE format('UPDATE public.%I SET business_id=$1',t) USING pilot;
  EXECUTE format('ALTER TABLE public.%I ALTER COLUMN business_id SET NOT NULL, ALTER COLUMN business_id SET DEFAULT public.current_business_id()',t);
  EXECUTE format('CREATE INDEX %I ON public.%I(business_id)',t||'_business_idx',t);
  EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE(business_id,id)',t,t||'_business_id_unique');
  EXECUTE format('DROP POLICY %I ON public.%I',t||'_admin_all',t);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING(business_id=public.current_business_id()) WITH CHECK(business_id=public.current_business_id())',t||'_owner_all',t);
 END LOOP;
END $migration$;
DROP POLICY services_public_read_active ON public.services;
DROP POLICY business_hours_public_read ON public.business_hours;
ALTER TABLE public.business_settings DROP CONSTRAINT business_settings_singleton_key_key;
ALTER TABLE public.business_settings ADD CONSTRAINT business_settings_per_business UNIQUE(business_id);
ALTER TABLE public.business_hours DROP CONSTRAINT business_hours_unique_interval;
ALTER TABLE public.business_hours ADD CONSTRAINT business_hours_unique_interval UNIQUE(business_id,weekday,opens_at,closes_at);
ALTER TABLE public.appointments ADD CONSTRAINT appointments_tenant_client FOREIGN KEY(business_id,client_id) REFERENCES public.clients(business_id,id);
ALTER TABLE public.payments ADD CONSTRAINT payments_tenant_appointment FOREIGN KEY(business_id,appointment_id) REFERENCES public.appointments(business_id,id);
ALTER TABLE public.appointment_services ADD CONSTRAINT appointment_services_tenant_appointment FOREIGN KEY(business_id,appointment_id) REFERENCES public.appointments(business_id,id), ADD CONSTRAINT appointment_services_tenant_service FOREIGN KEY(business_id,service_id) REFERENCES public.services(business_id,id);
ALTER TABLE public.business_hour_slots ADD CONSTRAINT business_hour_slots_tenant_hours FOREIGN KEY(business_id,business_hours_id) REFERENCES public.business_hours(business_id,id);
ALTER TABLE public.appointments DROP CONSTRAINT appointments_no_overlap;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_no_overlap EXCLUDE USING gist (business_id WITH =,tsrange(timezone('UTC',start_at),timezone('UTC',end_at)+buffer_minutes*interval '1 minute','[)') WITH &&) WHERE(status IN ('pending_payment','pending_verification','confirmed'));
CREATE FUNCTION public.get_my_business() RETURNS TABLE(id uuid,name text,slug text,activity text,agenda_mode text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT b.id,b.name,b.slug,b.activity,b.agenda_mode FROM public.businesses b WHERE b.id=public.current_business_id() $$;
REVOKE ALL ON FUNCTION public.get_my_business() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_business() TO authenticated,service_role;
CREATE FUNCTION public.get_public_business(p_slug text DEFAULT NULL) RETURNS TABLE(id uuid,name text,slug text,activity text,agenda_mode text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT b.id,b.name,b.slug,b.activity,b.agenda_mode FROM public.businesses b WHERE b.id=public.resolve_booking_business(p_slug) $$;
REVOKE ALL ON FUNCTION public.get_public_business(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_business(text) TO anon,authenticated,service_role;
CREATE FUNCTION public.create_my_business(p_name text,p_slug text,p_activity text,p_agenda_mode text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b uuid; u uuid := (SELECT auth.uid());
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Inicia sesión para crear tu negocio.'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,47));
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=u) THEN RAISE EXCEPTION 'Ya tienes un negocio registrado.'; END IF;
 IF p_name IS NULL OR length(trim(p_name)) NOT BETWEEN 1 AND 150 OR p_slug IS NULL OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(p_slug) NOT BETWEEN 3 AND 80 OR p_activity IS NULL OR length(trim(p_activity)) NOT BETWEEN 1 AND 150 OR p_agenda_mode IS NULL OR p_agenda_mode NOT IN ('business','solo') THEN RAISE EXCEPTION 'Revisa el nombre, enlace, actividad y modalidad del negocio.'; END IF;
 INSERT INTO public.profiles(id,full_name) VALUES(u,trim(p_name)) ON CONFLICT(id) DO NOTHING;
 INSERT INTO public.businesses(name,slug,activity,agenda_mode) VALUES(trim(p_name),p_slug,trim(p_activity),p_agenda_mode) RETURNING id INTO b;
 INSERT INTO public.user_roles(user_id,business_id) VALUES(u,b);
 INSERT INTO public.business_settings(business_id,business_name) VALUES(b,trim(p_name));
 RETURN b;
END $$;
REVOKE ALL ON FUNCTION public.create_my_business(text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_my_business(text,text,text,text) TO authenticated;
DO $migration$
DECLARE n text; def text; ident text;
BEGIN
 FOREACH n IN ARRAY ARRAY['get_public_services','get_public_booking_settings','get_public_business_hours','get_available_slots','create_public_appointment_v2'] LOOP
  SELECT pg_get_functiondef(p.oid),p.oid::regprocedure::text INTO def,ident FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname=n;
  IF def IS NULL THEN RAISE EXCEPTION 'Missing existing function %',n; END IF;
  IF n IN ('get_public_services','get_public_booking_settings','get_public_business_hours') THEN
   def:=replace(def,'public.'||n||'()','public.'||n||'(p_business_slug text DEFAULT NULL::text)');
  ELSE
   def:=regexp_replace(def,'(CREATE OR REPLACE FUNCTION public\.'||n||'\([^\n]*)(\)\n)', E'\\1, p_business_slug text DEFAULT NULL::text\\2');
  END IF;
  def:=replace(def,'WHERE bs.singleton_key = true','WHERE bs.business_id = public.resolve_booking_business(p_business_slug)');
  def:=replace(def,'WHERE bs.singleton_key = TRUE','WHERE bs.business_id = public.resolve_booking_business(p_business_slug)');
  def:=replace(def,'WHERE s.is_active = true','WHERE s.business_id = public.resolve_booking_business(p_business_slug) AND s.is_active = true');
  def:=replace(def,'WHERE s.is_active = TRUE','WHERE s.business_id = public.resolve_booking_business(p_business_slug) AND s.is_active = TRUE');
  def:=replace(def,'WHERE s.id = ANY(p_service_ids)','WHERE s.business_id = public.resolve_booking_business(p_business_slug) AND s.id = ANY(p_service_ids)');
  def:=replace(def,'WHERE bh.is_active = true','WHERE bh.business_id = public.resolve_booking_business(p_business_slug) AND bh.is_active = true');
  def:=replace(def,'WHERE bh.is_active = TRUE','WHERE bh.business_id = public.resolve_booking_business(p_business_slug) AND bh.is_active = TRUE');
  def:=replace(def,'WHERE bh.weekday =','WHERE bh.business_id = public.resolve_booking_business(p_business_slug) AND bh.weekday =');
  def:=replace(def,'WHERE a.status IN (','WHERE a.business_id = public.resolve_booking_business(p_business_slug) AND a.status IN (');
  def:=replace(def,'WHERE tstzrange(','WHERE b.business_id = public.resolve_booking_business(p_business_slug) AND tstzrange(');
  def:=replace(def,'WHERE c.phone = v_phone','WHERE c.business_id = public.resolve_booking_business(p_business_slug) AND c.phone = v_phone');
  IF n='create_public_appointment_v2' THEN
   def:=replace(def,'            p_service_ids'||chr(10),'            p_service_ids, p_business_slug'||chr(10));
   def:=replace(def,'INSERT INTO public.clients (','INSERT INTO public.clients (business_id,');
   def:=replace(def,'            v_full_name,','            public.resolve_booking_business(p_business_slug), v_full_name,');
   def:=replace(def,'INSERT INTO public.appointments (','INSERT INTO public.appointments (business_id,');
   def:=replace(def,'        v_client_id,'||chr(10),'        public.resolve_booking_business(p_business_slug), v_client_id,'||chr(10));
   def:=replace(def,'INSERT INTO public.appointment_services (','INSERT INTO public.appointment_services (business_id,');
   def:=replace(def,'        v_appointment_id,'||chr(10)||'        s.id,','        public.resolve_booking_business(p_business_slug), v_appointment_id,'||chr(10)||'        s.id,');
   def:=replace(def,'INSERT INTO public.payments (','INSERT INTO public.payments (business_id,');
   def:=replace(def,'        v_appointment_id,'||chr(10)||'        v_deposit,','        public.resolve_booking_business(p_business_slug), v_appointment_id,'||chr(10)||'        v_deposit,');
   def:=replace(def,'pg_catalog.hashtextextended(v_phone, 0)','pg_catalog.hashtextextended(public.resolve_booking_business(p_business_slug)::text || v_phone, 0)');
   def:=replace(def,'pg_catalog.hashtextextended(p_start_at::TEXT, 1)','pg_catalog.hashtextextended(public.resolve_booking_business(p_business_slug)::text || p_start_at::TEXT, 1)');
  END IF;
  EXECUTE 'DROP FUNCTION '||ident;
  EXECUTE def;
 END LOOP;
END $migration$;
REVOKE ALL ON FUNCTION public.get_public_services(text),public.get_public_booking_settings(text),public.get_public_business_hours(text),public.get_available_slots(date,uuid[],text),public.create_public_appointment_v2(text,text,text,timestamptz,uuid[],text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_services(text),public.get_public_booking_settings(text),public.get_public_business_hours(text),public.get_available_slots(date,uuid[],text),public.create_public_appointment_v2(text,text,text,timestamptz,uuid[],text,text,text) TO anon,authenticated,service_role;
DO $migration$
DECLARE n text; def text;
BEGIN
 FOREACH n IN ARRAY ARRAY['approve_payment','reject_payment'] LOOP
  SELECT pg_get_functiondef(p.oid) INTO def FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname=n;
  def:=replace(def,'WHERE p.id = p_payment_id','WHERE p.business_id = public.current_business_id() AND a.business_id = public.current_business_id() AND p.id = p_payment_id');
  EXECUTE def;
 END LOOP;
END $migration$;
CREATE OR REPLACE FUNCTION public.create_public_appointment(p_full_name text,p_phone text,p_email text,p_start_at timestamptz,p_service_ids uuid[],p_payment_method text,p_client_notes text DEFAULT NULL) RETURNS TABLE(appointment_id uuid,payment_id uuid,payment_amount bigint,total_amount bigint,payment_deadline_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'Utiliza create_public_appointment_v2.'; END $$;
DROP POLICY payment_proofs_admin_read ON storage.objects;
CREATE POLICY payment_proofs_admin_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='payment-proofs' AND EXISTS(SELECT 1 FROM public.payments p WHERE p.proof_path=objects.name AND p.business_id=public.current_business_id()));
CREATE FUNCTION public.protect_business_identity() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN IF NEW.id<>OLD.id OR NEW.is_legacy<>OLD.is_legacy THEN RAISE EXCEPTION 'La identidad del negocio no se puede cambiar.'; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.protect_business_identity() FROM PUBLIC;
CREATE TRIGGER protect_business_identity BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.protect_business_identity();