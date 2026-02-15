<template>
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
    </section>

    <!-- 🔹 Block 3: Rechnung Info -->
    <section>
      <h3>🧾 Rechnung</h3>
      <div class="form-group">
        <label for="course-overview">Kursübersicht (für Kopfzeile)</label>
        <input
          id="course-overview"
          v-model="invoice.courseOverview"
          placeholder="IK-2025-01 (und Berufssprachkurs BSK 192)"
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
              <input v-model="item.course" placeholder="z. B. IK-2025-01 / BSK 192" />
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { saveFullInvoice } from '@/composables/useInvoice'
import { generateAndStoreInvoicePdf } from '@/composables/useInvoicePdf'
import InvoicePreview from '@/components/InvoicePreview.vue'

const router = useRouter()

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
})

const clients = ref<ClientRow[]>([])
const selectedClientId = ref<string | typeof NEW_CLIENT_VALUE>(NEW_CLIENT_VALUE)

const todayISO = new Date().toISOString().substring(0, 10)
const invoice = ref<Invoice>({
  courseOverview: 'IK-2025-01 (und Berufssprachkurs BSK 192)',
  date: todayISO,
  number: '',
  items: [{ date: todayISO, hours: 5, rate: 42.23, course: 'IK-2025-01' }],
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
    // 1) Save everything to DB
    // NOTE: saveFullInvoice should be updated to:
    // - upsert clients with company_line1/2/3
    // - insert invoice with course_overview
    // - insert invoice_items with course
    const invoiceId = await saveFullInvoice({
      user,
      provider: provider.value,
      client: client.value,
      invoice: invoice.value,
      totalAmount: totalAmount.value,
    })

    // 2) Ensure preview DOM is up-to-date
    await nextTick()

    // 3) Generate PDF & store to bucket
    const { pdfUrl } = await generateAndStoreInvoicePdf({
      userId: user.id,
      invoiceId,
      invoiceNumber: invoice.value.number,
    })
    console.log('PDF URL:', pdfUrl)

    // 4) Redirect to list
    await router.push('/invoices')
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : (error as { message?: string })?.message ??
          (error as { error?: string })?.error ??
          String(error)
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
  // 1) Ensure invoice number exists
  if (!invoice.value.number) {
    invoice.value.number = await generateInvoiceNumber()
  }

  // 2) Fetch profile → hydrate provider
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) return

  const { data: profile } = await supabase
    .from('user_profile')
    .select('name, address_line1, address_line2, phone, email, tax_number, iban, bic')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) hydrateProviderFromProfile(profile as UserProfileRow)

  // 3) Load clients for dropdown (include company_line1/2/3 for legacy data)
  const { data: clientRows, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, company_line1, company_line2, company_line3, address_line1, address_line2, phone, email')
    .eq('user_id', user.id)
    .order('name', { ascending: true, nullsFirst: false })

  if (clientErr) {
    console.error('Failed to load clients:', clientErr.message)
  } else {
    clients.value = (clientRows ?? []) as ClientRow[]
  }

  // Optional: preselect the first client in the list (or keep NEW)
  if (clients.value.length > 0) {
    selectedClientId.value = clients.value[0].id
  } else {
    selectedClientId.value = NEW_CLIENT_VALUE
  }
})
</script>

<style scoped>
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
  padding: 6px 8px;
  border-bottom: 1px solid #eee;
}
button {
  cursor: pointer;
}
</style>
