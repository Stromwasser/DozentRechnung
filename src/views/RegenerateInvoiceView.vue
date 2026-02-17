<template>
  <div class="page">
    <template v-if="loading">Laden…</template>
    <template v-else-if="error">
      <p class="error">{{ error }}</p>
      <router-link to="/invoices" class="btn">← Zurück</router-link>
    </template>
    <template v-else>
      <header class="flex between">
        <h2>PDF neu erstellen</h2>
        <router-link to="/invoices" class="btn">← Zurück</router-link>
      </header>
      <p class="hint">Rechnung Nr. {{ invoice?.number }} — PDF wird neu erzeugt und gespeichert.</p>
      <div class="preview-wrap">
        <div id="invoice-preview">
          <InvoicePreview
            v-if="provider && client && invoice"
            :provider="provider"
            :client="client"
            :invoice="invoice"
            :items="items"
            :for-print="true"
          />
        </div>
      </div>
      <div class="actions">
        <button class="btn" @click="regenerate" :disabled="regenerating">
          {{ regenerating ? '… Erstelle PDF' : 'PDF neu erstellen' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { generateAndStoreInvoicePdf } from '@/composables/useInvoicePdf'
import InvoicePreview from '@/components/InvoicePreview.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref<string | null>(null)
const regenerating = ref(false)

type Provider = { name: string; addressLine1: string; addressLine2: string; phone: string; email: string; taxNumber: string; iban: string; bic: string }
type Client = { name: string; addressLine1: string; addressLine2: string; phone: string; email: string; leistungsbeschreibung?: string; verwendungszweck?: string; rechnung_preset?: string }
type InvoiceItem = { date: string; hours: number; rate: number; course?: string }
type Invoice = { number: string; date: string; courseOverview: string; items: InvoiceItem[] }

const provider = ref<Provider | null>(null)
const client = ref<Client | null>(null)
const invoice = ref<Invoice | null>(null)
const items = computed(() => invoice.value?.items ?? [])

const invoiceId = route.params.id as string
const userId = ref<string | null>(null)

onMounted(async () => {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) {
    error.value = 'Nicht eingeloggt.'
    loading.value = false
    return
  }
  userId.value = user.id

  const { data: invRow, error: invErr } = await supabase
    .from('invoices')
    .select('id, number, date, course_overview, total, client_id, clients(name, address_line1, address_line2, phone, email, leistungsbeschreibung, verwendungszweck, rechnung_preset, company_line1, company_line2, company_line3)')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single()

  if (invErr || !invRow) {
    error.value = invErr?.message ?? 'Rechnung nicht gefunden.'
    loading.value = false
    return
  }

  const { data: itemsRows } = await supabase
    .from('invoice_items')
    .select('date, hours, rate, course, amount')
    .eq('invoice_id', invoiceId)
    .order('date')

  const { data: profile } = await supabase
    .from('user_profile')
    .select('name, address_line1, address_line2, phone, email, tax_number, iban, bic')
    .eq('id', user.id)
    .single()

  if (!profile) {
    error.value = 'Profil nicht gefunden.'
    loading.value = false
    return
  }

  const c = Array.isArray(invRow.clients) ? invRow.clients[0] : invRow.clients
  const clientName = c?.name ?? [c?.company_line1, c?.company_line2, c?.company_line3].filter(Boolean).join(' · ') ?? ''

  provider.value = {
    name: profile.name ?? '',
    addressLine1: profile.address_line1 ?? '',
    addressLine2: profile.address_line2 ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    taxNumber: profile.tax_number ?? '',
    iban: profile.iban ?? '',
    bic: profile.bic ?? '',
  }

  client.value = {
    name: clientName,
    addressLine1: c?.address_line1 ?? '',
    addressLine2: c?.address_line2 ?? '',
    phone: c?.phone ?? '',
    email: c?.email ?? '',
    leistungsbeschreibung: c?.leistungsbeschreibung ?? '',
    verwendungszweck: c?.verwendungszweck ?? null,
    rechnung_preset: c?.rechnung_preset ?? '',
  }

  const courseOverview = (invRow.course_overview || '').trim()
  invoice.value = {
    number: invRow.number,
    date: invRow.date,
    courseOverview,
    items: (itemsRows ?? []).map((r: { date: string; hours: number; rate: number; course?: string; amount?: number }) => {
      let hours = Number(r.hours) || 0
      let rate = Number(r.rate) || 0
      const amount = Number(r.amount) || 0
      if (amount && (hours === 0 || rate === 0)) {
        if (rate > 0) hours = amount / rate
        else if (hours > 0) rate = amount / hours
        else { hours = 1; rate = amount }
      }
      return {
        date: r.date,
        hours,
        rate,
        course: (r.course || '').trim(),
      }
    }),
  }

  loading.value = false
})

async function regenerate() {
  if (!userId.value || !invoice.value) return
  regenerating.value = true
  try {
    await generateAndStoreInvoicePdf({
      userId: userId.value,
      invoiceId,
      invoiceNumber: invoice.value.number,
    })
    router.replace({ path: '/invoices', query: { _: Date.now() } })
  } catch (e) {
    console.error('Regenerate PDF:', e)
    alert('Fehler: ' + (e instanceof Error ? e.message : String(e)))
  } finally {
    regenerating.value = false
  }
}
</script>

<style scoped>
.preview-wrap {
  margin: 1rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}
.hint { color: #666; margin-bottom: 1rem; }
.actions { margin-top: 1rem; }
.error { color: #c00; margin-bottom: 1rem; }
</style>
