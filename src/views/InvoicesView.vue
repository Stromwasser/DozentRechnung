<template>
  <div class="page">
    <header class="flex between">
      <h2>Deine Rechnungen</h2>
      <div class="actions">
        <button class="btn" @click="exportEuer" :disabled="!invoices.length" title="EÜR-Export für Steuerberater">
          📊 EÜR-Export
        </button>
        <button class="btn" @click="reload">🔄 Aktualisieren</button>
        <router-link class="btn" :to="{ name: 'invoice-new' }">+ Neue Rechnung</router-link>
      </div>
    </header>

    <div v-if="invoices.length" class="invoices-container">
      <table class="tbl tbl-desktop">
        <thead>
          <tr>
            <th>Nr</th>
            <th>Datum</th>
            <th>Kunde</th>
            <th>Total (€)</th>
            <th>PDF</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in invoices" :key="inv.id">
            <td>{{ inv.number }}</td>
            <td>{{ fmtDate(inv.date) }}</td>
            <td>{{ inv.client_name || '—' }}</td>
            <td class="num">{{ fmtMoney(inv.total) }}</td>
            <td>
              <button v-if="inv.pdf_path" class="btn link" @click="openPdf(inv)">Öffnen</button>
              <router-link v-else :to="{ name: 'invoice-regenerate', params: { id: inv.id } }" class="btn link">PDF neu erstellen</router-link>
            </td>
            <td>
              <router-link :to="{ name: 'invoice-edit', params: { id: inv.id } }" class="btn link">Bearbeiten</router-link>
              <button class="btn danger" @click="remove(inv.id)" :disabled="removingId === inv.id">
                {{ removingId === inv.id ? 'Lösche…' : 'Löschen' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="invoice-cards">
        <div v-for="inv in invoices" :key="inv.id" class="invoice-card">
          <div class="card-row"><span class="card-label">Nr</span>{{ inv.number }}</div>
          <div class="card-row"><span class="card-label">Datum</span>{{ fmtDate(inv.date) }}</div>
          <div class="card-row"><span class="card-label">Kunde</span>{{ inv.client_name || '—' }}</div>
          <div class="card-row"><span class="card-label">Total</span>{{ fmtMoney(inv.total) }} €</div>
          <div class="card-row card-actions">
            <button v-if="inv.pdf_path" class="btn link" @click="openPdf(inv)">Öffnen</button>
            <router-link v-else :to="{ name: 'invoice-regenerate', params: { id: inv.id } }" class="btn link">PDF neu erstellen</router-link>
            <router-link :to="{ name: 'invoice-edit', params: { id: inv.id } }" class="btn link">Bearbeiten</router-link>
            <button class="btn danger" @click="remove(inv.id)" :disabled="removingId === inv.id">
              {{ removingId === inv.id ? 'Lösche…' : 'Löschen' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-else>Keine Rechnungen gefunden.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { localListInvoiceSummaries, localDeleteInvoice } from '@/lib/localStore'
import { getPdfBlob } from '@/lib/localPdfDb'

type InvoiceRow = {
  id: string
  number: string
  date: string
  total: number
  course_overview?: string | null
  pdf_signed_url: string | null
  pdf_url: string | null
  pdf_path: string | null
  pdf_url_expires_at: string | null
  client_name?: string | null
}

const invoices = ref<InvoiceRow[]>([])
const removingId = ref<string | null>(null)

function reload() {
  invoices.value = localListInvoiceSummaries()
}

async function openPdf(inv: InvoiceRow): Promise<void> {
  const blob = await getPdfBlob(inv.id)
  if (!blob) {
    alert('PDF nicht im Browser gespeichert. Bitte «PDF neu erstellen» verwenden.')
    return
  }
  const u = URL.createObjectURL(blob)
  window.open(u, '_blank')
  setTimeout(() => URL.revokeObjectURL(u), 60_000)
}

function fmtDate(d: string): string {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))
}

function fmtMoney(v: number): string {
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

function exportEuer(): void {
  const rows = invoices.value
  if (!rows.length) return
  const bom = '﻿'
  const header = 'Datum;Kunde;Betrag;Beschreibung;Rechnungsnr'
  const lines = rows.map((inv) => {
    const date = fmtDate(inv.date)
    const client = (inv.client_name || '').replace(/;/g, ',')
    const amount = inv.total.toFixed(2).replace('.', ',')
    const desc = (inv.course_overview || 'Unterricht Integrationskurs').replace(/;/g, ',')
    return `${date};${client};${amount};${desc};${inv.number}`
  })
  const csv = bom + header + '\n' + lines.join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `EÜR-Export_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

async function remove(id: string): Promise<void> {
  if (!confirm('Diese Rechnung wirklich löschen?')) return
  removingId.value = id
  await localDeleteInvoice(id)
  removingId.value = null
  reload()
}

onMounted(reload)
</script>

<style scoped>
.page { padding: 16px; }
.flex.between { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 8px; }
.actions { display: flex; gap: 8px; }
.btn { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 6px; text-decoration: none; background: #fff; cursor: pointer; }
.btn:disabled { opacity: 0.6; cursor: default; }
.btn.danger { border-color: #ef4444; color: #ef4444; }
.btn.link { border-color: #3b82f6; color: #3b82f6; font-size: 0.875rem; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th, .tbl td { padding: 8px 10px; border-bottom: 1px solid #eee; text-align: left; }
.tbl .num { text-align: right; }

.invoice-cards { display: none; }
@media (max-width: 640px) {
  .tbl-desktop { display: none; }
  .invoice-cards { display: flex; flex-direction: column; gap: 1rem; }
  .invoice-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .card-row { padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; }
  .card-row:last-child { border-bottom: none; }
  .card-label { display: inline-block; min-width: 4rem; color: #6b7280; font-size: 0.875rem; }
  .card-actions { display: flex; gap: 0.5rem; padding-top: 0.75rem; }
  .card-actions .btn { min-height: 44px; padding: 0.5rem 1rem; flex: 1; text-align: center; }
}
</style>
