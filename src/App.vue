<template>
  <div>
    <header v-if="isAuthenticated" class="app-header">
      <nav class="app-nav">
        <router-link to="/invoice">+ Rechnung</router-link>
        <router-link to="/invoices">Rechnungen</router-link>
        <router-link to="/profile">Profil</router-link>
        <button type="button" class="btn-logout" @click="logout">🚪 Abmelden</button>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

const router = useRouter()
const isAuthenticated = ref(false)

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  isAuthenticated.value = !!session
  supabase.auth.onAuthStateChange((_event, session) => {
    isAuthenticated.value = !!session
  })
})

const logout = async () => {
  await supabase.auth.signOut({ scope: 'local' })
  isAuthenticated.value = false
  router.push('/auth')
}
</script>

<style scoped>
.app-header {
  background: #1f2937;
  color: white;
  padding: 0.5rem 1rem;
}
.app-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.app-nav a {
  color: white;
  text-decoration: none;
}
.app-nav a:hover {
  text-decoration: underline;
}
.btn-logout {
  margin-left: auto;
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}
.btn-logout:hover {
  background: #b91c1c;
}
</style>

<style>
/* kann man globale Style hinzufügen */
</style>
