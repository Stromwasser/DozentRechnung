-- Fix RLS: "new row violates row-level security policy"
-- Run in Supabase Dashboard → SQL Editor
-- Ensures authenticated users can INSERT/SELECT/UPDATE/DELETE their own rows

-- ============ CLIENTS ============
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their clients
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
CREATE POLICY "clients_select_own" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own clients
DROP POLICY IF EXISTS "clients_insert_own" ON public.clients;
CREATE POLICY "clients_insert_own" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own clients
DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
CREATE POLICY "clients_update_own" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own clients
DROP POLICY IF EXISTS "clients_delete_own" ON public.clients;
CREATE POLICY "clients_delete_own" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- ============ USER_PROFILE ============
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profile_select_own" ON public.user_profile;
CREATE POLICY "user_profile_select_own" ON public.user_profile
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profile_insert_own" ON public.user_profile;
CREATE POLICY "user_profile_insert_own" ON public.user_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profile_update_own" ON public.user_profile;
CREATE POLICY "user_profile_update_own" ON public.user_profile
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ INVOICES ============
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_insert_own" ON public.invoices;
CREATE POLICY "invoices_insert_own" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_update_own" ON public.invoices;
CREATE POLICY "invoices_update_own" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_delete_own" ON public.invoices;
CREATE POLICY "invoices_delete_own" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- ============ INVOICE_ITEMS ============
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- invoice_items: allow access via invoice ownership (invoice must belong to user)
DROP POLICY IF EXISTS "invoice_items_select_own" ON public.invoice_items;
CREATE POLICY "invoice_items_select_own" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "invoice_items_insert_own" ON public.invoice_items;
CREATE POLICY "invoice_items_insert_own" ON public.invoice_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "invoice_items_update_own" ON public.invoice_items;
CREATE POLICY "invoice_items_update_own" ON public.invoice_items
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "invoice_items_delete_own" ON public.invoice_items;
CREATE POLICY "invoice_items_delete_own" ON public.invoice_items
  FOR DELETE USING (user_id = auth.uid());

-- ============ STORAGE (invoices bucket) ============
-- If PDF upload fails with RLS, add these in Dashboard → Storage → invoices → Policies:
-- Policy "Users can upload to own folder": INSERT with check (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text)
-- Policy "Users can read own files": SELECT with check (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text)
