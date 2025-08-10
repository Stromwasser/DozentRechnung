<template>
  <div>
    <h2>🧾 Meine Rechnungsdaten</h2>

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
    <button @click="logout" style="margin-left: 1rem; background-color: #eee">🚪 Abmelden</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

const router = useRouter()

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

  if (userError || !user) {
    console.error('Benutzerfehler:', userError)
    router.push('/auth')
    return
  }

  const { data, error } = await supabase.from('user_profile').select('*').eq('id', user.id).single()

  if (data) {
    profile.value = data
  }

  if (error) {
    console.error('Fehler beim Laden des Profils:', error)
  }
}

const saveProfile = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const payload = { ...profile.value, id: user?.id }

  const { error } = await supabase.from('user_profile').upsert(payload)

  if (error) {
    alert('Fehler beim Speichern der Daten.')
    console.error(error)
  } else {
    alert('Daten erfolgreich gespeichert!')
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/auth')
}

onMounted(loadProfile)
</script>
