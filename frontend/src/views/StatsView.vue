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
import { fetchCityStats } from '@/api/signs';
import type { CityStats } from '@/types/sign';

const router = useRouter();
const toast = useToast();

const stats = ref<CityStats[]>([]);
const loading = ref(true);

const totalSigns = computed(() => stats.value.reduce((sum, s) => sum + s.total, 0));
const totalInUse = computed(() => stats.value.reduce((sum, s) => sum + s.inUse, 0));
const totalCities = computed(() => stats.value.length);
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

onMounted(async () => {
  try {
    stats.value = await fetchCityStats();
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
  router.push({ name: 'home', query: { city } });
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
        <section class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card class="text-center">
            <template #content>
              <p class="text-sm text-slate-500">收录城市</p>
              <p class="mt-2 text-3xl font-bold text-brand-600">{{ totalCities }}</p>
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
              v-for="item in stats"
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

        <section>
          <h2 class="mb-4 text-lg font-semibold text-slate-800">详细统计表</h2>
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <DataTable :value="stats" stripedRows>
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
      </template>
    </main>
  </div>
</template>
