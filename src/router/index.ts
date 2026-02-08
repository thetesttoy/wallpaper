import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: { title: '雪之下 - 首页' }
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('../views/Gallery.vue'),
      meta: { title: '雪之下 - 瀑布流展示' }
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('../views/FavoritesPage.vue'),
      meta: { 
        title: '我的收藏',
        requiresAuth: true
      }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      next({ name: 'gallery' })
      return
    }
  }

  next()
})

export default router
