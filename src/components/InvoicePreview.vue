<template>
  <div class="a4 page" :class="{ print: forPrint }">
    <!-- Sender block -->
    <header class="top">
      <section class="sender">
        <div class="s-line">{{ provider.name }}</div>
        <div class="s-line">{{ provider.addressLine1 }}</div>
        <div class="s-line">{{ provider.addressLine2 }}</div>
        <div class="s-line">{{ provider.phone }}</div>
        <div class="s-line">St-Nr. {{ provider.taxNumber }}</div>
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
      <div class="r-name" v-if="client.name">{{ client.name }}</div>
      <div>{{ client.addressLine1 }}</div>
      <div>{{ client.addressLine2 }}</div>
      <div v-if="client.phone">Telefon {{ client.phone }}</div>
      <div v-if="client.email">E-Mail {{ client.email }}</div>
    </div>

    <!-- Purpose line: client-specific or default -->
    <div class="purpose">
      <template v-if="client.leistungsbeschreibung">
        {{ client.leistungsbeschreibung }}
        <strong v-if="invoice.courseOverview">{{ invoice.courseOverview }}</strong>
      </template>
      <template v-else>
        Für Unterricht im Rahmen
        <strong>{{ invoice.courseOverview }}</strong>
      </template>
    </div>

    <!-- Items table -->
    <section class="items">
      <table class="t">
        <thead>
          <tr>
            <th class="col-date">Datum</th>
            <th v-if="showCourseColumn" class="col-course">Kurs</th>
            <th class="col-hours">Stundenanzahl</th>
            <th class="col-rate">Stundensatz (€)</th>
            <th class="col-amount">Betrag (€)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(it, i) in itemsSorted" :key="i">
            <td>{{ formatDate(it.date) }}</td>
            <td v-if="showCourseColumn" class="course">{{ it.course || '' }}</td>
            <td class="num">{{ it.hours }}</td>
            <td class="num">{{ formatMoney(it.rate) }}</td>
            <td class="num">{{ formatMoney(it.hours * it.rate) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="sum">
            <td>Gesamt</td>
            <td v-if="showCourseColumn" class="course"></td>
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
      <p v-if="client.verwendungszweck" class="verwendungszweck"><strong>Verwendungszweck:</strong> {{ client.verwendungszweck }}</p>
    </section>

    <!-- Bottom footer (fixed) -->
    <footer class="footer">
      <div class="f-line">
        {{ provider.name }} · {{ provider.addressLine1 }} · {{ provider.addressLine2 }} ·
        {{ provider.email }} · {{ provider.phone }}
      </div>
      <div class="f-bank">
        <strong>St-Nr.</strong> {{ provider.taxNumber }} <strong>IBAN:</strong>
        {{ provider.iban }} · <strong>BIC:</strong> {{ provider.bic }}
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Reuse canonical types from composable to avoid mismatches
import type {
  ProviderProfile,
  ClientInfo as ClientInfoNew,
  InvoiceItem as InvoiceItemNew,
  InvoiceForm as InvoiceFormNew,
} from '@/composables/useInvoice'

const props = defineProps<{
  provider: ProviderProfile
  client: ClientInfoNew
  invoice: InvoiceFormNew
  items?: InvoiceItemNew[]
  /** When true, applies print-specific styles (no margins, crisp fonts) */
  forPrint?: boolean
  /** When true, hide Kurs column (for legacy invoices without course data) */
  hideCourseColumn?: boolean
}>()

// Use provided items or invoice.items
const baseItems = computed<InvoiceItemNew[]>(() => {
  const candidate = props.items && props.items.length ? props.items : props.invoice.items
  return (candidate ?? []) as InvoiceItemNew[]
})

// Sort by date ascending
const itemsSorted = computed<InvoiceItemNew[]>(() => {
  return [...baseItems.value].sort((a, b) => a.date.localeCompare(b.date))
})

const totalHours = computed<number>(() => {
  return itemsSorted.value.reduce((s, it) => s + Number(it.hours || 0), 0)
})

const totalAmount = computed<number>(() => {
  return itemsSorted.value.reduce((s, it) => s + Number((it.hours || 0) * (it.rate || 0)), 0)
})

const showCourseColumn = computed<boolean>(() => {
  if (props.hideCourseColumn) return false
  return baseItems.value.some((it) => (it.course || '').trim() !== '')
})

function formatDate(d: string) {
  try {
    const dt = new Date(d)
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dt)
  } catch {
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
  padding: 18mm 18mm 14mm;
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
  padding: 8px 10px;
}
.t td {
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 10px;
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

/* Column widths */
.col-date {
  width: 24%;
}
.col-course {
  width: 18%;
}
.col-hours {
  width: 18%;
}
.col-rate {
  width: 20%;
}
.col-amount {
  width: 20%;
}
.course {
  text-align: left;
}

/* Legal note */
.legal {
  font-size: 10.5pt;
  margin-top: 10mm;
}
.verwendungszweck {
  margin-top: 4mm;
  font-weight: 500;
}

/* Footer: прижат к нижнему краю страницы */
.footer {
  position: absolute;
  left: 18mm;
  right: 18mm;
  bottom: 0;
  padding-top: 4mm;
  border-top: 1px solid #e5e7eb;
  font-size: 9.8pt;
  color: #374151;
  text-align: center;
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

/* Mobile/Safari fix */
.page {
  overflow-x: auto;
}

@media (max-width: 768px) {
  .a4 {
    width: 100%;
    min-height: auto;
    padding: 16px;
  }
  .top {
    flex-wrap: wrap;
    gap: 12px;
  }
  .title-stack {
    min-width: 0;
    text-align: left;
  }
}

/* Keep A4 geometry when printing */
@media print {
  .a4 {
    width: 210mm;
    min-height: 297mm;
    padding: 18mm 18mm 14mm;
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
  min-width: 70mm;
  text-align: right;
}
.meta-right .m-row {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 2mm;
}
.meta-right .m-key {
  font-weight: 700;
  letter-spacing: 0.2px;
}
</style>
