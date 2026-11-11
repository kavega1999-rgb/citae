CREATE OR REPLACE FUNCTION public.delete_my_business(p_business_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE u uuid := (SELECT auth.uid());
BEGIN
  IF u IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=u AND business_id=p_business_id AND role='owner') THEN
    RAISE EXCEPTION 'No eres dueño de ese negocio.';
  END IF;
  DELETE FROM public.payments WHERE business_id=p_business_id;
  DELETE FROM public.appointment_services WHERE business_id=p_business_id;
  DELETE FROM public.appointments WHERE business_id=p_business_id;
  DELETE FROM public.clients WHERE business_id=p_business_id;
  DELETE FROM public.professional_services WHERE business_id=p_business_id;
  DELETE FROM public.professional_hours WHERE business_id=p_business_id;
  DELETE FROM public.professionals WHERE business_id=p_business_id;
  DELETE FROM public.services WHERE business_id=p_business_id;
  DELETE FROM public.business_hour_slots WHERE business_id=p_business_id;
  DELETE FROM public.business_hours WHERE business_id=p_business_id;
  DELETE FROM public.blocked_slots WHERE business_id=p_business_id;
  DELETE FROM public.business_settings WHERE business_id=p_business_id;
  UPDATE public.profiles SET active_business_id=NULL WHERE active_business_id=p_business_id;
  DELETE FROM public.user_roles WHERE business_id=p_business_id;
  DELETE FROM public.businesses WHERE id=p_business_id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.delete_my_business(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_business(uuid) TO authenticated;