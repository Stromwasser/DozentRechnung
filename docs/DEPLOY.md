# Deploy auf Vercel

## 1. Voraussetzungen

- GitHub-Repo mit dem Code
- Vercel-Account (vercel.com)
- Supabase-Projekt mit allen Migrations

## 2. Environment Variables in Vercel

In Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Wert | Beschreibung |
|----------|------|--------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key |

**Wichtig:** Diese Variablen müssen für Production gesetzt sein.

## 3. Deploy

### Option A: Vercel Dashboard (Git-Integration)

1. vercel.com → Add New Project
2. GitHub-Repo verbinden
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Root Directory: `.` (oder leer)
7. Environment Variables eintragen (siehe oben)
8. Deploy

### Option B: Vercel CLI

```bash
# Einmalig: Vercel CLI installieren
npm i -g vercel

# Im Projektordner
cd dozent-rechnungen
vercel

# Bei Fragen: Y (Link to existing project?) oder N (Create new)
# Env vars: bei vercel --prod werden sie abgefragt oder in Dashboard setzen
```

## 4. Supabase Migrations prüfen

Vor dem ersten Einsatz alle SQL-Migrations in Supabase ausführen:

- `docs/migration_add_pdf_columns.sql`
- `docs/fix_rls_policies.sql`
- `docs/fix_storage_rls.sql` → **via Dashboard UI** (Storage → Policies)
- `docs/migration_per_client_fields.sql`

## 5. Nach dem Deploy

- Auth testen (Registrierung, Login)
- Rechnung erstellen → PDF → Öffnen
- Kunden anlegen
- EÜR-Export prüfen
