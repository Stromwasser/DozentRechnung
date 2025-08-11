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
