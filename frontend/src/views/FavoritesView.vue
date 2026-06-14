<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import AppHeader from '@/components/AppHeader.vue';
import { useSignsStore } from '@/stores/signs';
import type { BusSign, FavoriteWithSign } from '@/types/sign';

const store = useSignsStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const previewSign = ref<BusSign | null>(null);
const previewVisible = ref(false);

const sortOrder = ref<'asc' | 'desc'>('desc');
const groupByCity = ref(false);
const expandedCities = ref<Set<string>>(new Set());

onMounted(async () => {
  try {
    await store.loadFavorites(sortOrder.value);
  } catch {
    toast.add({ severity: 'error', summary: '错误', detail: '加载收藏列表失败', life: 4000 });
  }
});

async function handleSortChange(order: 'asc' | 'desc') {
  sortOrder.value = order;
  try {
    await store.loadFavorites(order);
  } catch {
    toast.add({ severity: 'error', summary: '错误', detail: '排序失败', life: 3000 });
  }
}

function toggleGroupMode() {
  groupByCity.value = !groupByCity.value;
  if (groupByCity.value) {
    const cities = new Set(store.favorites.map((f) => f.sign.city));
    expandedCities.value = new Set(cities);
  }
}

function toggleCity(city: string) {
  const newSet = new Set(expandedCities.value);
  if (newSet.has(city)) {
    newSet.delete(city);
  } else {
    newSet.add(city);
  }
  expandedCities.value = newSet;
}

function expandAll() {
  const cities = new Set(store.favorites.map((f) => f.sign.city));
  expandedCities.value = new Set(cities);
}

function collapseAll() {
  expandedCities.value = new Set();
}

interface CityGroup {
  city: string;
  province: string;
  count: number;
  items: FavoriteWithSign[];
}

const groupedByCity = computed<CityGroup[]>(() => {
  const map = new Map<string, CityGroup>();
  store.favorites.forEach((fav) => {
    const city = fav.sign.city;
    if (!map.has(city)) {
      map.set(city, {
        city,
        province: fav.sign.province,
        count: 0,
        items: [],
      });
    }
    const group = map.get(city)!;
    group.count++;
    group.items.push(fav);
  });
  return Array.from(map.values()).sort((a, b) => a.city.localeCompare(b.city, 'zh-CN'));
});

function openPreview(sign: BusSign) {
  previewSign.value = sign;
  previewVisible.value = true;
}

function goDetail(id: number) {
  router.push({ name: 'sign-detail', params: { id } });
}

function confirmRemoveFavorite(sign: BusSign) {
  confirm.require({
    message: `确定取消收藏「${sign.province} ${sign.city}」站牌吗？`,
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
    <AppHeader
      title="我的收藏"
      subtitle="记录你喜欢的公交站牌设计"
      icon="pi pi-heart-fill"
    />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-slate-600">
          共收藏 <span class="font-semibold text-brand-600">{{ store.favorites.length }}</span> 个站牌
        </p>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <Button
              label="最新优先"
              size="small"
              :severity="sortOrder === 'desc' ? 'primary' : 'secondary'"
              :outlined="sortOrder !== 'desc'"
              @click="handleSortChange('desc')"
            />
            <Button
              label="最早优先"
              size="small"
              :severity="sortOrder === 'asc' ? 'primary' : 'secondary'"
              :outlined="sortOrder !== 'asc'"
              @click="handleSortChange('asc')"
            />
          </div>

          <Button
            :label="groupByCity ? '取消分组' : '按城市分组'"
            :icon="groupByCity ? 'pi pi-list' : 'pi pi-map-marker'"
            size="small"
            :severity="groupByCity ? 'primary' : 'secondary'"
            :outlined="!groupByCity"
            @click="toggleGroupMode"
          />
        </div>
      </div>

      <div v-if="groupByCity && store.favorites.length > 0" class="mb-4 flex items-center gap-2">
        <Button label="全部展开" size="small" text @click="expandAll" />
        <span class="text-slate-300">|</span>
        <Button label="全部折叠" size="small" text @click="collapseAll" />
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
        <Button label="去图鉴逛逛" icon="pi pi-arrow-right" @click="router.push('/')" />
      </div>

      <template v-else>
        <template v-if="!groupByCity">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div>
                    <h3 class="text-lg font-semibold text-slate-800">{{ fav.sign.city }}</h3>
                    <p class="text-xs text-slate-400">{{ fav.sign.province }}</p>
                  </div>
                  <span class="text-sm text-slate-400">{{ fav.sign.era }}</span>
                </div>
                <div v-if="fav.sign.tags && fav.sign.tags.length > 0" class="mb-2 flex flex-wrap gap-1">
                  <Tag
                    v-for="tag in fav.sign.tags"
                    :key="tag.id"
                    :value="tag.name"
                    :severity="tag.color as any"
                    size="small"
                  />
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
        </template>

        <template v-else>
          <div class="space-y-4">
            <div
              v-for="group in groupedByCity"
              :key="group.city"
              class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                class="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                @click="toggleCity(group.city)"
              >
                <div class="flex items-center gap-3">
                  <i
                    :class="[
                      'pi text-xl text-slate-400 transition-transform',
                      expandedCities.has(group.city) ? 'pi-chevron-down' : 'pi-chevron-right',
                    ]"
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <i class="pi pi-map-marker text-brand-500" />
                      <h3 class="text-lg font-semibold text-slate-800">{{ group.city }}</h3>
                      <Tag :value="`${group.count} 个`" severity="info" size="small" />
                    </div>
                    <p class="text-xs text-slate-400">{{ group.province }}</p>
                  </div>
                </div>
                <i class="pi pi-sort-alt text-slate-300" />
              </button>

              <div
                v-show="expandedCities.has(group.city)"
                class="border-t border-slate-100 bg-slate-50 px-5 py-4"
              >
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div
                    v-for="fav in group.items"
                    :key="fav.id"
                    class="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
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
                    <div class="p-3">
                      <div class="mb-1 flex items-center justify-between">
                        <span class="text-sm font-medium text-slate-800">{{ group.city }}</span>
                        <span class="text-xs text-slate-400">{{ fav.sign.era }}</span>
                      </div>
                      <div v-if="fav.sign.tags && fav.sign.tags.length > 0" class="mb-2 flex flex-wrap gap-1">
                        <Tag
                          v-for="tag in fav.sign.tags"
                          :key="tag.id"
                          :value="tag.name"
                          :severity="tag.color as any"
                          size="small"
                        />
                      </div>
                      <p class="mb-1 text-xs text-slate-400">
                        {{ formatDate(fav.createdAt) }}
                      </p>
                      <p class="mb-3 line-clamp-2 text-xs text-slate-500">{{ fav.sign.styleDescription }}</p>
                      <div class="flex gap-2">
                        <Button label="预览" icon="pi pi-eye" size="small" outlined @click="openPreview(fav.sign)" />
                        <Button label="详情" icon="pi pi-arrow-right" size="small" @click="goDetail(fav.sign.id)" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </main>

    <div v-if="previewVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ previewSign ? `${previewSign.province} ${previewSign.city} · 站牌预览` : '站牌预览' }}
          </h3>
          <Button icon="pi pi-times" text rounded @click="previewVisible = false" />
        </div>
        <template v-if="previewSign">
          <img
            :src="previewSign.imageUrl"
            :alt="`${previewSign.province} ${previewSign.city}站牌`"
            class="mb-4 w-full rounded-lg object-cover"
          />
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-slate-400">省份</dt>
              <dd class="font-medium">{{ previewSign.province }}</dd>
            </div>
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
