<template>
  <div class="page">
    <header class="flex between">
      <h2>Kunden</h2>
      <div class="actions">
        <button class="btn" @click="reload" :disabled="loading">🔄 Aktualisieren</button>
        <button class="btn primary" @click="openForm()">+ Neuer Kunde</button>
      </div>
    </header>

    <template v-if="loading">Laden…</template>

    <div v-else-if="clients.length" class="clients-container">
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
            <td>{{ c.name || [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(' · ') || '—' }}</td>
            <td>{{ [c.address_line1, c.address_line2].filter(Boolean).join(', ') || [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(', ') || '—' }}</td>
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
          <div class="card-row"><span class="card-label">Name</span>{{ c.name || [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(' · ') || '—' }}</div>
          <div class="card-row"><span class="card-label">Adresse</span>{{ [c.address_line1, c.address_line2].filter(Boolean).join(', ') || [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(', ') || '—' }}</div>
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

    <!-- Modal: Add/Edit -->
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
import { supabase } from '@/lib/supabaseClient'

type ClientRow = {
  id: string
  name: string | null
  address_line1?: string | null
  address_line2?: string | null
  company_line1?: string | null
  company_line2?: string | null
  company_line3?: string | null
  phone: string | null
  email: string | null
  leistungsbeschreibung?: string | null
  verwendungszweck?: string | null
  rechnung_preset?: string | null
}

const clients = ref<ClientRow[]>([])
const loading = ref(true)
const removingId = ref<string | null>(null)
const formOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const form = ref({
  name: '',
  address_line1: '',
  address_line2: '',
  phone: '',
  email: '',
  leistungsbeschreibung: '',
  verwendungszweck: '',
  rechnung_preset: '',
})

async function fetchClients(userId: string) {
  loading.value = true
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, address_line1, address_line2, company_line1, company_line2, company_line3, phone, email, leistungsbeschreibung, verwendungszweck, rechnung_preset')
    .eq('user_id', userId)
    .order('name')

  if (error) {
    console.error('Failed to load clients:', error.message)
    clients.value = []
  } else {
    clients.value = (data ?? []) as ClientRow[]
  }
  loading.value = false
}

async function reload() {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (user) await fetchClients(user.id)
}

function openForm(c?: ClientRow) {
  editingId.value = c?.id ?? null
  const addr1 = c ? (c.address_line1 ?? c.company_line1 ?? '') : ''
  const addr2 = c ? (c.address_line2 ?? c.company_line2 ?? '') : ''
  const displayName = c ? (c.name ?? [c.company_line1, c.company_line2, c.company_line3].filter(Boolean).join(' · ') ?? '') : ''
  form.value = {
    name: displayName,
    address_line1: addr1,
    address_line2: addr2,
    phone: c?.phone ?? '',
    email: c?.email ?? '',
    leistungsbeschreibung: c?.leistungsbeschreibung ?? '',
    verwendungszweck: c?.verwendungszweck ?? '',
    rechnung_preset: c?.rechnung_preset ?? '',
  }
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
}

async function saveClient() {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) return

  saving.value = true
  try {
    const payload = {
      user_id: user.id,
      name: form.value.name.trim(),
      address_line1: form.value.address_line1.trim(),
      address_line2: form.value.address_line2.trim(),
      phone: form.value.phone.trim() || null,
      email: form.value.email.trim() || null,
      leistungsbeschreibung: form.value.leistungsbeschreibung.trim() || null,
      verwendungszweck: form.value.verwendungszweck.trim() || null,
      rechnung_preset: form.value.rechnung_preset || null,
    }

    if (editingId.value) {
      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', editingId.value)
        .eq('user_id', user.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('clients').insert(payload)
      if (error) throw error
    }
    closeForm()
    await fetchClients(user.id)
  } catch (e) {
    console.error('Save client:', e)
    alert('Fehler: ' + (e instanceof Error ? e.message : String(e)))
  } finally {
    saving.value = false
  }
}

async function remove(c: ClientRow) {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) return

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', c.id)

  if (count && count > 0) {
    if (!confirm(`Kunde «${c.name}» hat ${count} Rechnung(en). Trotzdem löschen?`)) return
  } else if (!confirm(`Kunde «${c.name}» wirklich löschen?`)) return

  removingId.value = c.id
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', c.id)
    .eq('user_id', user.id)

  removingId.value = null
  if (error) {
    alert('Löschen fehlgeschlagen: ' + error.message)
    return
  }
  await fetchClients(user.id)
}

onMounted(async () => {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (user) await fetchClients(user.id)
})
</script>

<style scoped>
.page { padding: 16px; }
.flex.between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
  flex-wrap: wrap;
}
.actions { display: flex; gap: 8px; }
.btn {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  text-decoration: none;
}
.btn.primary { border-color: #3b82f6; color: #3b82f6; }
.btn.danger { border-color: #ef4444; color: #ef4444; }
.btn.link { border-color: #3b82f6; color: #3b82f6; }
.btn:disabled { opacity: 0.6; cursor: default; }

.tbl { width: 100%; border-collapse: collapse; }
.tbl th, .tbl td { padding: 8px 10px; border-bottom: 1px solid #eee; text-align: left; }

.client-cards { display: none; }
@media (max-width: 640px) {
  .tbl-desktop { display: none; }
  .client-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .client-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .card-row { padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; }
  .card-row:last-child { border-bottom: none; }
  .card-label { display: inline-block; min-width: 4rem; color: #6b7280; font-size: 0.875rem; }
  .card-actions { display: flex; gap: 0.5rem; padding-top: 0.75rem; }
  .card-actions .btn { min-height: 44px; flex: 1; }
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal h3 { margin: 0 0 1rem 0; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
.form-group input, .form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem; }
</style>
