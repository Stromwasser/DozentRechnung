import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/invoice',
    name: 'invoice-new',
    component: () => import('@/components/InvoiceForm.vue'),
  },
  {
    path: '/invoice/:id/regenerate',
    name: 'invoice-regenerate',
    component: () => import('@/views/RegenerateInvoiceView.vue'),
  },
  {
    path: '/invoice/:id',
    name: 'invoice-edit',
    component: () => import('@/components/InvoiceForm.vue'),
  },
  {
    path: '/invoices',
    name: 'invoices',
    component: () => import('@/views/InvoicesView.vue'),
  },
  {
    path: '/customers',
    name: 'customers',
    component: () => import('@/views/CustomersView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
