<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const router = useRouter()
const isLoggedIn = ref<boolean | null>(null)

onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    isLoggedIn.value = true
  } else {
    router.push('/auth')
  }
})
</script>

<template>
  <div v-if="isLoggedIn === null" class="start-page">
    <p class="text-gray-600">Weiterleitung…</p>
  </div>
  <div v-else class="start-page">
    <h2>Willkommen</h2>
    <div class="start-actions">
      <router-link to="/invoice" class="start-btn primary">+ Neue Rechnung</router-link>
      <router-link to="/invoices" class="start-btn">📋 Meine Rechnungen</router-link>
    </div>
  </div>
</template>

<style scoped>
.start-page {
  padding: 2rem;
  text-align: center;
}
.start-page h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}
.start-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 280px;
  margin: 0 auto;
}
.start-btn {
  display: block;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  text-align: center;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
}
.start-btn:hover {
  background: #f9fafb;
}
.start-btn.primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}
.start-btn.primary:hover {
  background: #1d4ed8;
}
</style>
