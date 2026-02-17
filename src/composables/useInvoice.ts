// src/composables/useInvoice.ts

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
  /** Custom description for PDF (replaces default "Unterricht im Rahmen des Integrationskurses") */
  leistungsbeschreibung?: string
  verwendungszweck?: string
  zusatz_angaben?: string
  rechnung_preset?: 'bamf_ik' | 'bsk' | 'sonstige'
}

// ⬇️ UPDATED: item now can carry a short course tag (IK-2025-01 / BSK 192)
export interface InvoiceItem {
  date: string
  hours: number
  rate: number
  course?: string
}

// ⬇️ UPDATED: courseOverview (header line for PDF)
// maps to invoices.course_overview
export interface InvoiceForm {
  number: string
  date: string
  courseOverview: string
  items: InvoiceItem[]
}

import { supabase } from '@/lib/supabaseClient'

export async function saveFullInvoice({
  user,
  provider,
  client,
  invoice,
  totalAmount,
}: {
  user: { id: string }
  provider: ProviderProfile
  client: ClientInfo
  invoice: InvoiceForm
  totalAmount: number
}): Promise<string> {
  const user_id = user.id

  // 1️⃣ SAVE or GET CLIENT
  const { data: existingClient, error: clientFetchError } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user_id)
    .eq('name', client.name)
    .maybeSingle()

  if (clientFetchError) {
    throw new Error('Fehler beim Abrufen des Kunden: ' + clientFetchError.message)
  }

  let clientId = existingClient?.id

  // Update existing client's per-client fields
  if (clientId) {
    await supabase
      .from('clients')
      .update({
        leistungsbeschreibung: client.leistungsbeschreibung || null,
        verwendungszweck: client.verwendungszweck || null,
        zusatz_angaben: client.zusatz_angaben || null,
        rechnung_preset: client.rechnung_preset || null,
      })
      .eq('id', clientId)
  }

  if (!clientId) {
    const { data: newClient, error: clientInsertError } = await supabase
      .from('clients')
      .insert({
        user_id,
        name: client.name,
        address_line1: client.addressLine1,
        address_line2: client.addressLine2,
        phone: client.phone ?? null,
        email: client.email ?? null,
        leistungsbeschreibung: client.leistungsbeschreibung ?? null,
        verwendungszweck: client.verwendungszweck ?? null,
        zusatz_angaben: client.zusatz_angaben ?? null,
        rechnung_preset: client.rechnung_preset ?? null,
      })
      .select()
      .single()

    if (clientInsertError) {
      throw new Error('Fehler beim Speichern des Kunden: ' + clientInsertError.message)
    }
    clientId = newClient.id
  }

  // 2️⃣ ENSURE USER PROFILE EXISTS (create once if missing)
  const { data: existingProfile, error: profileFetchError } = await supabase
    .from('user_profile')
    .select('id')
    .eq('id', user_id)
    .maybeSingle()

  if (profileFetchError) {
    throw new Error('Fehler beim Laden des Profils: ' + profileFetchError.message)
  }

  if (!existingProfile) {
    const { error: profileInsertError } = await supabase.from('user_profile').insert({
      id: user_id,
      name: provider.name,
      address_line1: provider.addressLine1,
      address_line2: provider.addressLine2,
      phone: provider.phone,
      email: provider.email,
      tax_number: provider.taxNumber,
      iban: provider.iban,
      bic: provider.bic,
    })

    if (profileInsertError) {
      throw new Error('Fehler beim Speichern des Profils: ' + profileInsertError.message)
    }
  }

  // 3️⃣ INSERT INVOICE
  // NOTE: keep "client_id" because your current table uses that name.
  // If your table uses "customer_id" instead, rename "client_id" -> "customer_id" below.
  const { data: newInvoice, error: invoiceInsertError } = await supabase
    .from('invoices')
    .insert({
      user_id,
      client_id: clientId, // <-- rename to customer_id if your schema uses that
      number: invoice.number,
      date: invoice.date,
      course_overview: invoice.courseOverview, // ⬅️ NEW FIELD
      total: totalAmount,
    })
    .select()
    .single()

  if (invoiceInsertError) {
    throw new Error('Fehler beim Speichern der Rechnung: ' + invoiceInsertError.message)
  }

  // 4️⃣ INSERT INVOICE ITEMS (with computed amount and optional course)
  const itemsToInsert = invoice.items.map((item: InvoiceItem) => ({
    invoice_id: newInvoice.id,
    user_id, // keep if your RLS expects it on invoice_items
    date: item.date,
    hours: item.hours,
    rate: item.rate,
    amount: Number((item.hours * item.rate).toFixed(2)), // store amount explicitly
    course: item.course ?? null, // ⬅️ NEW COLUMN
  }))

  const { error: itemsInsertError } = await supabase.from('invoice_items').insert(itemsToInsert)

  if (itemsInsertError) {
    throw new Error('Fehler beim Speichern der Termine: ' + itemsInsertError.message)
  }

  return newInvoice.id
}

/** Update existing invoice (edit mode). Replaces client, invoice, and items. */
export async function updateFullInvoice({
  user,
  invoiceId,
  provider,
  client,
  invoice,
  totalAmount,
}: {
  user: { id: string }
  invoiceId: string
  provider: ProviderProfile
  client: ClientInfo
  invoice: InvoiceForm
  totalAmount: number
}): Promise<string> {
  const user_id = user.id

  // 1️⃣ SAVE or GET CLIENT (same as saveFullInvoice)
  const { data: existingClient, error: clientFetchError } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user_id)
    .eq('name', client.name)
    .maybeSingle()

  if (clientFetchError) {
    throw new Error('Fehler beim Abrufen des Kunden: ' + clientFetchError.message)
  }

  let clientId = existingClient?.id

  if (clientId) {
    await supabase
      .from('clients')
      .update({
        leistungsbeschreibung: client.leistungsbeschreibung || null,
        verwendungszweck: client.verwendungszweck || null,
        zusatz_angaben: client.zusatz_angaben || null,
        rechnung_preset: client.rechnung_preset || null,
      })
      .eq('id', clientId)
  }

  if (!clientId) {
    const { data: newClient, error: clientInsertError } = await supabase
      .from('clients')
      .insert({
        user_id,
        name: client.name,
        address_line1: client.addressLine1,
        address_line2: client.addressLine2,
        phone: client.phone ?? null,
        email: client.email ?? null,
        leistungsbeschreibung: client.leistungsbeschreibung ?? null,
        verwendungszweck: client.verwendungszweck ?? null,
        zusatz_angaben: client.zusatz_angaben ?? null,
        rechnung_preset: client.rechnung_preset ?? null,
      })
      .select()
      .single()

    if (clientInsertError) {
      throw new Error('Fehler beim Speichern des Kunden: ' + clientInsertError.message)
    }
    clientId = newClient.id
  }

  // 2️⃣ UPDATE INVOICE
  const { error: invoiceUpdateError } = await supabase
    .from('invoices')
    .update({
      client_id: clientId,
      number: invoice.number,
      date: invoice.date,
      course_overview: invoice.courseOverview,
      total: totalAmount,
    })
    .eq('id', invoiceId)
    .eq('user_id', user_id)

  if (invoiceUpdateError) {
    throw new Error('Fehler beim Aktualisieren der Rechnung: ' + invoiceUpdateError.message)
  }

  // 3️⃣ REPLACE INVOICE ITEMS (delete old, insert new)
  const { error: itemsDeleteError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId)

  if (itemsDeleteError) {
    throw new Error('Fehler beim Löschen der Termine: ' + itemsDeleteError.message)
  }

  const itemsToInsert = invoice.items.map((item: InvoiceItem) => ({
    invoice_id: invoiceId,
    user_id,
    date: item.date,
    hours: item.hours,
    rate: item.rate,
    amount: Number((item.hours * item.rate).toFixed(2)),
    course: item.course ?? null,
  }))

  const { error: itemsInsertError } = await supabase.from('invoice_items').insert(itemsToInsert)

  if (itemsInsertError) {
    throw new Error('Fehler beim Speichern der Termine: ' + itemsInsertError.message)
  }

  return invoiceId
}
