<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import { fetchSignsBatch } from '@/api/signs';
import type { BusSign } from '@/types/sign';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const signs = ref<BusSign[]>([]);
const loading = ref(true);

const leftSign = computed(() => signs.value[0] || null);
const rightSign = computed(() => signs.value[1] || null);

function parseIds(): number[] | null {
  const raw = route.query.ids;
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const ids = raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (ids.length !== 2) return null;
  return ids;
}

async function loadCompare() {
  const ids = parseIds();
  if (!ids) {
    toast.add({ severity: 'error', summary: '参数错误', detail: '请选择两条站牌进行对比', life: 3000 });
    router.push('/');
    return;
  }
  loading.value = true;
  try {
    const data = await fetchSignsBatch(ids);
    if (data.length !== 2) {
      toast.add({ severity: 'error', summary: '数据不足', detail: '未能找到两条完整的站牌记录', life: 3000 });
      router.push('/');
      return;
    }
    const orderMap = new Map(ids.map((id, idx) => [id, idx]));
    data.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    signs.value = data;
  } catch {
    toast.add({ severity: 'error', summary: '加载失败', life: 3000 });
    router.push('/');
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadCompare();
});

function goBack() {
  router.push('/');
}

function swapSigns() {
  signs.value = [signs.value[1], signs.value[0]];
}

function goDetail(id: number) {
  router.push({ name: 'sign-detail', params: { id } });
}
</script>

<template>
  <div class="min-h-screen">
    <header class="bg-brand-600 text-white shadow-md">
      <div class="mx-auto max-w-6xl px-4 py-5">
        <Button
          icon="pi pi-arrow-left"
          label="返回图鉴"
          text
          class="mb-2 !text-white hover:!bg-white/10"
          @click="goBack"
        />
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">站牌对比</h1>
          <Button
            icon="pi pi-refresh"
            label="交换位置"
            text
            class="!text-white hover:!bg-white/10"
            @click="swapSigns"
          />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div v-if="loading" class="flex justify-center py-20">
        <ProgressSpinner />
      </div>

      <template v-else-if="leftSign && rightSign">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            v-for="(sign, idx) in [leftSign, rightSign]"
            :key="sign.id"
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3"
            >
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                  :class="idx === 0 ? 'bg-brand-600 text-white' : 'bg-amber-500 text-white'"
                >
                  {{ idx === 0 ? 'A' : 'B' }}
                </span>
                <span class="font-medium text-slate-700">{{ idx === 0 ? '左侧' : '右侧' }}站牌</span>
              </div>
              <Button
                label="查看详情"
                icon="pi pi-external-link"
                size="small"
                text
                @click="goDetail(sign.id)"
              />
            </div>

            <div class="p-6">
              <div class="mb-6 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                <img
                  :src="sign.imageUrl"
                  :alt="`${sign.city}站牌`"
                  class="block aspect-[16/9] w-full object-cover"
                />
              </div>

              <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 class="text-2xl font-bold text-slate-800">{{ sign.city }}</h2>
                  <p class="mt-1 text-sm text-slate-400">记录 #{{ sign.id }}</p>
                </div>
                <div class="flex gap-2">
                  <Tag :value="sign.era" severity="info" />
                  <Tag
                    :value="sign.inUse ? '使用中' : '已停用'"
                    :severity="sign.inUse ? 'success' : 'secondary'"
                  />
                </div>
              </div>

              <dl class="space-y-4">
                <div class="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p class="text-xs text-slate-400">城市</p>
                    <p class="mt-1 font-medium text-slate-800">{{ sign.city }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400">年代</p>
                    <p class="mt-1 font-medium text-slate-800">{{ sign.era }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400">使用状态</p>
                    <p class="mt-1 font-medium text-slate-800">{{ sign.inUse ? '使用中' : '已停用' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400">图片链接</p>
                    <a
                      :href="sign.imageUrl"
                      target="_blank"
                      class="mt-1 block truncate font-medium text-brand-600 hover:underline"
                    >
                      查看原图
                    </a>
                  </div>
                </div>

                <div>
                  <p class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">样式描述</p>
                  <p class="leading-relaxed text-slate-700">{{ sign.styleDescription }}</p>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 text-lg font-semibold text-slate-800">差异速览</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="w-1/4 py-3 text-left font-medium text-slate-400">属性</th>
                  <th class="w-3/8 py-3 text-left font-medium text-brand-600">
                    <span class="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">A</span>
                    {{ leftSign.city }}
                  </th>
                  <th class="w-3/8 py-3 text-left font-medium text-amber-600">
                    <span class="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">B</span>
                    {{ rightSign.city }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="py-3 text-slate-500">年代</td>
                  <td class="py-3 font-medium" :class="leftSign.era === rightSign.era ? 'text-slate-600' : 'text-brand-700'">
                    {{ leftSign.era }}
                  </td>
                  <td class="py-3 font-medium" :class="leftSign.era === rightSign.era ? 'text-slate-600' : 'text-amber-700'">
                    {{ rightSign.era }}
                  </td>
                </tr>
                <tr>
                  <td class="py-3 text-slate-500">使用状态</td>
                  <td class="py-3 font-medium" :class="leftSign.inUse === rightSign.inUse ? 'text-slate-600' : 'text-brand-700'">
                    {{ leftSign.inUse ? '使用中' : '已停用' }}
                  </td>
                  <td class="py-3 font-medium" :class="leftSign.inUse === rightSign.inUse ? 'text-slate-600' : 'text-amber-700'">
                    {{ rightSign.inUse ? '使用中' : '已停用' }}
                  </td>
                </tr>
                <tr>
                  <td class="py-3 align-top text-slate-500">样式描述</td>
                  <td class="py-3 leading-relaxed text-slate-600">{{ leftSign.styleDescription }}</td>
                  <td class="py-3 leading-relaxed text-slate-600">{{ rightSign.styleDescription }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
