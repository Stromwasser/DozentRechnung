<template>
  <div class="dashboard">
    <h1 class="dashboard-title">📊 Dashboard</h1>

    <template v-if="loading">
      <p class="text-gray-600">Laden…</p>
    </template>
    <template v-else>
      <div class="stats">
        <div class="stat-card">
          <span class="stat-label">Rechnungen gesamt</span>
          <span class="stat-value">{{ invoices.length }}</span>
        </div>
        <div class="stat-card highlight">
          <span class="stat-label">Einnahmen gesamt</span>
          <span class="stat-value">{{ fmtMoney(totalRevenue) }} €</span>
        </div>
      </div>

      <div class="dashboard-actions">
        <router-link to="/invoice" class="btn primary">+ Neue Rechnung</router-link>
        <router-link to="/invoices" class="btn">📋 Alle Rechnungen</router-link>
      </div>

      <section v-if="invoices.length" class="recent">
        <h2>Letzte Rechnungen</h2>
        <ul class="invoice-list">
          <li v-for="inv in recentInvoices" :key="inv.id" class="invoice-item">
            <div class="inv-info">
              <span class="inv-number">{{ inv.number }}</span>
              <span class="inv-date">{{ fmtDate(inv.date) }}</span>
              <span class="inv-client">{{ inv.client_name || '—' }}</span>
            </div>
            <div class="inv-total">{{ fmtMoney(inv.total) }} €</div>
            <router-link :to="{ name: 'invoices' }" class="btn small">Liste</router-link>
          </li>
        </ul>
      </section>
      <p v-else class="empty">Noch keine Rechnungen. Erstellen Sie Ihre erste Rechnung.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type ClientRaw = { name?: string | null; company_line1?: string | null; company_line2?: string | null; company_line3?: string | null }
type InvoiceRow = {
  id: string
  number: string
  date: string
  total: number
  client_name: string
}

const invoices = ref<InvoiceRow[]>([])
const loading = ref(true)

const totalRevenue = computed(() =>
  invoices.value.reduce((sum, inv) => sum + inv.total, 0)
)

const recentInvoices = computed(() =>
  invoices.value.slice(0, 5)
)

function fmtDate(d: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(d))
}

function fmtMoney(v: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

onMounted(async () => {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) {
    loading.value = false
    return
  }
  const { data } = await supabase
    .from('invoices')
    .select('id, number, date, total, clients(name, company_line1, company_line2, company_line3)')
    .eq('user_id', user.id)
    .order('number', { ascending: false })
  const raw = (data ?? []) as Array<{
    id: string
    number: string
    date: string
    total: number
    clients?: ClientRaw | ClientRaw[] | null
  }>
  invoices.value = raw.map((r) => {
    const c = Array.isArray(r.clients) ? r.clients[0] : r.clients
    const clientName = c
      ? c.name || [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(' · ') || '—'
      : '—'
    return { id: r.id, number: r.number, date: r.date, total: r.total, client_name: clientName }
  })
  loading.value = false
})
</script>

<style scoped>
.dashboard {
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}
.dashboard-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}
.stat-card.highlight {
  background: #eff6ff;
  border-color: #3b82f6;
}
.stat-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}
.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
}
.dashboard-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.dashboard-actions .btn {
  padding: 0.75rem 1rem;
  min-height: 44px;
  text-decoration: none;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
}
.dashboard-actions .btn.primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}
.recent h2 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}
.invoice-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.invoice-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}
.inv-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.inv-number {
  font-weight: 600;
}
.inv-date, .inv-client {
  font-size: 0.875rem;
  color: #6b7280;
}
.inv-total {
  font-weight: 600;
}
.btn.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  text-decoration: none;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
}
.empty {
  color: #6b7280;
}
</style>
