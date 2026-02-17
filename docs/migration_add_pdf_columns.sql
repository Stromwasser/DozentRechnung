-- Migration: Add PDF columns to invoices table
-- Run in Supabase Dashboard → SQL Editor
-- Error: "Could not find the 'pdf_path' column of 'invoices'"

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS pdf_path text,
ADD COLUMN IF NOT EXISTS pdf_signed_url text,
ADD COLUMN IF NOT EXISTS pdf_url text,
ADD COLUMN IF NOT EXISTS pdf_url_expires_at timestamptz;
