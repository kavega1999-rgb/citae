ALTER TABLE public.profiles ADD COLUMN active_business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.current_business_id()
 RETURNS uuid LANGUAGE sql STABLE SET search_path TO ''
AS $$
  SELECT ur.business_id FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'owner'
  ORDER BY (ur.business_id = p.active_business_id) DESC NULLS LAST, ur.created_at
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.create_my_business(p_name text, p_slug text, p_activity text, p_agenda_mode text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE b uuid; u uuid := (SELECT auth.uid());
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Inicia sesión para crear tu negocio.'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,47));
 IF (SELECT count(*) FROM public.user_roles WHERE user_id=u) >= 10 THEN RAISE EXCEPTION 'Alcanzaste el máximo de 10 negocios por cuenta.'; END IF;
 IF p_name IS NULL OR length(trim(p_name)) NOT BETWEEN 1 AND 150 OR p_slug IS NULL OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(p_slug) NOT BETWEEN 3 AND 80 OR p_activity IS NULL OR length(trim(p_activity)) NOT BETWEEN 1 AND 150 OR p_agenda_mode IS NULL OR p_agenda_mode NOT IN ('business','solo') THEN RAISE EXCEPTION 'Revisa el nombre, enlace, actividad y modalidad del negocio.'; END IF;
 INSERT INTO public.profiles(id,full_name) VALUES(u,trim(p_name)) ON CONFLICT(id) DO NOTHING;
 INSERT INTO public.businesses(name,slug,activity,agenda_mode) VALUES(trim(p_name),p_slug,trim(p_activity),p_agenda_mode) RETURNING id INTO b;
 INSERT INTO public.user_roles(user_id,business_id) VALUES(u,b);
 INSERT INTO public.business_settings(business_id,business_name) VALUES(b,trim(p_name));
 UPDATE public.profiles SET active_business_id=b WHERE id=u;
 RETURN b;
END $function$;

CREATE FUNCTION public.list_my_businesses()
 RETURNS TABLE(id uuid, name text, slug text, is_active boolean)
 LANGUAGE sql STABLE SET search_path TO ''
AS $$
  SELECT b.id, b.name, b.slug, b.id = public.current_business_id()
  FROM public.user_roles ur JOIN public.businesses b ON b.id = ur.business_id
  WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'owner'
  ORDER BY ur.created_at
$$;
REVOKE ALL ON FUNCTION public.list_my_businesses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_businesses() TO authenticated, service_role;

CREATE FUNCTION public.set_active_business(p_business_id uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE u uuid := (SELECT auth.uid());
BEGIN
  IF u IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = u AND business_id = p_business_id AND role = 'owner') THEN
    RAISE EXCEPTION 'No eres dueño de ese negocio.';
  END IF;
  UPDATE public.profiles SET active_business_id = p_business_id WHERE id = u;
  RETURN true;
END $$;
COMMENT ON FUNCTION public.set_active_business(uuid) IS 'Signed-in owners switch only among businesses they own.';
REVOKE ALL ON FUNCTION public.set_active_business(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_active_business(uuid) TO authenticated, service_role;