<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import AppHeader from '@/components/AppHeader.vue';
import { fetchRandomSign } from '@/api/signs';
import type { BusSign } from '@/types/sign';

const router = useRouter();
const toast = useToast();

const sign = ref<BusSign | null>(null);
const loading = ref(false);
const empty = ref(false);

async function loadRandom() {
  loading.value = true;
  empty.value = false;
  try {
    sign.value = await fetchRandomSign();
  } catch (err: any) {
    if (err?.response?.status === 404) {
      empty.value = true;
      sign.value = null;
    } else {
      toast.add({ severity: 'error', summary: '加载失败', detail: '无法获取随机站牌', life: 3000 });
    }
  } finally {
    loading.value = false;
  }
}

function goDetail() {
  if (sign.value) {
    router.push({ name: 'sign-detail', params: { id: sign.value.id } });
  }
}

function goHome() {
  router.push({ name: 'home' });
}

onMounted(() => {
  loadRandom();
});
</script>

<template>
  <div class="min-h-screen">
    <AppHeader title="随机发现" icon="pi pi-compass" subtitle="随机探索，发现有趣的站牌设计" show-back back-label="返回首页" back-route="home" />

    <main class="mx-auto max-w-4xl px-4 py-8">
      <div v-if="loading" class="flex justify-center py-20">
        <ProgressSpinner />
      </div>

      <template v-else-if="empty">
        <div class="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <i class="pi pi-inbox text-5xl text-slate-300"></i>
          <h3 class="mt-4 text-xl font-semibold text-slate-700">暂无站牌数据</h3>
          <p class="mt-2 text-slate-500">当前没有可用的站牌记录，请先添加一些站牌。</p>
          <Button class="mt-6" label="返回首页" icon="pi pi-home" @click="goHome" />
        </div>
      </template>

      <template v-else-if="sign">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="relative block w-full overflow-hidden">
            <img
              :src="sign.imageUrl"
              :alt="`${sign.city}站牌`"
              class="block aspect-[16/9] w-full object-cover"
            />
          </div>
          <div class="p-6 md:p-8">
            <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 class="text-3xl font-bold text-slate-800">{{ sign.city }}</h2>
                <p class="mt-1 text-slate-500"><span class="font-medium">{{ sign.province }}</span> · 公交站牌设计记录 #{{ sign.id }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <Tag :value="sign.era" severity="info" />
                <Tag
                  v-if="sign.tags && sign.tags.length > 0"
                  v-for="tag in sign.tags"
                  :key="tag.id"
                  :value="tag.name"
                  :severity="tag.color as any"
                />
                <Tag
                  :value="sign.inUse ? '使用中' : '已停用'"
                  :severity="sign.inUse ? 'success' : 'secondary'"
                />
              </div>
            </div>

            <section class="mb-8">
              <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">样式描述</h3>
              <p class="leading-relaxed text-slate-700">{{ sign.styleDescription }}</p>
            </section>

            <section class="mb-8 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-4">
              <div>
                <p class="text-xs text-slate-400">省份</p>
                <p class="font-medium">{{ sign.province }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">城市</p>
                <p class="font-medium">{{ sign.city }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">年代</p>
                <p class="font-medium">{{ sign.era }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">使用状态</p>
                <p class="font-medium">{{ sign.inUse ? '使用中' : '已停用' }}</p>
              </div>
            </section>

            <div class="flex flex-wrap gap-3">
              <Button
                label="换一条"
                icon="pi pi-refresh"
                :loading="loading"
                @click="loadRandom"
              />
              <Button
                label="查看详情"
                icon="pi pi-eye"
                @click="goDetail"
              />
              <Button
                label="返回首页"
                icon="pi pi-home"
                outlined
                @click="goHome"
              />
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
