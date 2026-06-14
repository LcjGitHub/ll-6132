<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import AppHeader from '@/components/AppHeader.vue';
import { useSignsStore } from '@/stores/signs';
import type { BusSign } from '@/types/sign';

const store = useSignsStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const previewSign = ref<BusSign | null>(null);
const previewVisible = ref(false);

onMounted(async () => {
  try {
    await store.loadHistory();
  } catch {
    toast.add({ severity: 'error', summary: '错误', detail: '加载浏览历史失败', life: 4000 });
  }
});

function openPreview(sign: BusSign) {
  previewSign.value = sign;
  previewVisible.value = true;
}

function goDetail(id: number) {
  router.push({ name: 'sign-detail', params: { id } });
}

function confirmClearAll() {
  confirm.require({
    message: '确定清空全部浏览历史吗？此操作不可恢复。',
    header: '确认清空历史',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '清空',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.clearAllHistory();
        toast.add({ severity: 'success', summary: '已清空全部浏览历史', life: 2000 });
      } catch {
        toast.add({ severity: 'error', summary: '操作失败', life: 3000 });
      }
    },
  });
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader
      title="浏览历史"
      subtitle="记录你最近浏览过的站牌（最多20条）"
      icon="pi pi-history"
    >
      <template #right>
        <Button
          v-if="store.history.length > 0"
          label="清空全部"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="confirmClearAll"
        />
      </template>
    </AppHeader>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-6 flex items-center justify-between">
        <p class="text-slate-600">
          共浏览 <span class="font-semibold text-brand-600">{{ store.history.length }}</span> 个站牌
        </p>
      </div>

      <div v-if="store.historyLoading" class="flex justify-center py-20">
        <ProgressSpinner />
      </div>

      <div
        v-else-if="store.history.length === 0"
        class="rounded-xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-400"
      >
        <i class="pi pi-history mb-3 text-4xl" />
        <p class="mb-4">还没有浏览历史</p>
        <Button label="去图鉴逛逛" icon="pi pi-arrow-right" @click="router.push('/')" />
      </div>

      <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="item in store.history"
          :key="item.id"
          class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
        >
          <div
            class="relative block aspect-[3/2] overflow-hidden bg-slate-100 cursor-pointer"
            @click="goDetail(item.sign.id)"
          >
            <img
              :src="item.sign.imageUrl"
              :alt="`${item.sign.city}站牌`"
              class="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
            />
            <Tag
              :value="item.sign.inUse ? '使用中' : '已停用'"
              :severity="item.sign.inUse ? 'success' : 'secondary'"
              class="absolute right-2 top-2 z-10"
            />
          </div>
          <div class="p-4">
            <div class="mb-1 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-slate-800 cursor-pointer hover:text-brand-600" @click="goDetail(item.sign.id)">{{ item.sign.city }}</h3>
              <span class="text-sm text-slate-400">{{ item.sign.era }}</span>
            </div>
            <p class="mb-1 text-xs text-slate-400">
              浏览于 {{ formatDate(item.viewedAt) }}
            </p>
            <p class="mb-4 line-clamp-2 text-sm text-slate-500">{{ item.sign.styleDescription }}</p>
            <div class="flex gap-2">
              <Button label="预览" icon="pi pi-eye" size="small" outlined @click="openPreview(item.sign)" />
              <Button label="详情" icon="pi pi-arrow-right" size="small" @click="goDetail(item.sign.id)" />
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="previewVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ previewSign ? `${previewSign.city} · 站牌预览` : '站牌预览' }}
          </h3>
          <Button icon="pi pi-times" text rounded @click="previewVisible = false" />
        </div>
        <template v-if="previewSign">
          <img
            :src="previewSign.imageUrl"
            :alt="`${previewSign.city}站牌`"
            class="mb-4 w-full rounded-lg object-cover"
          />
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-slate-400">城市</dt>
              <dd class="font-medium">{{ previewSign.city }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-400">年代</dt>
              <dd>{{ previewSign.era }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-400">状态</dt>
              <dd>
                <Tag
                  :value="previewSign.inUse ? '使用中' : '已停用'"
                  :severity="previewSign.inUse ? 'success' : 'secondary'"
                />
              </dd>
            </div>
            <div>
              <dt class="mb-1 text-slate-400">样式描述</dt>
              <dd class="text-slate-600">{{ previewSign.styleDescription }}</dd>
            </div>
          </dl>
          <div class="mt-4 flex justify-end gap-2">
            <Button
              label="查看详情"
              icon="pi pi-external-link"
              @click="goDetail(previewSign.id); previewVisible = false"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
