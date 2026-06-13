<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ProgressBar from 'primevue/progressbar';
import { fetchStats } from '@/api/signs';
import { useSignsStore } from '@/stores/signs';
import type { CityStats, EraStats } from '@/types/sign';

const router = useRouter();
const toast = useToast();
const store = useSignsStore();

const cityStats = ref<CityStats[]>([]);
const eraStats = ref<EraStats[]>([]);
const loading = ref(true);

const totalSigns = computed(() => cityStats.value.reduce((sum, s) => sum + s.total, 0));
const totalInUse = computed(() => cityStats.value.reduce((sum, s) => sum + s.inUse, 0));
const totalCities = computed(() => cityStats.value.length);
const totalEras = computed(() => eraStats.value.length);
const inUseRatio = computed(() => {
  if (totalSigns.value === 0) return 0;
  return Math.round((totalInUse.value / totalSigns.value) * 100);
});

function getPercentage(total: number, part: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function getCityPercentage(total: number): number {
  if (totalSigns.value === 0) return 0;
  return Math.round((total / totalSigns.value) * 100);
}

function getEraPercentage(total: number): number {
  if (totalSigns.value === 0) return 0;
  return Math.round((total / totalSigns.value) * 100);
}

const maxEraTotal = computed(() => {
  if (eraStats.value.length === 0) return 0;
  return Math.max(...eraStats.value.map((e) => e.total));
});

onMounted(async () => {
  try {
    const data = await fetchStats();
    cityStats.value = data.cities;
    eraStats.value = data.eras;
  } catch {
    toast.add({ severity: 'error', summary: '错误', detail: '加载统计数据失败', life: 3000 });
  } finally {
    loading.value = false;
  }
});

function goBack() {
  router.push('/');
}

function goToCity(city: string) {
  store.filters.city = city;
  store.filters.era = undefined;
  store.filters.inUse = false;
  store.filters.tagId = undefined;
  store.filters.keyword = undefined;
  router.push({ name: 'home', query: { city } });
}

function goToEra(era: string) {
  store.filters.city = undefined;
  store.filters.era = era;
  store.filters.inUse = false;
  store.filters.tagId = undefined;
  store.filters.keyword = undefined;
  router.push({ name: 'home', query: { era } });
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
        <h1 class="text-xl font-bold">数据统计</h1>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div v-if="loading" class="flex justify-center py-20">
        <ProgressSpinner />
      </div>

      <template v-else>
        <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <Card class="text-center">
            <template #content>
              <p class="text-sm text-slate-500">收录城市</p>
              <p class="mt-2 text-3xl font-bold text-brand-600">{{ totalCities }}</p>
            </template>
          </Card>
          <Card class="text-center">
            <template #content>
              <p class="text-sm text-slate-500">年代跨度</p>
              <p class="mt-2 text-3xl font-bold text-purple-600">{{ totalEras }}</p>
            </template>
          </Card>
          <Card class="text-center">
            <template #content>
              <p class="text-sm text-slate-500">站牌总数</p>
              <p class="mt-2 text-3xl font-bold text-slate-800">{{ totalSigns }}</p>
            </template>
          </Card>
          <Card class="text-center">
            <template #content>
              <p class="text-sm text-slate-500">使用中</p>
              <p class="mt-2 text-3xl font-bold text-green-600">{{ totalInUse }}</p>
            </template>
          </Card>
          <Card class="text-center">
            <template #content>
              <p class="text-sm text-slate-500">使用率</p>
              <p class="mt-2 text-3xl font-bold text-blue-600">{{ inUseRatio }}%</p>
            </template>
          </Card>
        </section>

        <section class="mb-8">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">各城市站牌分布</h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              v-for="item in cityStats"
              :key="item.city"
              class="cursor-pointer transition hover:shadow-md"
              @click="goToCity(item.city)"
            >
              <template #title>
                <div class="flex items-center justify-between">
                  <span class="text-lg font-semibold text-slate-800">{{ item.city }}</span>
                  <Tag :value="`${getCityPercentage(item.total)}%`" severity="info" />
                </div>
              </template>
              <template #content>
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">站牌总数</span>
                    <span class="font-medium text-slate-800">{{ item.total }} 个</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-slate-500">使用中</span>
                    <span class="font-medium text-green-600">{{ item.inUse }} 个</span>
                  </div>
                  <div>
                    <div class="mb-1 flex justify-between text-xs text-slate-500">
                      <span>使用率</span>
                      <span>{{ getPercentage(item.total, item.inUse) }}%</span>
                    </div>
                    <ProgressBar :value="getPercentage(item.total, item.inUse)" :showValue="false" />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </section>

        <section class="mb-8">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">各年代站牌分布</h2>
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="space-y-4">
              <div
                v-for="item in eraStats"
                :key="item.era"
                class="group cursor-pointer rounded-lg p-3 transition hover:bg-slate-50"
                @click="goToEra(item.era)"
              >
                <div class="mb-2 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-base font-semibold text-slate-800">{{ item.era }}</span>
                    <Tag :value="`${item.total} 个`" severity="info" />
                    <Tag
                      v-if="item.inUse > 0"
                      :value="`使用中 ${item.inUse} 个`"
                      severity="success"
                    />
                    <Tag
                      v-if="item.total - item.inUse > 0"
                      :value="`已停用 ${item.total - item.inUse} 个`"
                      severity="secondary"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-slate-500">{{ getEraPercentage(item.total) }}%</span>
                    <i class="pi pi-external-link text-slate-400 transition group-hover:text-brand-600" />
                  </div>
                </div>
                <div class="flex h-6 overflow-hidden rounded-md bg-slate-100">
                  <div
                    class="flex items-center justify-end bg-green-500 transition-all"
                    :style="{ width: maxEraTotal > 0 ? `${(item.inUse / maxEraTotal) * 100}%` : '0%' }"
                  >
                    <span
                      v-if="item.inUse > 0"
                      class="px-2 text-xs font-medium text-white"
                    >
                      {{ item.inUse }}
                    </span>
                  </div>
                  <div
                    class="flex items-center justify-end bg-slate-400 transition-all"
                    :style="{ width: maxEraTotal > 0 ? `${((item.total - item.inUse) / maxEraTotal) * 100}%` : '0%' }"
                  >
                    <span
                      v-if="item.total - item.inUse > 0"
                      class="px-2 text-xs font-medium text-white"
                    >
                      {{ item.total - item.inUse }}
                    </span>
                  </div>
                </div>
                <div class="mt-2 flex justify-between text-xs text-slate-500">
                  <span class="flex items-center gap-1">
                    <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                    使用中
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="inline-block h-2 w-2 rounded-full bg-slate-400"></span>
                    已停用
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mb-8">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">城市统计详情</h2>
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <DataTable :value="cityStats" stripedRows>
              <Column field="city" header="城市" style="width: 25%">
                <template #body="slotProps">
                  <span class="font-medium text-slate-800">{{ slotProps.data.city }}</span>
                </template>
              </Column>
              <Column field="total" header="站牌总数" style="width: 20%">
                <template #body="slotProps">
                  <span class="font-semibold">{{ slotProps.data.total }}</span>
                </template>
              </Column>
              <Column field="inUse" header="使用中" style="width: 20%">
                <template #body="slotProps">
                  <span class="text-green-600 font-medium">{{ slotProps.data.inUse }}</span>
                </template>
              </Column>
              <Column header="占总数比例" style="width: 20%">
                <template #body="slotProps">
                  <div class="flex items-center gap-2">
                    <ProgressBar
                      :value="getCityPercentage(slotProps.data.total)"
                      :showValue="false"
                      class="flex-1"
                    />
                    <span class="text-sm text-slate-600 w-12 text-right">
                      {{ getCityPercentage(slotProps.data.total) }}%
                    </span>
                  </div>
                </template>
              </Column>
              <Column header="使用率" style="width: 15%">
                <template #body="slotProps">
                  <Tag
                    :value="`${getPercentage(slotProps.data.total, slotProps.data.inUse)}%`"
                    :severity="getPercentage(slotProps.data.total, slotProps.data.inUse) > 50 ? 'success' : 'warning'"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </section>

        <section>
          <h2 class="mb-4 text-lg font-semibold text-slate-800">年代统计详情</h2>
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <DataTable :value="eraStats" stripedRows>
              <Column field="era" header="年代" style="width: 20%">
                <template #body="slotProps">
                  <span
                    class="cursor-pointer font-medium text-brand-600 hover:text-brand-800 hover:underline"
                    @click="goToEra(slotProps.data.era)"
                  >
                    {{ slotProps.data.era }}
                  </span>
                </template>
              </Column>
              <Column field="total" header="总数" style="width: 20%">
                <template #body="slotProps">
                  <span class="font-semibold">{{ slotProps.data.total }}</span>
                </template>
              </Column>
              <Column header="使用中" style="width: 20%">
                <template #body="slotProps">
                  <span class="text-green-600 font-medium">{{ slotProps.data.inUse }}</span>
                </template>
              </Column>
              <Column header="已停用" style="width: 20%">
                <template #body="slotProps">
                  <span class="text-slate-500 font-medium">{{ slotProps.data.total - slotProps.data.inUse }}</span>
                </template>
              </Column>
              <Column header="占比" style="width: 20%">
                <template #body="slotProps">
                  <div class="flex items-center gap-2">
                    <ProgressBar
                      :value="getEraPercentage(slotProps.data.total)"
                      :showValue="false"
                      class="flex-1"
                    />
                    <span class="text-sm text-slate-600 w-12 text-right">
                      {{ getEraPercentage(slotProps.data.total) }}%
                    </span>
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
