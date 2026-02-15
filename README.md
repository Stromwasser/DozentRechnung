# 📄 Dozent Invoicing App

A lightweight web app for **freelance lecturers (Dozenten)** in Germany to create, manage, and export invoices for integration courses.  
Built with **Vue 3 + Vite + TypeScript** and **Supabase** (Auth, Postgres, RLS). Deployed on **Vercel**.

<p align="left">
  <a href="https://vuejs.org/">![Vue](https://img.shields.io/badge/Vue_3-35495e?logo=vue.js&logoColor=4FC08D)</a>
  <a href="https://vitejs.dev/">![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)</a>
  <a href="https://supabase.com/">![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)</a>
  <a href="https://vercel.com/">![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)</a>
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
</p>

> **Live Demo:** _coming soon_  
> **PDF Example:** [`docs/Rechnung_2025-07-003.pdf`](docs/Rechnung_2025-07-003.pdf)

---

## ✨ Features

- 🔑 **Supabase Auth**: email sign‑up/sign‑in, protected routes
- 👤 **Provider Profile**: store lecturer’s details for reuse (planned)
- 👥 **Clients**: create & reuse clients across invoices (planned)
- 🧾 **Invoices**:
  - auto invoice number `YYYY-MM-XXX`
  - provider & client details
  - course / description
  - list of lessons (date, hours, hourly rate)
- 💾 **Persistence**: invoices saved to Supabase (`invoices`)
- 🧱 **Invoice Items**: per-lesson rows linked by `invoice_id` (planned)
- 🔒 **RLS**: each user sees only their data (enabled on `invoices`)
- 🧑‍💻 **Nice DX**: Vue 3 + `<script setup>` + TypeScript + Vite

---

## 🗂 Project Structure

src/
components/ # Reusable components (InvoiceForm, etc.)
views/ # Pages: InvoicesView, CustomersView, AuthView, ...
lib/ # Supabase client setup
router/ # Vue Router (protected routes)
assets/ # Static assets
docs/
screenshot-1.png # (add your screenshots)
Rechnung_2025-07-003.pdf

markdown
Kopieren
Bearbeiten

### Main Routes

- `/auth` — sign in / sign up
- `/invoice` — create a new invoice (default after login)
- `/invoices` — list & manage invoices
- `/customers` — (planned) manage clients
- `/profile` — (planned) manage provider profile

---

## 🛠 Tech Stack

- **Frontend:** Vue 3, Vite, TypeScript, (TailwindCSS optional)
- **Backend:** Supabase (PostgreSQL, Auth, Storage), RLS
- **Deploy:** Vercel (auto‑deploy on push to `main`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js **≥ 20.19** or **≥ 22.12**
- NPM or PNPM

### 1) Install

```bash
git clone https://github.com/your-username/dozent-rechnungen.git
cd dozent-rechnungen
npm install
```

### 2) Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3) Run Dev

```bash
npm run dev
```

### 4) Build

```bash
npm run build
```

---

## 🧾 Database (Supabase)
Tables used / planned:

Table	Purpose	Owner key
invoices	main invoice records	user_id (UUID)
invoice_items	per-lesson rows linked by invoice_id	via invoice_id
clients	user’s clients dictionary	user_id (UUID)
user_profile	provider data (lecturer profile)	user_id (UUID)

RLS is enabled on invoices. Apply similar owner‑based policies to other tables.

Example RLS Policy (pattern)
sql
Kopieren
Bearbeiten
-- Enable RLS
alter table public.invoices enable row level security;

-- Only owner can select/insert/update/delete
create policy "invoices_owner_select"
on public.invoices for select
using (auth.uid() = user_id);

create policy "invoices_owner_modify"
on public.invoices for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
Repeat analogous policies for invoice_items, clients, and user_profile with their respective owner fields.

## 📸 Screenshots

Put your images into `docs/` and reference them here.

<p align="center"> <img src="docs/screenshot-1.png" alt="Invoice Form" width="800"><br/> <em>Invoice form with auto number and lesson items</em> </p>

---

## 🧭 Roadmap

- [x] Save invoice_items after invoice insert
- [x] Clients: create/find & assign customer_id in invoices
- [x] Provider profile: store lecturer data by user_id
- [ ] RLS for invoice_items, clients, user_profile
- [x] PDF export (template-aligned) & download
- [ ] Mobile UI polish (iOS/Android)

---

## 🧪 Scripts

```bash
npm run dev         # start dev server
npm run build       # build for production
npm run preview     # preview production build
npm run test:unit   # Vitest
npm run test:e2e    # Playwright
npm run lint        # ESLint
npm run format      # Prettier (src/)
```

---

## 📦 Deployment (Vercel)

1. Connect repository to Vercel
2. Define environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
3. Push to `main` → Vercel auto-builds & deploys

---

## 📝 License

MIT — feel free to use, modify, and contribute.
