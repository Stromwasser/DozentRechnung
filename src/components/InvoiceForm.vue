<template>
  <div class="page">
    <header v-if="invoiceId" class="form-header">
      <router-link to="/invoices" class="btn">← Zurück</router-link>
      <h2>Rechnung bearbeiten</h2>
    </header>
  <form class="invoice-form" @submit.prevent="saveInvoice">
    <!-- 🔹 Block 1: Provider Info -->
    <section>
      <h3>👤 Deine Daten</h3>
      <div class="form-group">
        <label for="provider-name">Name</label>
        <input id="provider-name" v-model="provider.name" required />
      </div>
      <div class="form-group">
        <label for="provider-address1">Straße und Hausnummer</label>
        <input id="provider-address1" v-model="provider.addressLine1" required />
      </div>
      <div class="form-group">
        <label for="provider-address2">PLZ und Stadt</label>
        <input id="provider-address2" v-model="provider.addressLine2" required />
      </div>
      <div class="form-group">
        <label for="provider-phone">Telefonnummer</label>
        <input id="provider-phone" v-model="provider.phone" required />
      </div>
      <div class="form-group">
        <label for="provider-email">E-Mail</label>
        <input id="provider-email" v-model="provider.email" required />
      </div>
      <div class="form-group">
        <label for="provider-tax">Steuernummer</label>
        <input id="provider-tax" v-model="provider.taxNumber" required />
      </div>
      <div class="form-group">
        <label for="provider-iban">IBAN</label>
        <input id="provider-iban" v-model="provider.iban" required />
      </div>
      <div class="form-group">
        <label for="provider-bic">BIC</label>
        <input id="provider-bic" v-model="provider.bic" required />
      </div>
    </section>

    <!-- 🔹 Block 2: Client Selector + Client Info -->
    <section>
      <h3>🏢 Kundendaten</h3>

      <!-- Client dropdown -->
      <div class="form-group">
        <label for="client-select">Kunde wählen</label>
        <select id="client-select" v-model="selectedClientId">
          <option :value="NEW_CLIENT_VALUE">+ Neuer Kunde</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">
            {{ clientDisplayName(c) }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="client-name">Firmenname</label>
        <input id="client-name" v-model="client.name" required />
      </div>
      <div class="form-group">
        <label for="client-address1">Straße und Hausnummer</label>
        <input id="client-address1" v-model="client.addressLine1" required />
      </div>
      <div class="form-group">
        <label for="client-address2">PLZ und Stadt</label>
        <input id="client-address2" v-model="client.addressLine2" required />
      </div>
      <div class="form-group">
        <label for="client-phone">Telefonnummer</label>
        <input id="client-phone" v-model="client.phone" required />
      </div>
      <div class="form-group">
        <label for="client-email">E-Mail</label>
        <input id="client-email" v-model="client.email" required />
      </div>
      <details class="form-group">
        <summary>Erweiterte Einstellungen (optional)</summary>
        <div class="form-group">
          <label for="client-leistung">Leistungsbeschreibung (für PDF)</label>
          <input id="client-leistung" v-model="client.leistungsbeschreibung" placeholder="z. B. Unterricht Integrationskurs" />
        </div>
        <div class="form-group">
          <label for="client-preset">Rechnungs-Preset</label>
          <select id="client-preset" v-model="client.rechnung_preset">
            <option value="">— Standard —</option>
            <option value="bamf_ik">BAMF Integrationskurs</option>
            <option value="bsk">Berufssprachkurs</option>
            <option value="sonstige">Sonstige</option>
          </select>
        </div>
      </details>
    </section>

    <!-- 🔹 Block 3: Rechnung Info -->
    <section>
      <h3>🧾 Rechnung</h3>
      <div class="form-group">
        <label for="course-overview">Kursübersicht (für Kopfzeile)</label>
        <input
          id="course-overview"
          v-model="invoice.courseOverview"
          placeholder="z. B. IK-2025-01, JIK-2025-01, BSK 192"
          required
        />
      </div>
      <div class="form-group">
        <label for="invoice-date">Datum</label>
        <input id="invoice-date" v-model="invoice.date" type="date" required />
      </div>
      <div class="form-group">
        <label for="invoice-number">Rechnungsnummer</label>
        <input id="invoice-number" v-model="invoice.number" required />
      </div>
    </section>

    <!-- 🔹 Block 4: Tabelle -->
    <section>
      <h3>📅 Termine</h3>
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Kurs</th>
            <!-- NEW -->
            <th>Stunden</th>
            <th>Stundensatz (€)</th>
            <th>Betrag (€)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in invoice.items" :key="index">
            <td><input type="date" v-model="item.date" required /></td>
            <td>
              <input v-model="item.course" placeholder="z. B. IK-2025-01" />
            </td>
            <td><input type="number" v-model.number="item.hours" min="1" step="0.5" required /></td>
            <td><input type="number" v-model.number="item.rate" step="0.01" required /></td>
            <td>{{ (item.hours * item.rate).toFixed(2) }}</td>
            <td><button type="button" @click="removeItem(index)">❌</button></td>
          </tr>
        </tbody>
      </table>
      <button type="button" @click="addItem">+ Termin hinzufügen</button>
    </section>

    <p><strong>Gesamt:</strong> {{ totalAmount.toFixed(2) }} €</p>

    <!-- 🔘 Save Button -->
    <button type="submit">💾 Rechnung speichern</button>
  </form>

  <!-- Hidden preview for PDF capture -->
  <div id="invoice-preview" style="position: fixed; left: -9999px; top: -9999px">
    <InvoicePreview
      :provider="provider"
      :client="client"
      :invoice="invoice"
      :items="invoice.items"
      :for-print="true"
    />
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase, handleExpiredSession } from '@/lib/supabaseClient'
import { saveFullInvoice, updateFullInvoice } from '@/composables/useInvoice'
import { generateAndStoreInvoicePdf } from '@/composables/useInvoicePdf'
import InvoicePreview from '@/components/InvoicePreview.vue'

const router = useRouter()
const route = useRoute()
const invoiceId = route.params.id as string | undefined

/** Constant used as select value to switch into "new client" mode */
const NEW_CLIENT_VALUE = '__NEW__' as const

// ---------- Types ----------
type Provider = {
  name: string
  addressLine1: string
  addressLine2: string
  phone: string
  email: string
  taxNumber: string
  iban: string
  bic: string
}

type Client = {
  name: string
  addressLine1: string
  addressLine2: string
  phone: string
  email: string
  leistungsbeschreibung?: string
  verwendungszweck?: string
  zusatz_angaben?: string
  rechnung_preset?: string
}

type ClientRow = {
  id: string
  name: string | null
  company_line1?: string | null
  company_line2?: string | null
  company_line3?: string | null
  address_line1: string | null
  address_line2: string | null
  phone: string | null
  email: string | null
  leistungsbeschreibung?: string | null
  verwendungszweck?: string | null
  zusatz_angaben?: string | null
  rechnung_preset?: string | null
}

type InvoiceItem = { date: string; hours: number; rate: number; course?: string }
type Invoice = {
  courseOverview: string // maps to invoices.course_overview
  date: string
  number: string
  items: InvoiceItem[]
}

type UserProfileRow = {
  name?: string
  address_line1?: string
  address_line2?: string
  phone?: string
  email?: string
  tax_number?: string
  iban?: string
  bic?: string
}

// ---------- State ----------
const provider = ref<Provider>({
  name: '',
  addressLine1: '',
  addressLine2: '',
  phone: '',
  email: '',
  taxNumber: '',
  iban: '',
  bic: '',
})

const client = ref<Client>({
  name: '',
  addressLine1: '',
  addressLine2: '',
  phone: '',
  email: '',
  leistungsbeschreibung: '',
  rechnung_preset: '',
})

const clients = ref<ClientRow[]>([])
const selectedClientId = ref<string | typeof NEW_CLIENT_VALUE>(NEW_CLIENT_VALUE)

const todayISO = new Date().toISOString().substring(0, 10)
const invoice = ref<Invoice>({
  courseOverview: '',
  date: todayISO,
  number: '',
  items: [{ date: todayISO, hours: 5, rate: 42.23, course: '' }],
})

// ---------- Helpers ----------
const addItem = () => {
  invoice.value.items.push({
    date: new Date().toISOString().substring(0, 10),
    hours: 5,
    rate: 42.23,
    course: '',
  })
}
const removeItem = (index: number) => {
  invoice.value.items.splice(index, 1)
}
const totalAmount = computed<number>(() => {
  return invoice.value.items.reduce((sum, item) => sum + item.hours * item.rate, 0)
})

/** Map snake_case profile to camelCase provider fields */
function hydrateProviderFromProfile(p: Partial<UserProfileRow>) {
  if (!p) return
  provider.value.name = p.name ?? provider.value.name
  provider.value.addressLine1 = p.address_line1 ?? provider.value.addressLine1
  provider.value.addressLine2 = p.address_line2 ?? provider.value.addressLine2
  provider.value.phone = p.phone ?? provider.value.phone
  provider.value.email = p.email ?? provider.value.email
  provider.value.taxNumber = p.tax_number ?? provider.value.taxNumber
  provider.value.iban = p.iban ?? provider.value.iban
  provider.value.bic = p.bic ?? provider.value.bic
}

/** Build display name for client dropdown (supports legacy company_line1/2/3) */
function clientDisplayName(c: ClientRow): string {
  if (c.name) return c.name
  const parts = [c.company_line1, c.company_line2, c.company_line3].filter(Boolean)
  return parts.length ? parts.join(' · ') : '(Ohne Namen)'
}

/** When dropdown changes, either clear for new client or fill with selected client */
watch(selectedClientId, (val) => {
  if (val === NEW_CLIENT_VALUE) {
    client.value = {
      name: '',
      addressLine1: '',
      addressLine2: '',
      phone: '',
      email: '',
      leistungsbeschreibung: '',
      rechnung_preset: '',
    }
    return
  }
  const found = clients.value.find((c) => c.id === val)
  if (found) {
    client.value.name =
      found.name ||
      [found.company_line1, found.company_line2, found.company_line3].filter(Boolean).join(' · ') ||
      ''
    client.value.addressLine1 = found.address_line1 ?? ''
    client.value.addressLine2 = found.address_line2 ?? ''
    client.value.phone = found.phone ?? ''
    client.value.email = found.email ?? ''
    client.value.leistungsbeschreibung = found.leistungsbeschreibung ?? ''
    client.value.rechnung_preset = found.rechnung_preset ?? ''
  }
})

/** Save flow: persist client/profile/invoice/items, then generate PDF, then redirect */
const saveInvoice = async (): Promise<void> => {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) {
    alert('❌ Du bist nicht eingeloggt.')
    return
  }

  try {
    const id = invoiceId
      ? await updateFullInvoice({
          user,
          invoiceId,
          provider: provider.value,
          client: client.value,
          invoice: invoice.value,
          totalAmount: totalAmount.value,
        })
      : await saveFullInvoice({
          user,
          provider: provider.value,
          client: client.value,
          invoice: invoice.value,
          totalAmount: totalAmount.value,
        })

    await nextTick()

    const { pdfUrl } = await generateAndStoreInvoicePdf({
      userId: user.id,
      invoiceId: id,
      invoiceNumber: invoice.value.number,
    })
    console.log('PDF URL:', pdfUrl)

    await router.push('/invoices')
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : (error as { message?: string })?.message ??
          (error as { error?: string })?.error ??
          String(error)
    const msgLower = String(msg).toLowerCase()
    if (msgLower.includes('invalidjwt') || msgLower.includes('exp') || msgLower.includes('jwt')) {
      handleExpiredSession()
      return
    }
    console.error('Save invoice error:', error)
    alert('❌ Fehler: ' + (msg || 'Unbekannter Fehler.'))
  }
}

/** Generate next invoice number like YYYY-MM-XXX */
const generateInvoiceNumber = async (): Promise<string> => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `${year}-${month}-`

  const { data, error } = await supabase
    .from('invoices')
    .select('number')
    .like('number', `${prefix}%`)

  if (error) {
    console.error('Error fetching invoices:', error.message)
    return `${prefix}001`
  }

  const numbers = (data ?? []).map((inv: { number: string }) => inv.number)
  const maxNum =
    numbers
      .map((num) => parseInt(num.replace(prefix, ''), 10))
      .filter((n) => !isNaN(n))
      .sort((a, b) => b - a)[0] || 0

  const nextNum = String(maxNum + 1).padStart(3, '0')
  return `${prefix}${nextNum}`
}

// ---------- Lifecycle ----------
onMounted(async () => {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) return

  // EDIT MODE: load existing invoice
  if (invoiceId) {
    const { data: invRow, error: invErr } = await supabase
      .from('invoices')
      .select('id, number, date, course_overview, total, client_id, clients(name, address_line1, address_line2, phone, email, leistungsbeschreibung, verwendungszweck, rechnung_preset, company_line1, company_line2, company_line3)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invErr || !invRow) {
      alert('Rechnung nicht gefunden.')
      await router.push('/invoices')
      return
    }

    const { data: itemsRows } = await supabase
      .from('invoice_items')
      .select('date, hours, rate, course')
      .eq('invoice_id', invoiceId)
      .order('date')

    const { data: profile } = await supabase
      .from('user_profile')
      .select('name, address_line1, address_line2, phone, email, tax_number, iban, bic')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) hydrateProviderFromProfile(profile as UserProfileRow)

    const c = Array.isArray(invRow.clients) ? invRow.clients[0] : invRow.clients
    const clientName = c?.name ?? [c?.company_line1, c?.company_line2, c?.company_line3].filter(Boolean).join(' · ') ?? ''

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
      courseOverview: invRow.course_overview ?? '',
      items: (itemsRows ?? []).map((r: { date: string; hours: number; rate: number; course?: string }) => ({
        date: r.date,
        hours: r.hours,
        rate: r.rate,
        course: r.course ?? undefined,
      })),
    }
  } else {
    if (!invoice.value.number) {
      invoice.value.number = await generateInvoiceNumber()
    }
  }

  // Fetch profile (if not already done in edit mode)
  if (!invoiceId) {
    const { data: profile } = await supabase
      .from('user_profile')
      .select('name, address_line1, address_line2, phone, email, tax_number, iban, bic')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) hydrateProviderFromProfile(profile as UserProfileRow)
  }

  // Load clients for dropdown
  const { data: clientRows, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, company_line1, company_line2, company_line3, address_line1, address_line2, phone, email, leistungsbeschreibung, verwendungszweck, rechnung_preset')
    .eq('user_id', user.id)
    .order('name', { ascending: true, nullsFirst: false })

  if (clientErr) {
    console.error('Failed to load clients:', clientErr.message)
  } else {
    clients.value = (clientRows ?? []) as ClientRow[]
  }

  // Preselect client: in edit mode match by name; else first client or NEW
  if (invoiceId && client.value.name) {
    const found = clients.value.find(
      (c) =>
        (c.name || '').trim() === client.value.name.trim() ||
        [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(' · ') === client.value.name.trim()
    )
    if (found) {
      selectedClientId.value = found.id
    } else {
      const savedClient = { ...client.value }
      selectedClientId.value = NEW_CLIENT_VALUE
      await nextTick()
      client.value = savedClient
    }
  } else if (clients.value.length > 0) {
    selectedClientId.value = clients.value[0].id
  } else {
    selectedClientId.value = NEW_CLIENT_VALUE
  }
})
</script>

<style scoped>
.page { padding: 16px; }
.form-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.form-header h2 { margin: 0; font-size: 1.25rem; }
.invoice-form {
  display: grid;
  gap: 18px;
}
section {
  border: 1px solid #e5e7eb;
  padding: 12px;
  border-radius: 8px;
}
h3 {
  margin: 0 0 8px;
}
.form-group {
  display: grid;
  gap: 6px;
  margin-bottom: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
}
table input {
  min-width: 90px;
  padding: 8px 10px;
  font-size: 1rem;
  box-sizing: border-box;
}
table input[type="date"] {
  min-width: 140px;
}
table input[type="number"] {
  min-width: 80px;
}
button {
  cursor: pointer;
}
</style>
