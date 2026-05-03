import { localSaveFullInvoice, localUpdateFullInvoice } from '@/lib/localStore'

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
  phone?: string
  email?: string
  leistungsbeschreibung?: string
  verwendungszweck?: string
  zusatz_angaben?: string
  rechnung_preset?: string
}

export interface InvoiceItem {
  date: string
  hours: number
  rate: number
  course?: string
}

export interface InvoiceForm {
  number: string
  date: string
  courseOverview: string
  items: InvoiceItem[]
}

export async function saveFullInvoice(args: {
  provider: ProviderProfile
  client: ClientInfo
  invoice: InvoiceForm
  totalAmount: number
}): Promise<string> {
  return localSaveFullInvoice(args.provider, args.client, args.invoice, args.totalAmount)
}

export async function updateFullInvoice(args: {
  invoiceId: string
  provider: ProviderProfile
  client: ClientInfo
  invoice: InvoiceForm
  totalAmount: number
}): Promise<string> {
  localUpdateFullInvoice(args.invoiceId, args.provider, args.client, args.invoice, args.totalAmount)
  return args.invoiceId
}
