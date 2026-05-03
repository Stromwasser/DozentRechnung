import type { ClientInfo, InvoiceForm, InvoiceItem, ProviderProfile } from '@/composables/useInvoice'
import { deletePdfBlob } from './localPdfDb'

const DOZENT_LS_KEY = 'dozent-rechnungen-local-v1'
export const LOCAL_USER_ID = 'local-user'

export type LocalClientRow = {
  id: string
  user_id: string
  name: string | null
  address_line1: string | null
  address_line2: string | null
  company_line1?: string | null
  company_line2?: string | null
  company_line3?: string | null
  phone: string | null
  email: string | null
  leistungsbeschreibung?: string | null
  verwendungszweck?: string | null
  zusatz_angaben?: string | null
  rechnung_preset?: string | null
}

export type LocalInvoiceItem = {
  date: string
  hours: number
  rate: number
  amount: number
  course?: string | null
}

export type LocalInvoiceRow = {
  id: string
  user_id: string
  client_id: string
  number: string
  date: string
  course_overview: string | null
  total: number
  pdf_path: string | null
  pdf_signed_url: string | null
  pdf_url: string | null
  pdf_url_expires_at: string | null
  items: LocalInvoiceItem[]
}

type LocalDb = {
  profile: Record<string, unknown> | null
  clients: LocalClientRow[]
  invoices: LocalInvoiceRow[]
}

function loadDb(): LocalDb {
  try {
    const raw = localStorage.getItem(DOZENT_LS_KEY)
    if (!raw) return { profile: null, clients: [], invoices: [] }
    const p = JSON.parse(raw) as LocalDb
    return {
      profile: p.profile ?? null,
      clients: Array.isArray(p.clients) ? p.clients : [],
      invoices: Array.isArray(p.invoices) ? p.invoices : [],
    }
  } catch {
    return { profile: null, clients: [], invoices: [] }
  }
}

function saveDb(db: LocalDb): void {
  localStorage.setItem(DOZENT_LS_KEY, JSON.stringify({ ...db, updatedAt: new Date().toISOString() }))
}

export function localGetProfile(): Record<string, unknown> | null {
  return loadDb().profile
}

export function localUpsertProfile(profile: Record<string, unknown>): void {
  const db = loadDb()
  db.profile = { ...profile, id: LOCAL_USER_ID }
  saveDb(db)
}

export function localListClients(): LocalClientRow[] {
  return loadDb().clients.filter((c) => c.user_id === LOCAL_USER_ID)
}

export function localSaveClient(row: Omit<LocalClientRow, 'user_id' | 'id'> & { id?: string }): LocalClientRow {
  const db = loadDb()
  const id = row.id ?? crypto.randomUUID()
  const full: LocalClientRow = { ...row, id, user_id: LOCAL_USER_ID }
  const idx = db.clients.findIndex((c) => c.id === id)
  if (idx >= 0) db.clients[idx] = full
  else db.clients.push(full)
  saveDb(db)
  return full
}

export function localDeleteClient(clientId: string): void {
  const db = loadDb()
  db.clients = db.clients.filter((c) => c.id !== clientId)
  saveDb(db)
}

export function localCountInvoicesForClient(clientId: string): number {
  return loadDb().invoices.filter((i) => i.client_id === clientId).length
}

export function localListInvoiceSummaries(): Array<{
  id: string
  number: string
  date: string
  total: number
  course_overview: string | null
  pdf_signed_url: string | null
  pdf_url: string | null
  pdf_path: string | null
  pdf_url_expires_at: string | null
  client_name: string | null
}> {
  const db = loadDb()
  return [...db.invoices]
    .sort((a, b) => b.number.localeCompare(a.number, 'de'))
    .map((inv) => {
      const c = db.clients.find((x) => x.id === inv.client_id)
      const clientName = c
        ? c.name ||
          [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(' · ') ||
          null
        : null
      return {
        id: inv.id,
        number: inv.number,
        date: inv.date,
        total: inv.total,
        course_overview: inv.course_overview,
        pdf_signed_url: inv.pdf_signed_url,
        pdf_url: inv.pdf_url,
        pdf_path: inv.pdf_path,
        pdf_url_expires_at: inv.pdf_url_expires_at,
        client_name: clientName,
      }
    })
}

export function localGetInvoiceById(invoiceId: string): LocalInvoiceRow | null {
  const inv = loadDb().invoices.find((i) => i.id === invoiceId)
  return inv ? { ...inv, items: [...inv.items] } : null
}

export function localGetClientById(clientId: string): LocalClientRow | undefined {
  return loadDb().clients.find((c) => c.id === clientId)
}

export function localInvoiceCount(): number {
  return loadDb().invoices.length
}

export function localGetNextInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `${year}-${month}-`
  const nums = loadDb()
    .invoices.filter((i) => i.number.startsWith(prefix))
    .map((i) => parseInt(i.number.replace(prefix, ''), 10))
    .filter((n) => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

function findOrCreateClient(db: LocalDb, client: ClientInfo): string {
  const name = client.name.trim()
  const existing = db.clients.find((c) => c.user_id === LOCAL_USER_ID && (c.name ?? '').trim() === name)
  if (existing) {
    existing.leistungsbeschreibung = client.leistungsbeschreibung ?? null
    existing.verwendungszweck = client.verwendungszweck ?? null
    existing.zusatz_angaben = client.zusatz_angaben ?? null
    existing.rechnung_preset = (client.rechnung_preset as string | undefined) ?? null
    return existing.id
  }
  const id = crypto.randomUUID()
  db.clients.push({
    id,
    user_id: LOCAL_USER_ID,
    name,
    address_line1: client.addressLine1,
    address_line2: client.addressLine2,
    phone: client.phone ?? null,
    email: client.email ?? null,
    leistungsbeschreibung: client.leistungsbeschreibung ?? null,
    verwendungszweck: client.verwendungszweck ?? null,
    zusatz_angaben: client.zusatz_angaben ?? null,
    rechnung_preset: (client.rechnung_preset as string | undefined) ?? null,
  })
  return id
}

export function localSaveFullInvoice(
  provider: ProviderProfile,
  client: ClientInfo,
  invoice: InvoiceForm,
  totalAmount: number,
): string {
  const db = loadDb()
  db.profile = {
    ...(db.profile as object),
    id: LOCAL_USER_ID,
    name: provider.name,
    address_line1: provider.addressLine1,
    address_line2: provider.addressLine2,
    phone: provider.phone,
    email: provider.email,
    tax_number: provider.taxNumber,
    iban: provider.iban,
    bic: provider.bic,
  }
  const clientId = findOrCreateClient(db, client)
  const id = crypto.randomUUID()
  const items: LocalInvoiceItem[] = invoice.items.map((item: InvoiceItem) => ({
    date: item.date,
    hours: item.hours,
    rate: item.rate,
    amount: Number((item.hours * item.rate).toFixed(2)),
    course: item.course ?? null,
  }))
  db.invoices.push({
    id,
    user_id: LOCAL_USER_ID,
    client_id: clientId,
    number: invoice.number,
    date: invoice.date,
    course_overview: invoice.courseOverview || null,
    total: totalAmount,
    pdf_path: null,
    pdf_signed_url: null,
    pdf_url: null,
    pdf_url_expires_at: null,
    items,
  })
  saveDb(db)
  return id
}

export function localUpdateFullInvoice(
  invoiceId: string,
  provider: ProviderProfile,
  client: ClientInfo,
  invoice: InvoiceForm,
  totalAmount: number,
): void {
  const db = loadDb()
  const idx = db.invoices.findIndex((i) => i.id === invoiceId)
  if (idx < 0) throw new Error('Rechnung nicht gefunden.')

  db.profile = {
    ...(db.profile as object),
    id: LOCAL_USER_ID,
    name: provider.name,
    address_line1: provider.addressLine1,
    address_line2: provider.addressLine2,
    phone: provider.phone,
    email: provider.email,
    tax_number: provider.taxNumber,
    iban: provider.iban,
    bic: provider.bic,
  }

  const clientId = findOrCreateClient(db, client)
  const items: LocalInvoiceItem[] = invoice.items.map((item: InvoiceItem) => ({
    date: item.date,
    hours: item.hours,
    rate: item.rate,
    amount: Number((item.hours * item.rate).toFixed(2)),
    course: item.course ?? null,
  }))

  db.invoices[idx] = {
    ...db.invoices[idx],
    client_id: clientId,
    number: invoice.number,
    date: invoice.date,
    course_overview: invoice.courseOverview || null,
    total: totalAmount,
    items,
  }
  saveDb(db)
}

export function localUpdateInvoicePdfMeta(
  invoiceId: string,
  pdfPath: string,
  pdfSignedUrl: string,
  expiresAt: string,
): void {
  const db = loadDb()
  const inv = db.invoices.find((i) => i.id === invoiceId)
  if (!inv) return
  inv.pdf_path = pdfPath
  inv.pdf_signed_url = pdfSignedUrl
  inv.pdf_url_expires_at = expiresAt
  saveDb(db)
}

export async function localDeleteInvoice(invoiceId: string): Promise<void> {
  const db = loadDb()
  db.invoices = db.invoices.filter((i) => i.id !== invoiceId)
  saveDb(db)
  await deletePdfBlob(invoiceId).catch(() => {})
}
