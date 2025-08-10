<template>
  <div class="a4 page" :class="{ print: forPrint }">
    <!-- Sender block (like your sample) -->
    <header class="top">
      <section class="sender">
        <div class="s-line">{{ provider.name }}</div>
        <div class="s-line">{{ provider.addressLine1 }}</div>
        <div class="s-line">{{ provider.addressLine2 }}</div>
        <div class="s-line">{{ provider.phone }}</div>
        <div class="s-line">St‑Nr. {{ provider.taxNumber }}</div>
        <div class="s-line">IBAN: {{ provider.iban }}</div>
        <div class="s-line">BIC: {{ provider.bic }}</div>
      </section>

      <!-- Title + meta (right) -->
      <div class="title-stack">
        <h1 class="doc-title">RECHNUNG</h1>
        <div class="meta-right">
          <div class="m-row">
            <span class="m-key">RECHNUNG NR.</span><span>{{ invoice.number }}</span>
          </div>
          <div class="m-row">
            <span class="m-key">DATUM</span><span>{{ formatDate(invoice.date) }}</span>
          </div>
        </div>
      </div>
    </header>

    <div class="m-key m-spacer">AN</div>
    <div class="recipient">
      <div class="r-name">{{ client.name }}</div>
      <div>{{ client.addressLine1 }}</div>
      <div>{{ client.addressLine2 }}</div>
      <div v-if="client.phone">Telefon {{ client.phone }}</div>
      <div v-if="client.email">E‑Mail {{ client.email }}</div>
    </div>

    <div class="purpose">FÜR {{ invoice.courseDescription }}</div>

    <!-- Items table -->
    <section class="items">
      <table class="t">
        <thead>
          <tr>
            <th class="col-date">Datum</th>
            <th class="col-hours">Stundenanzahl</th>
            <th class="col-rate">Stundensatz (€)</th>
            <th class="col-amount">Betrag (€)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(it, i) in itemsSorted" :key="i">
            <td>{{ formatDate(it.date) }}</td>
            <td class="num">{{ it.hours }}</td>
            <td class="num">{{ formatMoney(it.rate) }}</td>
            <td class="num">{{ formatMoney(it.hours * it.rate) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="sum">
            <td>Gesamt</td>
            <td class="num">{{ totalHours }}</td>
            <td></td>
            <td class="num total">{{ formatMoney(totalAmount) }} €</td>
          </tr>
        </tfoot>
      </table>
    </section>

    <!-- Legal note -->
    <section class="legal">
      <p>Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.</p>
      <p>Der Betrag kann auf das oben genannte Konto überwiesen werden.</p>
    </section>

    <!-- Bottom footer (fixed) -->
    <footer class="footer">
      <div class="f-line">
        {{ provider.name }} · {{ provider.addressLine1 }} · {{ provider.addressLine2 }} ·
        {{ provider.email }} · {{ provider.phone }}
      </div>
      <div class="f-bank">
        <strong>St‑Nr.</strong> {{ provider.taxNumber }} <strong>IBAN:</strong>
        {{ provider.iban }} · <strong>BIC:</strong> {{ provider.bic }}
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ProviderProfile {
  name: string
  addressLine1: string
  addressLine2: string
  phone: string
  email: string
  taxNumber: string
  iban: string
  bic: string
}

export interface ClientInfo {
  name: string
  addressLine1: string
  addressLine2: string
  phone: string
  email: string
}

export interface InvoiceItem {
  date: string
  hours: number
  rate: number
}

export interface InvoiceForm {
  number: string
  date: string
  courseDescription: string
  items: InvoiceItem[]
}

const props = defineProps<{
  provider: ProviderProfile
  client: ClientInfo
  invoice: InvoiceForm
  items?: InvoiceItem[]
  /** When true, applies print-specific styles (no margins, crisp fonts) */
  forPrint?: boolean
}>()

// Ensure strong typing to avoid implicit 'any' in reducers
const baseItems = computed<InvoiceItem[]>(() => {
  const candidate = props.items && props.items.length ? props.items : props.invoice.items
  return (candidate ?? []) as InvoiceItem[]
})

const itemsSorted = computed<InvoiceItem[]>(() => {
  return [...baseItems.value].sort((a: InvoiceItem, b: InvoiceItem) => a.date.localeCompare(b.date))
})

const totalHours = computed<number>(() => {
  return itemsSorted.value.reduce((s: number, it: InvoiceItem) => s + Number(it.hours || 0), 0)
})

const totalAmount = computed<number>(() => {
  return itemsSorted.value.reduce(
    (s: number, it: InvoiceItem) => s + Number((it.hours || 0) * (it.rate || 0)),
    0,
  )
})

function formatDate(d: string) {
  try {
    const dt = new Date(d)
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dt) // -> 07.08.2025
  } catch {
    // fallback for already-formatted strings like "2025-08-07"
    const [y, m, dd] = d.split('-')
    if (y && m && dd) return `${dd.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`
    return d
  }
}

function formatMoney(v: number) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}
</script>

<style scoped>
/* Page */
.a4 {
  position: relative;
  width: 210mm;
  min-height: 297mm;
  padding: 18mm 20mm 36mm; /* extra bottom space for footer */
  background: #fff;
  color: #111827;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial;
  line-height: 1.35;
}
.page {
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.12);
}
.page.print {
  box-shadow: none;
}

/* Title */
.doc-title {
  margin: 0 0 9mm 0;
  font-size: 22pt;
  font-weight: 800;
  letter-spacing: 0.4px;
  position: right;
}

/* Sender */
.sender {
  margin-bottom: 9mm;
}
.s-line {
  font-size: 10.5pt;
  color: #374151;
}

/* Meta + Recipient + Purpose */
.meta {
  font-size: 10.5pt;
  margin-bottom: 8mm;
}
.m-row {
  margin-bottom: 2mm;
}
.m-key {
  font-weight: 700;
  letter-spacing: 0.2px;
}
.m-spacer {
  margin-top: 6mm;
}
.recipient {
  margin-top: 1.5mm;
}
.r-name {
  font-weight: 600;
}
.purpose {
  margin-top: 1.5mm;
}

/* Table */
.t {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5pt;
}
.t thead th {
  text-align: center;
  font-weight: 700;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 6px 8px;
}
.t td {
  border-bottom: 1px solid #f0f0f0;
  padding: 6px 8px;
}
.t .num {
  text-align: center;
}
.t tfoot td {
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
}
.t .sum td {
  font-weight: 700;
}
.t .sum .total {
  font-size: 11pt;
}

/* Column widths to match sample feel */
.col-date {
  width: 28%;
}
.col-hours {
  width: 22%;
}
.col-rate {
  width: 25%;
}
.col-amount {
  width: 25%;
}

/* Legal note */
.legal {
  font-size: 10.5pt;
  margin-top: 10mm;
}

/* Fixed footer */
.footer {
  position: absolute;
  left: 20mm;
  right: 20mm;
  bottom: 14mm;
  border-top: 1px solid #e5e7eb;
  padding-top: 4mm;
  font-size: 9.8pt;
  color: #374151;
}
.f-bank {
  margin-bottom: 2mm;
  font-weight: 500;
}
.f-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media print {
  .a4 {
    padding: 12mm 14mm 30mm;
    box-shadow: none !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .t thead th {
    background: #f2f4f7 !important;
  }
}
/* Header layout */
.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14mm;
  margin-bottom: 9mm;
}
.title-stack {
  min-width: 70mm; /* keeps a neat column on the right */
  text-align: right;
}
.doc-title {
  margin: 0 0 6mm 0;
  font-size: 22pt;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-align: right; /* right-aligned title */
}
.meta-right .m-row {
  display: flex;
  gap: 8px;
  justify-content: flex-end; /* value sticks to the right edge */
  margin-bottom: 2mm;
}
.meta-right .m-key {
  font-weight: 700;
  letter-spacing: 0.2px;
}

/* Footer centered */
.footer {
  position: absolute;
  left: 20mm;
  right: 20mm;
  bottom: 14mm;
  border-top: 1px solid #e5e7eb;
  padding-top: 4mm;
  font-size: 9.8pt;
  color: #2563eb;
  text-align: center; /* center everything */
}
.f-bank {
  margin-top: 2mm;
  font-weight: 500;
}
.f-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* --- Mobile/Safari fix: prevent layout from being cut on narrow screens --- */
.page {
  overflow-x: auto; /* enable horizontal scrolling instead of cutting content */
}

@media (max-width: 768px) {
  .a4 {
    width: 100%; /* use full width instead of fixed 210mm */
    min-height: auto; /* adjust height to fit content */
    padding: 16px; /* softer padding on mobile */
  }
  .top {
    flex-wrap: wrap; /* allow title block to wrap to next line */
    gap: 12px;
  }
  .title-stack {
    min-width: 0; /* remove fixed minimum width on the right */
    text-align: left; /* could be right-aligned if preferred */
  }
}

/* Keep original A4 geometry when printing */
@media print {
  .a4 {
    width: 210mm;
    min-height: 297mm;
    padding: 12mm 14mm 30mm;
  }
}
</style>
