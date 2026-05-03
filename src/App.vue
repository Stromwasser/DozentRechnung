<template>
  <div>
    <header class="app-header">
      <button type="button" class="btn-menu" @click="menuOpen = !menuOpen" aria-label="Menü">
        ☰
      </button>
      <nav class="app-nav" :class="{ open: menuOpen }">
        <router-link to="/dashboard" @click="menuOpen = false">📊 Dashboard</router-link>
        <router-link to="/invoice" @click="menuOpen = false">+ Rechnung</router-link>
        <router-link to="/invoices" @click="menuOpen = false">Rechnungen</router-link>
        <router-link to="/customers" @click="menuOpen = false">Kunden</router-link>
        <router-link to="/profile" @click="menuOpen = false">Profil</router-link>
      </nav>
    </header>
    <main>
      <router-view :key="$route.fullPath" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const menuOpen = ref(false)
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
  .app-nav a {
    width: 100%;
    margin-bottom: 0.25rem;
    justify-content: center;
  }
}
</style>
