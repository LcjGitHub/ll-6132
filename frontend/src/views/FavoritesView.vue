<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
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
    await store.loadFavorites();
  } catch {
    toast.add({ severity: 'error', summary: '错误', detail: '加载收藏列表失败', life: 4000 });
  }
});

function openPreview(sign: BusSign) {
  previewSign.value = sign;
  previewVisible.value = true;
}

function goDetail(id: number) {
  router.push({ name: 'sign-detail', params: { id } });
}

function goBack() {
  router.push('/');
}

function confirmRemoveFavorite(sign: BusSign) {
  confirm.require({
    message: `确定取消收藏「${sign.city}」站牌吗？`,
    header: '确认取消收藏',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '取消收藏',
    rejectLabel: '保留',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.toggleFavorite(sign.id);
        toast.add({ severity: 'success', summary: '已取消收藏', life: 2000 });
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
    <header class="bg-brand-600 text-white shadow-md">
      <div class="mx-auto max-w-6xl px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i class="pi pi-heart-fill text-3xl" />
            <div>
              <h1 class="text-2xl font-bold tracking-tight">我的收藏</h1>
              <p class="mt-1 text-sm text-blue-100">记录你喜欢的公交站牌设计</p>
            </div>
          </div>
          <Button
            icon="pi pi-arrow-left"
            label="返回图鉴"
            outlined
            class="!border-white/30 !text-white hover:!bg-white/10"
            @click="goBack"
          />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-6">
        <p class="text-slate-600">
          共收藏 <span class="font-semibold text-brand-600">{{ store.favorites.length }}</span> 个站牌
        </p>
      </div>

      <div v-if="store.favoritesLoading" class="flex justify-center py-20">
        <ProgressSpinner />
      </div>

      <div
        v-else-if="store.favorites.length === 0"
        class="rounded-xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-400"
      >
        <i class="pi pi-heart-o mb-3 text-4xl" />
        <p class="mb-4">还没有收藏任何站牌</p>
        <Button label="去图鉴逛逛" icon="pi pi-arrow-right" @click="goBack" />
      </div>

      <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="fav in store.favorites"
          :key="fav.id"
          class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
        >
          <div class="relative block aspect-[3/2] overflow-hidden bg-slate-100">
            <img
              :src="fav.sign.imageUrl"
              :alt="`${fav.sign.city}站牌`"
              class="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
            />
            <Tag
              :value="fav.sign.inUse ? '使用中' : '已停用'"
              :severity="fav.sign.inUse ? 'success' : 'secondary'"
              class="absolute right-2 top-2 z-10"
            />
            <Button
              :icon="store.isFavorited(fav.sign.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
              :severity="store.isFavorited(fav.sign.id) ? 'danger' : 'secondary'"
              rounded
              text
              class="absolute left-2 top-2 z-10 !bg-white/90 hover:!bg-white"
              @click.stop="confirmRemoveFavorite(fav.sign)"
            />
          </div>
          <div class="p-4">
            <div class="mb-1 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-slate-800">{{ fav.sign.city }}</h3>
              <span class="text-sm text-slate-400">{{ fav.sign.era }}</span>
            </div>
            <p class="mb-1 text-xs text-slate-400">
              收藏于 {{ formatDate(fav.createdAt) }}
            </p>
            <p class="mb-4 line-clamp-2 text-sm text-slate-500">{{ fav.sign.styleDescription }}</p>
            <div class="flex gap-2">
              <Button label="预览" icon="pi pi-eye" size="small" outlined @click="openPreview(fav.sign)" />
              <Button label="详情" icon="pi pi-arrow-right" size="small" @click="goDetail(fav.sign.id)" />
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
