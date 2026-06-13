import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import type { BusSign, BusSignInput, SignFilters } from '@/types/sign';
import * as signsApi from '@/api/signs';

export const useSignsStore = defineStore('signs', () => {
  const signs = ref<BusSign[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = reactive<SignFilters>({
    city: undefined,
    era: undefined,
    inUse: null,
  });

  /** 加载站牌列表（应用当前筛选条件） */
  async function loadSigns() {
    loading.value = true;
    error.value = null;
    try {
      signs.value = await signsApi.fetchSigns(filters);
    } catch (e) {
      error.value = '加载站牌列表失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /** 设置单个筛选条件并重新加载 */
  async function setFilter<K extends keyof SignFilters>(key: K, value: SignFilters[K]) {
    filters[key] = value;
    await loadSigns();
  }

  /** 重置所有筛选条件并重新加载 */
  async function resetFilters() {
    filters.city = undefined;
    filters.era = undefined;
    filters.inUse = null;
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

  return { signs, loading, error, filters, loadSigns, setFilter, resetFilters, getById, addSign, editSign, removeSign };
});
