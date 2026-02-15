-- Fix Storage RLS: "new row violates row-level security policy" on PDF upload
-- Run in Supabase Dashboard → SQL Editor
-- Path format: invoices/{user_id}/{invoice_number}.pdf

-- Enable RLS on storage.objects (usually already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload to their own folder (invoices/{user_id}/...)
DROP POLICY IF EXISTS "invoices_upload_own" ON storage.objects;
CREATE POLICY "invoices_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to read their own files
DROP POLICY IF EXISTS "invoices_select_own" ON storage.objects;
CREATE POLICY "invoices_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to update/overwrite their own files (upsert)
DROP POLICY IF EXISTS "invoices_update_own" ON storage.objects;
CREATE POLICY "invoices_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
