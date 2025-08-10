<template>
  <div class="page">
    <header class="flex between">
      <h2>Deine Rechnungen</h2>
      <div class="actions">
        <button class="btn" @click="reload" :disabled="loading">
          🔄 {{ loading ? 'Refreshing…' : 'Refresh invoices' }}
        </button>
        <router-link class="btn" :to="{ name: 'invoice-new' }">+ Neue Rechnung</router-link>
      </div>
    </header>

    <template v-if="loading">Loading…</template>

    <table class="tbl" v-else-if="invoices.length">
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
            <a v-if="inv.pdf_url" :href="inv.pdf_url" target="_blank" rel="noopener">Öffnen</a>
            <span v-else>—</span>
          </td>
          <td>
            <button class="btn danger" @click="remove(inv.id)" :disabled="removingId === inv.id">
              {{ removingId === inv.id ? 'Lösche…' : 'Löschen' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>Keine Rechnungen gefunden.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

/** Raw row as returned by Supabase; `clients` may be an object or an array */
type InvoiceRowRaw = {
  id: string
  number: string
  date: string
  total: number
  pdf_url: string | null
  clients?: { name: string | null } | { name: string | null }[] | null
}

/** UI row shape used in the table */
type InvoiceRow = {
  id: string
  number: string
  date: string
  total: number
  pdf_url: string | null
  client_name?: string | null
}

const invoices = ref<InvoiceRow[]>([])
const loading = ref<boolean>(true)
const removingId = ref<string | null>(null)

/** Format date as DD.MM.YYYY */
function fmtDate(d: string): string {
  const dt = new Date(d)
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dt)
}

/** Format money with 2 decimals in de-DE locale */
function fmtMoney(v: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

/** Fetch invoices for the given user and normalize client name */
async function fetchInvoices(userId: string): Promise<void> {
  loading.value = true

  const { data, error } = await supabase
    .from('invoices')
    .select('id, number, date, total, pdf_url, clients(name)')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Failed to load invoices:', error.message)
    invoices.value = []
    loading.value = false
    return
  }

  const rows = (data ?? []) as unknown as InvoiceRowRaw[]
  invoices.value = rows.map((r): InvoiceRow => {
    const clientName = Array.isArray(r.clients)
      ? (r.clients[0]?.name ?? null)
      : (r.clients?.name ?? null)

    return {
      id: r.id,
      number: r.number,
      date: r.date,
      total: r.total,
      pdf_url: r.pdf_url,
      client_name: clientName,
    }
  })

  loading.value = false
}

/** Public handler to reload the table on demand */
async function reload(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (user) await fetchInvoices(user.id)
}

/** Delete an invoice by id and refresh */
async function remove(id: string): Promise<void> {
  const yes = confirm('Diese Rechnung wirklich löschen?')
  if (!yes) return
  removingId.value = id

  const { error } = await supabase.from('invoices').delete().eq('id', id)

  removingId.value = null
  if (error) {
    alert('Delete failed: ' + error.message)
    return
  }
  await reload()
}

onMounted(async () => {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) {
    loading.value = false
    return
  }
  await fetchInvoices(user.id)
})
</script>

<style scoped>
.page {
  padding: 16px;
}
.flex.between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}
.actions {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  text-decoration: none;
  background: #fff;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.btn.danger {
  border-color: #ef4444;
  color: #ef4444;
}
.tbl {
  width: 100%;
  border-collapse: collapse;
}
.tbl th,
.tbl td {
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
}
.tbl .num {
  text-align: right;
}
</style>
