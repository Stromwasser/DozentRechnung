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
        <button class="btn primary" @click="regenerate" :disabled="regenerating">
          {{ regenerating ? '… Erstelle PDF' : 'PDF neu erstellen' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { localGetInvoiceById, localGetClientById, localGetProfile } from '@/lib/localStore'
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

onMounted(() => {
  const invRow = localGetInvoiceById(invoiceId)
  if (!invRow) {
    error.value = 'Rechnung nicht gefunden.'
    loading.value = false
    return
  }

  const c = localGetClientById(invRow.client_id)
  const clientName = c?.name ?? [c?.company_line1, c?.company_line2, c?.company_line3].filter(Boolean).join(' · ') ?? ''
  const profile = (localGetProfile() as Record<string, string | undefined> | null) ?? {}

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
    verwendungszweck: c?.verwendungszweck ?? '',
    rechnung_preset: c?.rechnung_preset ?? '',
  }

  invoice.value = {
    number: invRow.number,
    date: invRow.date,
    courseOverview: (invRow.course_overview || '').trim(),
    items: invRow.items.map((r) => ({
      date: r.date,
      hours: r.hours,
      rate: r.rate,
      course: (r.course || '').trim(),
    })),
  }

  loading.value = false
})

async function regenerate() {
  if (!invoice.value) return
  regenerating.value = true
  try {
    await generateAndStoreInvoicePdf({ invoiceId, invoiceNumber: invoice.value.number })
    router.replace('/invoices')
  } catch (e) {
    alert('Fehler: ' + (e instanceof Error ? e.message : String(e)))
  } finally {
    regenerating.value = false
  }
}
</script>

<style scoped>
.page { padding: 16px; }
.flex.between { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.preview-wrap { margin: 1rem 0; padding: 1rem; background: #f5f5f5; border-radius: 8px; }
.hint { color: #666; margin-bottom: 1rem; }
.actions { margin-top: 1rem; }
.error { color: #c00; margin-bottom: 1rem; }
.btn { padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; cursor: pointer; text-decoration: none; }
.btn.primary { background: #2563eb; color: white; border-color: #2563eb; }
</style>
