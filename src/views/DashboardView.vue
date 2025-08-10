<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">📋 Meine Rechnungen</h1>

      <button
        @click="goToCreate"
        class="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
      >
        ➕ Neue Rechnung
      </button>

      <div v-if="invoices.length === 0" class="text-gray-600">Noch keine Rechnungen vorhanden.</div>

      <ul v-else class="space-y-4">
        <li
          v-for="invoice in invoices"
          :key="invoice.id"
          class="bg-white p-4 rounded shadow flex justify-between items-center"
        >
          <div>
            <p class="font-semibold">{{ invoice.title }}</p>
            <p class="text-sm text-gray-500">{{ invoice.date }}</p>
          </div>
          <button class="text-blue-600 hover:underline" @click="viewInvoice(invoice.id)">
            Anzeigen
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Dummy-Daten — später ersetzen durch Supabase-Abfrage
const invoices = ref([
  { id: 1, title: 'Rechnung für VHS Köln', date: '01.08.2025' },
  { id: 2, title: 'Rechnung für Goethe-Institut', date: '25.07.2025' },
])

const goToCreate = () => {
  router.push('/invoice/new')
}

const viewInvoice = (id: number) => {
  router.push(`/invoice/${id}`)
}
</script>
