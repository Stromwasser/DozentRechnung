-- Fix Storage RLS: "new row violates row-level security policy" on PDF upload
-- Path format: invoices/{user_id}/{invoice_number}.pdf
--
-- ВАЖНО: SQL Editor выдаёт "must be owner of table objects" — storage.objects
-- принадлежит Supabase. Используйте DASHBOARD UI (см. ниже).

-- ============ ВАРИАНТ 1: Через Dashboard UI (рекомендуется) ============
-- Supabase Dashboard → Storage → Bucket "invoices" → Policies
-- Добавьте 3 политики вручную:
--
-- 1) INSERT (Upload)
--    Name: invoices_upload_own
--    Policy: (bucket_id = 'invoices') AND ((storage.foldername(name))[2] = auth.uid()::text)
--
-- 2) SELECT (Read / createSignedUrl)
--    Name: invoices_select_own
--    Policy: (bucket_id = 'invoices') AND ((storage.foldername(name))[2] = auth.uid()::text)
--
-- 3) UPDATE (Upsert / overwrite)
--    Name: invoices_update_own
--    Policy: (bucket_id = 'invoices') AND ((storage.foldername(name))[2] = auth.uid()::text)
--
-- ============ ВАРИАНТ 2: SQL (только если postgres — superuser) ============
-- ALTER USER postgres WITH SUPERUSER;  -- затем выполните блок ниже

/*
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_upload_own" ON storage.objects;
CREATE POLICY "invoices_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "invoices_select_own" ON storage.objects;
CREATE POLICY "invoices_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

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
*/
