# Supabase Migration Checklist

**Выполняйте в Supabase Dashboard → SQL Editor** (по порядку).

## 1. Колонки для PDF
```sql
-- docs/migration_add_pdf_columns.sql
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS pdf_path text,
ADD COLUMN IF NOT EXISTS pdf_signed_url text,
ADD COLUMN IF NOT EXISTS pdf_url text,
ADD COLUMN IF NOT EXISTS pdf_url_expires_at timestamptz;
```

## 2. RLS для таблиц (clients, user_profile, invoices, invoice_items)
Выполните весь файл **`docs/fix_rls_policies.sql`**.

## 3. RLS для Storage (бакет `invoices`)
**Не через SQL!** SQL Editor выдаёт "must be owner of table objects".

**Через Dashboard UI:**
1. Supabase Dashboard → **Storage** → выберите бакет **invoices**
2. Вкладка **Policies** → **New policy**
3. Добавьте 3 политики (см. `docs/fix_storage_rls.sql`):
   - **INSERT**: `(bucket_id = 'invoices') AND ((storage.foldername(name))[2] = auth.uid()::text)`
   - **SELECT**: то же выражение (для createSignedUrl / «Öffnen»)
   - **UPDATE**: то же выражение (для upsert)

Без политик Storage кнопка «Öffnen» не работает.

## 4. Per-Client-Felder (опционально)
```sql
-- docs/migration_per_client_fields.sql
```

---

**Проверка:** после выполнения Storage RLS создайте новую Rechnung → PDF → кнопка «Öffnen» должна открывать PDF без ошибок.
