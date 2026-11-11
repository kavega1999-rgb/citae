DO $fix$
DECLARE def text;
BEGIN
 SELECT pg_get_functiondef(oid) INTO def FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='get_public_appointment';
 def:=replace(def,'''appointment_id'', a.id,','''appointment_id'', a.id, ''business_id'', a.business_id,');
 EXECUTE def;
END $fix$;
CREATE FUNCTION public.sync_business_name() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN UPDATE public.businesses SET name=NEW.business_name WHERE id=NEW.business_id; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.sync_business_name() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_business_name AFTER UPDATE OF business_name ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.sync_business_name();
DO $tests$
DECLARE b1 uuid:=gen_random_uuid(); b2 uuid:=gen_random_uuid(); c1 uuid:=gen_random_uuid(); c2 uuid:=gen_random_uuid(); s1 uuid:=gen_random_uuid(); s2 uuid:=gen_random_uuid(); a1 uuid:=gen_random_uuid(); a2 uuid:=gen_random_uuid(); u uuid; slug1 text:='test-'||replace(gen_random_uuid()::text,'-',''); slug2 text:='test-'||replace(gen_random_uuid()::text,'-',''); v jsonb; testtime timestamptz; r record; denied boolean;
BEGIN
 BEGIN
  INSERT INTO public.businesses(id,name,slug,activity) VALUES(b1,'Isolation test A',slug1,'test'),(b2,'Isolation test B',slug2,'test');
  INSERT INTO public.business_settings(business_id,business_name) VALUES(b1,'Isolation test A'),(b2,'Isolation test B');
  INSERT INTO public.services(id,business_id,name,price,duration_minutes) VALUES(s1,b1,'Test A',10000,30),(s2,b2,'Test B',20000,30);
  INSERT INTO public.clients(id,business_id,full_name,phone) VALUES(c1,b1,'Test A','test-a'),(c2,b2,'Test B','test-b');
  INSERT INTO public.business_hours(business_id,weekday,opens_at,closes_at) SELECT b,d,'09:00','17:00' FROM unnest(ARRAY[b1,b2]) b CROSS JOIN generate_series(0,6) d;
  IF (SELECT count(*) FROM public.get_public_services(slug1))<>1 OR (SELECT id FROM public.get_public_services(slug1))<>s1 THEN RAISE EXCEPTION 'Catalog isolation failed'; END IF;
  IF (SELECT business_name FROM public.get_public_booking_settings(slug2))<>'Isolation test B' THEN RAISE EXCEPTION 'Settings isolation failed'; END IF;
  denied:=false; BEGIN PERFORM public.get_available_slots((now()+interval '2 days')::date,ARRAY[s2],slug1); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Cross-business service accepted'; END IF;
  SELECT slot_start INTO testtime FROM public.get_available_slots((now()+interval '2 days')::date,ARRAY[s1],slug1) LIMIT 1;
  IF testtime IS NULL THEN RAISE EXCEPTION 'Test slot unavailable'; END IF;
  SELECT * INTO r FROM public.create_public_appointment_v2('Test A','test-a','',testtime,ARRAY[s1],'nequi',NULL,slug1);
  IF (SELECT business_id FROM public.appointments WHERE id=r.appointment_id)<>b1 THEN RAISE EXCEPTION 'Booking tenant missing'; END IF;
  v:=public.get_public_appointment(r.appointment_id,r.access_token);
  IF (v->>'business_id')::uuid<>b1 THEN RAISE EXCEPTION 'Token booking business missing'; END IF;
  SELECT * INTO r FROM public.create_public_appointment_v2('Test B','test-b','',testtime,ARRAY[s2],'nequi',NULL,slug2);
  IF (SELECT business_id FROM public.appointments WHERE id=r.appointment_id)<>b2 THEN RAISE EXCEPTION 'Simultaneous business booking failed'; END IF;
  denied:=false; BEGIN INSERT INTO public.appointments(business_id,client_id,start_at,end_at,duration_minutes,total_amount,status) VALUES(b1,c2,testtime+interval '2 hours',testtime+interval '3 hours',60,10000,'confirmed'); EXCEPTION WHEN foreign_key_violation THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Cross-business client reference accepted'; END IF;
  SELECT user_id INTO u FROM public.user_roles LIMIT 1;
  PERFORM set_config('request.jwt.claim.sub',u::text,true);
  SET LOCAL ROLE authenticated;
  IF EXISTS(SELECT 1 FROM public.clients WHERE business_id IN (b1,b2)) THEN RAISE EXCEPTION 'Owner sees foreign clients'; END IF;
  UPDATE public.services SET price=1 WHERE id=s1;
  IF FOUND THEN RAISE EXCEPTION 'Owner changed foreign services'; END IF;
  denied:=false; BEGIN PERFORM public.approve_payment((SELECT payment_id FROM public.create_public_appointment_v2('Blocked','blocked','',testtime+interval '4 hours',ARRAY[s1],'nequi',NULL,slug1))); EXCEPTION WHEN raise_exception THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Foreign payment approval accepted'; END IF;
  RESET ROLE;
  RAISE EXCEPTION USING ERRCODE='Z0001', MESSAGE='Rollback successful tenant tests';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
 END;
END $tests$;