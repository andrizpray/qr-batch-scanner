/// <reference types="vite/client" />
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/mobile'
    },
    {
      path: '/mobile',
      name: 'BatchList',
      component: () => import('../views/Mobile/BatchList.vue')
    },
    {
      path: '/mobile/scanner/:batchId',
      name: 'Scanner',
      component: () => import('../views/Mobile/Scanner.vue')
    },
    {
      path: '/mobile/history/:batchId',
      name: 'ScanHistory',
      component: () => import('../views/Mobile/ScanHistory.vue')
    },
    {
      path: '/admin',
      name: 'Dashboard',
      component: () => import('../views/Admin/Dashboard.vue')
    },
    {
      path: '/admin/batch/:id',
      name: 'BatchDetail',
      component: () => import('../views/Admin/BatchDetail.vue')
    }
  ]
})

export default router
