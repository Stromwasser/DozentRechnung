<template>
  <div>
    <h2>🧾 Meine Rechnungsdaten</h2>

    <div v-if="loading">⏳ Daten werden geladen...</div>

    <div v-else>
      <div>
        <label>Name / Firmenname:</label>
        <input v-model="profile.name" />
      </div>
      <div>
        <label>Anschrift:</label>
        <input v-model="profile.address" />
      </div>
      <div>
        <label>Telefon:</label>
        <input v-model="profile.phone" />
      </div>
      <div>
        <label>E-Mail:</label>
        <input v-model="profile.email" />
      </div>
      <div>
        <label>Steuernummer:</label>
        <input v-model="profile.tax_number" />
      </div>
      <div>
        <label>IBAN:</label>
        <input v-model="profile.iban" />
      </div>
      <div>
        <label>BIC:</label>
        <input v-model="profile.bic" />
      </div>
      <button @click="saveProfile">💾 Daten speichern</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const loading = ref(true)

const profile = ref({
  name: '',
  address: '',
  phone: '',
  email: '',
  tax_number: '',
  iban: '',
  bic: '',
})

const loadProfile = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error('Fehler beim Abrufen des Benutzers:', userError)
    alert('Fehler beim Laden des Benutzers.')
    loading.value = false
    return
  }

  if (!user?.id) {
    alert('Benutzer ist nicht angemeldet.')
    loading.value = false
    return
  }

  const { data, error } = await supabase.from('user_profile').select('*').eq('id', user.id).single()

  if (error) {
    console.error('Fehler beim Laden des Profils:', error)
  } else if (data) {
    profile.value = data
  }

  loading.value = false
}

const saveProfile = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.id) {
    alert('Benutzer ist nicht angemeldet.')
    return
  }

  const payload = { ...profile.value, id: user.id }

  const { error } = await supabase.from('user_profile').upsert(payload)

  if (error) {
    console.error('Fehler beim Speichern der Daten:', error)
    alert('Fehler beim Speichern der Daten.')
  } else {
    alert('Daten erfolgreich gespeichert!')
  }
}

onMounted(loadProfile)
</script>
