DROP POLICY IF EXISTS "Users can insert custom materials" ON public.materials;
CREATE POLICY "Users can insert custom materials"
ON public.materials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can update their own 3D models'
  ) THEN
    CREATE POLICY "Users can update their own 3D models"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'models3d' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'models3d' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;