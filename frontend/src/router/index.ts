import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/SignListView.vue'),
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue'),
    },
    {
      path: '/signs/compare',
      name: 'sign-compare',
      component: () => import('@/views/SignCompareView.vue'),
    },
    {
      path: '/signs/:id',
      name: 'sign-detail',
      component: () => import('@/views/SignDetailView.vue'),
      props: true,
    },
  ],
});

export default router;
