DROP POLICY IF EXISTS "business_media_read" ON storage.objects;
CREATE POLICY "business_media_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'business-media' AND (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.logo_path = storage.objects.name)
    OR EXISTS (SELECT 1 FROM public.professionals p WHERE p.photo_path = storage.objects.name AND p.is_active)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role = 'owner' AND ur.business_id::text = (storage.foldername(storage.objects.name))[1])
  )
);