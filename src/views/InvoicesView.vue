<template>
  <div class="page">
    <header class="flex between">
      <h2>Deine Rechnungen</h2>
      <div class="actions">
        <button class="btn" @click="exportEuer" :disabled="loading || !invoices.length" title="EÜR-Export für Steuerberater">
          📊 EÜR-Export
        </button>
        <button class="btn" @click="reload" :disabled="loading">
          🔄 {{ loading ? 'Refreshing…' : 'Aktualisieren' }}
        </button>
        <router-link class="btn" :to="{ name: 'invoice-new' }">+ Neue Rechnung</router-link>
      </div>
    </header>

    <template v-if="loading">Loading…</template>

    <div v-else-if="invoices.length" class="invoices-container">
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
              <button v-if="inv.pdf_path" class="btn link" @click="openPdf(inv)" :disabled="regeneratingId === inv.id">
                {{ regeneratingId === inv.id ? '…' : 'Öffnen' }}
              </button>
              <router-link v-else :to="{ name: 'invoice-regenerate', params: { id: inv.id } }" class="btn link" title="PDF neu erzeugen (für alte Rechnungen ohne pdf_path)">PDF neu erstellen</router-link>
            </td>
            <td>
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
            <button v-if="inv.pdf_path" class="btn link" @click="openPdf(inv)" :disabled="regeneratingId === inv.id">
              {{ regeneratingId === inv.id ? '…' : 'Öffnen' }}
            </button>
            <router-link v-else :to="{ name: 'invoice-regenerate', params: { id: inv.id } }" class="btn link">PDF neu erstellen</router-link>
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
import { supabase } from '@/lib/supabaseClient'

/** Raw row as returned by Supabase; `clients` may be an object or an array */
type ClientRaw = {
  name?: string | null
  company_line1?: string | null
  company_line2?: string | null
  company_line3?: string | null
}

type InvoiceRowRaw = {
  id: string
  number: string
  date: string
  total: number
  course_overview?: string | null
  pdf_signed_url: string | null
  pdf_url: string | null
  pdf_path: string | null
  pdf_url_expires_at: string | null
  clients?: ClientRaw | ClientRaw[] | null
}

/** UI row shape used in the table */
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
const loading = ref<boolean>(true)
const removingId = ref<string | null>(null)
const regeneratingId = ref<string | null>(null)

/** Open PDF: always regenerate fresh signed URL when pdf_path exists (avoids expired link → 400 InvalidJWT) */
async function openPdf(inv: InvoiceRow): Promise<void> {
  if (!inv.pdf_path) {
    alert('PDF-Pfad fehlt. Bitte Rechnung erneut speichern.')
    return
  }
  regeneratingId.value = inv.id
  try {
    const expiresIn = 60 * 60 * 24 * 7
    const { data, error } = await supabase.storage.from('invoices').createSignedUrl(inv.pdf_path, expiresIn)
    if (error) {
      console.error('createSignedUrl error:', { path: inv.pdf_path, error })
      throw error
    }
    if (data?.signedUrl) {
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
      const { error: updateErr } = await supabase.from('invoices').update({
        pdf_signed_url: data.signedUrl,
        pdf_url_expires_at: expiresAt,
      }).eq('id', inv.id)
      if (updateErr) console.warn('Update pdf_signed_url:', updateErr)
      inv.pdf_signed_url = data.signedUrl
      inv.pdf_url_expires_at = expiresAt
      window.open(data.signedUrl, '_blank')
    } else {
      throw new Error('Keine URL erhalten')
    }
  } catch (e) {
    console.error('PDF öffnen:', e)
    const msg = e instanceof Error ? e.message : String(e)
    alert('PDF konnte nicht geöffnet werden: ' + msg)
  } finally {
    regeneratingId.value = null
  }
}

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

  let { data, error } = await supabase
    .from('invoices')
    .select('id, number, date, total, course_overview, pdf_signed_url, pdf_url, pdf_path, pdf_url_expires_at, clients(name, company_line1, company_line2, company_line3)')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) {
    console.warn('Invoices with clients join failed:', error.message, '- trying without join')
    const fallback = await supabase
      .from('invoices')
      .select('id, number, date, total, course_overview, pdf_signed_url, pdf_url, pdf_path, pdf_url_expires_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (fallback.error) {
      console.error('Failed to load invoices:', fallback.error.message)
      invoices.value = []
      loading.value = false
      return
    }
    data = fallback.data
    error = null
  }

  const rows = (data ?? []) as unknown as InvoiceRowRaw[]
  invoices.value = rows.map((r): InvoiceRow => {
    const c = Array.isArray(r.clients) ? r.clients[0] : r.clients
    const clientName = c
      ? c.name ||
        [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(' · ') ||
        null
      : null

    return {
      id: r.id,
      number: r.number,
      date: r.date,
      total: r.total,
      course_overview: r.course_overview ?? null,
      pdf_signed_url: r.pdf_signed_url,
      pdf_url: r.pdf_url ?? null,
      pdf_path: r.pdf_path ?? null,
      pdf_url_expires_at: r.pdf_url_expires_at ?? null,
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

/** EÜR-Export: CSV für Steuerberater (Datum;Kunde;Betrag;Beschreibung) */
function exportEuer(): void {
  const rows = invoices.value
  if (!rows.length) return

  const bom = '\uFEFF' // UTF-8 BOM for Excel
  const header = 'Datum;Kunde;Betrag;Beschreibung;Rechnungsnr'
  const lines = rows.map((inv) => {
    const date = fmtDate(inv.date)
    const client = (inv.client_name || '').replace(/;/g, ',')
    const amount = inv.total.toFixed(2).replace('.', ',')
    const desc = (inv.course_overview || 'Unterricht Integrationskurs').replace(/;/g, ',')
    return `${date};${client};${amount};${desc};${inv.number}`
  })
  const csv = bom + header + '\n' + lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `EÜR-Export_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
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
.btn.link {
  border-color: #3b82f6;
  color: #3b82f6;
  font-size: 0.875rem;
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

/* Mobile: cards instead of table */
.invoice-cards {
  display: none;
}
@media (max-width: 640px) {
  .tbl-desktop {
    display: none;
  }
  .invoice-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .invoice-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .card-row {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .card-row:last-child {
    border-bottom: none;
  }
  .card-label {
    display: inline-block;
    min-width: 4rem;
    color: #6b7280;
    font-size: 0.875rem;
  }
  .card-actions {
    display: flex;
    gap: 0.5rem;
    padding-top: 0.75rem;
  }
  .card-actions .btn {
    min-height: 44px;
    padding: 0.5rem 1rem;
    flex: 1;
    text-align: center;
  }
}
</style>
