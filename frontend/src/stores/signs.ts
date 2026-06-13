import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import type { BusSign, BusSignInput, SignFilters } from '@/types/sign';
import * as signsApi from '@/api/signs';

export const useSignsStore = defineStore('signs', () => {
  const signs = ref<BusSign[]>([]);
  const allSigns = ref<BusSign[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = reactive<SignFilters>({
    city: undefined,
    era: undefined,
    inUse: false,
  });

  const cityOptions = computed(() => {
    const set = new Set<string>();
    allSigns.value.forEach((s) => set.add(s.city));
    return Array.from(set).sort();
  });

  const eraOptions = computed(() => {
    const set = new Set<string>();
    allSigns.value.forEach((s) => set.add(s.era));
    return Array.from(set).sort();
  });

  async function loadSigns() {
    loading.value = true;
    error.value = null;
    try {
      const apiFilters: SignFilters = {};
      if (filters.city) apiFilters.city = filters.city;
      if (filters.era) apiFilters.era = filters.era;
      if (filters.inUse) apiFilters.inUse = true;
      signs.value = await signsApi.fetchSigns(apiFilters);
      if (allSigns.value.length === 0) {
        allSigns.value = await signsApi.fetchSigns();
      }
    } catch (e) {
      error.value = '加载站牌列表失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function setFilter<K extends keyof SignFilters>(key: K, value: SignFilters[K]) {
    filters[key] = value;
    await loadSigns();
  }

  async function resetFilters() {
    filters.city = undefined;
    filters.era = undefined;
    filters.inUse = false;
    await loadSigns();
  }

  /** 根据 ID 获取站牌（优先从缓存读取） */
  function getById(id: number): BusSign | undefined {
    return signs.value.find((s) => s.id === id);
  }

  /** 新建站牌 */
  async function addSign(input: BusSignInput) {
    const created = await signsApi.createSign(input);
    signs.value.push(created);
    return created;
  }

  /** 更新站牌 */
  async function editSign(id: number, input: BusSignInput) {
    const updated = await signsApi.updateSign(id, input);
    const idx = signs.value.findIndex((s) => s.id === id);
    if (idx !== -1) signs.value[idx] = updated;
    return updated;
  }

  /** 删除站牌 */
  async function removeSign(id: number) {
    await signsApi.deleteSign(id);
    signs.value = signs.value.filter((s) => s.id !== id);
  }

  return { signs, allSigns, loading, error, filters, cityOptions, eraOptions, loadSigns, setFilter, resetFilters, getById, addSign, editSign, removeSign };
});
