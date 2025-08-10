<template>
  <div class="auth-container">
    <div class="auth-box">
      <h2>🔐 Anmeldung / Registrierung</h2>

      <div class="form-grid">
        <label for="email">E-Mail-Adresse</label>
        <input id="email" v-model="email" type="email" placeholder="you@example.com" />

        <label for="password">Passwort</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Mindestens 6 Zeichen"
        />
      </div>

      <div class="button-row">
        <button @click="login" class="btn-primary">Anmelden</button>
        <button @click="register" class="btn-secondary">Registrieren</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

const email = ref('')
const password = ref('')
const router = useRouter()

// Handle user login
const login = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    alert('❌ Login failed: ' + error.message)
    return
  }

  // Redirect to invoice form on successful login
  router.push('/invoice')
}

// Handle user registration
const register = async () => {
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      emailRedirectTo: 'http://localhost:5173/invoice',
    },
  })

  if (error) {
    alert('❌ Registration failed: ' + error.message)
    return
  }

  // Inform the user to confirm their email before logging in
  alert('✅ Registration successful! Please confirm your email and then log in.')
}
</script>
