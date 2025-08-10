// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/start' },

  // public
  { path: '/start', name: 'start', component: () => import('@/views/StartRedirect.vue') },
  { path: '/auth', name: 'auth', component: () => import('@/views/AuthView.vue') },

  // protected
  {
    path: '/invoice',
    name: 'invoice-new',
    component: () => import('@/components/InvoiceForm.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/invoices',
    name: 'invoices',
    component: () => import('@/views/InvoicesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/customers',
    name: 'customers',
    component: () => import('@/views/CustomersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// auth guard
router.beforeEach(async (to, _from, next) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (to.meta.requiresAuth && !session) next({ name: 'auth' })
  else next()
})

export default router
