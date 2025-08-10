<template>
  <nav class="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
    <div class="flex space-x-4">
      <router-link to="/profile" class="hover:underline">🧾 Meine Rechnungsdaten</router-link>
      <router-link to="/dashboard" class="hover:underline">📋 Dashboard</router-link>
    </div>
    <button @click="logout" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
      🚪 Abmelden
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

const router = useRouter()

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/auth')
}
</script>
