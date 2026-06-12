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
      path: '/signs/:id',
      name: 'sign-detail',
      component: () => import('@/views/SignDetailView.vue'),
      props: true,
    },
  ],
});

export default router;
