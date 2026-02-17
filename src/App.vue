<template>
  <div>
    <header v-if="isAuthenticated" class="app-header">
      <button type="button" class="btn-menu" @click="menuOpen = !menuOpen" aria-label="Menü">
        ☰
      </button>
      <nav class="app-nav" :class="{ open: menuOpen }">
        <router-link to="/dashboard" @click="menuOpen = false">📊 Dashboard</router-link>
        <router-link to="/invoice" @click="menuOpen = false">+ Rechnung</router-link>
        <router-link to="/invoices" @click="menuOpen = false">Rechnungen</router-link>
        <router-link to="/customers" @click="menuOpen = false">Kunden</router-link>
        <router-link to="/profile" @click="menuOpen = false">Profil</router-link>
        <button type="button" class="btn-logout" @click="logout">🚪 Abmelden</button>
      </nav>
    </header>
    <main>
      <router-view :key="$route.fullPath" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, handleExpiredSession } from '@/lib/supabaseClient'

const router = useRouter()
const isAuthenticated = ref(false)
const menuOpen = ref(false)

onMounted(async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    isAuthenticated.value = !!session
    // Refresh session to avoid expired JWT (tokens expire ~1h)
    if (session) {
      const { error: refreshErr } = await supabase.auth.refreshSession()
      if (refreshErr) throw refreshErr
    }
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).toLowerCase()
    if (msg.includes('invalidjwt') || msg.includes('exp') || msg.includes('jwt')) {
      handleExpiredSession()
      return
    }
  }
  supabase.auth.onAuthStateChange((_event, session) => {
    isAuthenticated.value = !!session
  })
})

const logout = async () => {
  await supabase.auth.signOut({ scope: 'local' })
  isAuthenticated.value = false
  menuOpen.value = false
  router.push('/auth')
}
</script>

<style scoped>
.app-header {
  background: #1f2937;
  color: white;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-menu {
  display: none;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.25rem;
  min-height: 44px;
  min-width: 44px;
}
.app-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}
.app-nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
.app-nav a:hover {
  text-decoration: underline;
}
.btn-logout {
  margin-left: auto;
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  min-height: 44px;
}
.btn-logout:hover {
  background: #b91c1c;
}

@media (max-width: 640px) {
  .btn-menu {
    display: block;
  }
  .app-nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #1f2937;
    flex-direction: column;
    padding: 1rem;
    gap: 0;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.2s ease;
  }
  .app-nav.open {
    max-height: 300px;
  }
  .app-nav a,
  .btn-logout {
    width: 100%;
    margin-left: 0;
    margin-bottom: 0.25rem;
    justify-content: center;
  }
}
</style>

<style>
/* kann man globale Style hinzufügen */
</style>
