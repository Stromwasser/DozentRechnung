<template>
  <div class="page">
    <h2>🧾 Meine Rechnungsdaten</h2>

    <div class="form-grid">
      <div class="form-group">
        <label>Name / Firmenname:</label>
        <input v-model="profile.name" />
      </div>
      <div class="form-group">
        <label>Straße und Hausnummer:</label>
        <input v-model="profile.address_line1" />
      </div>
      <div class="form-group">
        <label>PLZ und Stadt:</label>
        <input v-model="profile.address_line2" />
      </div>
      <div class="form-group">
        <label>Telefon:</label>
        <input v-model="profile.phone" />
      </div>
      <div class="form-group">
        <label>E-Mail:</label>
        <input v-model="profile.email" />
      </div>
      <div class="form-group">
        <label>Steuernummer:</label>
        <input v-model="profile.tax_number" />
      </div>
      <div class="form-group">
        <label>IBAN:</label>
        <input v-model="profile.iban" />
      </div>
      <div class="form-group">
        <label>BIC:</label>
        <input v-model="profile.bic" />
      </div>
    </div>

    <button @click="saveProfile" class="btn primary">💾 Daten speichern</button>
    <p v-if="saved" class="saved-msg">Gespeichert ✓</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { LOCAL_USER_ID, localGetProfile, localUpsertProfile } from '@/lib/localStore'

const saved = ref(false)

const profile = ref({
  name: '',
  address_line1: '',
  address_line2: '',
  phone: '',
  email: '',
  tax_number: '',
  iban: '',
  bic: '',
})

onMounted(() => {
  const data = localGetProfile() as typeof profile.value | null
  if (data) profile.value = { ...profile.value, ...data }
})

function saveProfile() {
  localUpsertProfile({ ...profile.value, id: LOCAL_USER_ID })
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>

<style scoped>
.page { padding: 16px; max-width: 480px; }
.form-grid { display: grid; gap: 0.75rem; margin-bottom: 1.5rem; }
.form-group { display: grid; gap: 4px; }
.form-group label { font-weight: 500; font-size: 0.9rem; }
.form-group input { padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; }
.btn.primary {
  padding: 0.6rem 1.2rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.saved-msg { color: #16a34a; margin-top: 0.5rem; }
</style>
