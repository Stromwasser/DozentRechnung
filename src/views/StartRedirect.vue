<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const router = useRouter()

onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    router.push('/profile')
  } else {
    router.push('/auth')
  }
})
</script>

<template>
  <div class="text-center mt-10 text-gray-600">Weiterleitung…</div>
</template>
