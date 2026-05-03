<template>
  <div class="page">
    <header class="flex between">
      <h2>Kunden</h2>
      <div class="actions">
        <button class="btn primary" @click="openForm()">+ Neuer Kunde</button>
      </div>
    </header>

    <div v-if="clients.length" class="clients-container">
      <table class="tbl tbl-desktop">
        <thead>
          <tr>
            <th>Name</th>
            <th>Adresse</th>
            <th>Kontakt</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clients" :key="c.id">
            <td>{{ displayName(c) }}</td>
            <td>{{ [c.address_line1, c.address_line2].filter(Boolean).join(', ') || '—' }}</td>
            <td>{{ c.email || c.phone || '—' }}</td>
            <td>
              <button class="btn link" @click="openForm(c)">Bearbeiten</button>
              <button class="btn danger" @click="remove(c)" :disabled="removingId === c.id">
                {{ removingId === c.id ? '…' : 'Löschen' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="client-cards">
        <div v-for="c in clients" :key="c.id" class="client-card">
          <div class="card-row"><span class="card-label">Name</span>{{ displayName(c) }}</div>
          <div class="card-row"><span class="card-label">Adresse</span>{{ [c.address_line1, c.address_line2].filter(Boolean).join(', ') || '—' }}</div>
          <div class="card-row"><span class="card-label">Kontakt</span>{{ c.email || c.phone || '—' }}</div>
          <div class="card-row card-actions">
            <button class="btn link" @click="openForm(c)">Bearbeiten</button>
            <button class="btn danger" @click="remove(c)" :disabled="removingId === c.id">
              {{ removingId === c.id ? '…' : 'Löschen' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-else>Keine Kunden. Klicke «+ Neuer Kunde» um einen anzulegen.</p>

    <Teleport to="body">
      <div v-if="formOpen" class="modal-overlay" @click.self="closeForm">
        <div class="modal">
          <h3>{{ editingId ? 'Kunde bearbeiten' : 'Neuer Kunde' }}</h3>
          <form @submit.prevent="saveClient">
            <div class="form-group">
              <label>Firmenname *</label>
              <input v-model="form.name" required />
            </div>
            <div class="form-group">
              <label>Straße und Hausnummer *</label>
              <input v-model="form.address_line1" required />
            </div>
            <div class="form-group">
              <label>PLZ und Stadt *</label>
              <input v-model="form.address_line2" required />
            </div>
            <div class="form-group">
              <label>Telefon</label>
              <input v-model="form.phone" type="tel" />
            </div>
            <div class="form-group">
              <label>E-Mail *</label>
              <input v-model="form.email" type="email" required />
            </div>
            <details class="form-group">
              <summary>Erweiterte Einstellungen</summary>
              <div class="form-group">
                <label>Leistungsbeschreibung (für PDF)</label>
                <input v-model="form.leistungsbeschreibung" placeholder="z. B. Unterricht Integrationskurs" />
              </div>
              <div class="form-group">
                <label>Verwendungszweck</label>
                <input v-model="form.verwendungszweck" placeholder="z. B. Rechnung Nr. 2026-02-001" />
              </div>
              <div class="form-group">
                <label>Rechnungs-Preset</label>
                <select v-model="form.rechnung_preset">
                  <option value="">— Standard —</option>
                  <option value="bamf_ik">BAMF Integrationskurs</option>
                  <option value="bsk">Berufssprachkurs</option>
                  <option value="sonstige">Sonstige</option>
                </select>
              </div>
            </details>
            <div class="modal-actions">
              <button type="button" class="btn" @click="closeForm">Abbrechen</button>
              <button type="submit" class="btn primary" :disabled="saving">
                {{ saving ? '…' : 'Speichern' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  localListClients,
  localSaveClient,
  localDeleteClient,
  localCountInvoicesForClient,
  type LocalClientRow,
} from '@/lib/localStore'

type ClientRow = LocalClientRow

const clients = ref<ClientRow[]>([])
const removingId = ref<string | null>(null)
const formOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const emptyForm = () => ({
  name: '',
  address_line1: '',
  address_line2: '',
  phone: '',
  email: '',
  leistungsbeschreibung: '',
  verwendungszweck: '',
  rechnung_preset: '',
})
const form = ref(emptyForm())

function displayName(c: ClientRow): string {
  return c.name || [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(' · ') || '—'
}

function fetchClients() {
  clients.value = localListClients()
}

function openForm(c?: ClientRow) {
  editingId.value = c?.id ?? null
  form.value = c
    ? {
        name: displayName(c) === '—' ? '' : displayName(c),
        address_line1: c.address_line1 ?? '',
        address_line2: c.address_line2 ?? '',
        phone: c.phone ?? '',
        email: c.email ?? '',
        leistungsbeschreibung: c.leistungsbeschreibung ?? '',
        verwendungszweck: c.verwendungszweck ?? '',
        rechnung_preset: c.rechnung_preset ?? '',
      }
    : emptyForm()
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
}

function saveClient() {
  saving.value = true
  localSaveClient({
    ...(editingId.value ? { id: editingId.value } : {}),
    name: form.value.name.trim(),
    address_line1: form.value.address_line1.trim(),
    address_line2: form.value.address_line2.trim(),
    phone: form.value.phone.trim() || null,
    email: form.value.email.trim() || null,
    leistungsbeschreibung: form.value.leistungsbeschreibung.trim() || null,
    verwendungszweck: form.value.verwendungszweck.trim() || null,
    rechnung_preset: form.value.rechnung_preset || null,
  })
  saving.value = false
  closeForm()
  fetchClients()
}

function remove(c: ClientRow) {
  const count = localCountInvoicesForClient(c.id)
  const msg = count > 0
    ? `Kunde «${c.name}» hat ${count} Rechnung(en). Trotzdem löschen?`
    : `Kunde «${c.name}» wirklich löschen?`
  if (!confirm(msg)) return
  removingId.value = c.id
  localDeleteClient(c.id)
  removingId.value = null
  fetchClients()
}

onMounted(fetchClients)
</script>

<style scoped>
.page { padding: 16px; }
.flex.between { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 8px; flex-wrap: wrap; }
.actions { display: flex; gap: 8px; }
.btn { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; cursor: pointer; text-decoration: none; }
.btn.primary { border-color: #3b82f6; color: #3b82f6; }
.btn.danger { border-color: #ef4444; color: #ef4444; }
.btn.link { border-color: #3b82f6; color: #3b82f6; }
.btn:disabled { opacity: 0.6; cursor: default; }

.tbl { width: 100%; border-collapse: collapse; }
.tbl th, .tbl td { padding: 8px 10px; border-bottom: 1px solid #eee; text-align: left; }

.client-cards { display: none; }
@media (max-width: 640px) {
  .tbl-desktop { display: none; }
  .client-cards { display: flex; flex-direction: column; gap: 1rem; }
  .client-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .card-row { padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; }
  .card-row:last-child { border-bottom: none; }
  .card-label { display: inline-block; min-width: 4rem; color: #6b7280; font-size: 0.875rem; }
  .card-actions { display: flex; gap: 0.5rem; padding-top: 0.75rem; }
  .card-actions .btn { min-height: 44px; flex: 1; }
}

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: #fff; border-radius: 8px; padding: 1.5rem; max-width: 420px; width: 100%; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin: 0 0 1rem 0; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
.form-group input, .form-group select { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; }
.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem; }
</style>
