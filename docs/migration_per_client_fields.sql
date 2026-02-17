-- Migration: Per-Client-Einstellungen für unterschiedliche Träger
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS verwendungszweck text,
ADD COLUMN IF NOT EXISTS leistungsbeschreibung text,
ADD COLUMN IF NOT EXISTS zusatz_angaben text,
ADD COLUMN IF NOT EXISTS rechnung_preset text;

-- rechnung_preset: 'bamf_ik' | 'bsk' | 'sonstige'
