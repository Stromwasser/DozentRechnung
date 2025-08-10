// src/stores/invoiceStore.ts
import { defineStore } from 'pinia'
import { supabase } from '@/composables/useSupabase'

export interface InvoiceItem {
  description: string
  hours: number
  rate: number
}

export interface Invoice {
  id?: string
  number: string
  date: string
  customer_id: string
  items: InvoiceItem[]
}

export const useInvoiceStore = defineStore('invoices', {
  state: () => ({
    invoices: [] as Invoice[],
    currentInvoice: null as Invoice | null,
  }),

  actions: {
    async createInvoice(invoice: Invoice) {
      // Удаляем items перед сохранением основного счёта
      const { items, ...invoiceHeader } = invoice

      // 1. Сохраняем счёт
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceHeader])
        .select()
        .single()

      if (invoiceError) {
        console.error('Ein Fehler:', invoiceError)
        throw invoiceError
      }

      const createdInvoice = invoiceData as Invoice

      // 2. Сохраняем items с привязкой к invoice_id
      const itemsToInsert = items.map((item) => ({
        ...item,
        invoice_id: createdInvoice.id,
      }))

      const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert)

      if (itemsError) {
        console.error('Ein Felhler für Items:', itemsError)
        throw itemsError
      }

      // 3. Возвращаем счёт с позициями
      createdInvoice.items = items
      this.invoices.push(createdInvoice)
      return createdInvoice
    },
  },
})
