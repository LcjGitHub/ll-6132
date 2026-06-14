import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import type { BusSign, BusSignInput, SignFilters, FavoriteWithSign, HistoryWithSign, Tag, SortField, SortOrder } from '@/types/sign';
import * as signsApi from '@/api/signs';

export const useSignsStore = defineStore('signs', () => {
  const signs = ref<BusSign[]>([]);
  const allSigns = ref<BusSign[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(6);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const sortBy = ref<SortField>('id');
  const sortOrder = ref<SortOrder>('asc');
  const filters = reactive<SignFilters>({
    city: undefined,
    era: undefined,
    inUse: false,
    tagId: undefined,
    keyword: undefined,
  });

  const tags = ref<Tag[]>([]);
  const tagsLoading = ref(false);

  const favorites = ref<FavoriteWithSign[]>([]);
  const favoritesLoading = ref(false);
  const favoriteSignIds = computed(() => new Set(favorites.value.map((f) => f.signId)));

  const history = ref<HistoryWithSign[]>([]);
  const historyLoading = ref(false);

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

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

  const tagOptions = computed(() => {
    return tags.value.map((t) => ({
      label: t.name,
      value: t.id,
    }));
  });

  async function loadTags() {
    tagsLoading.value = true;
    try {
      tags.value = await signsApi.fetchTags();
    } finally {
      tagsLoading.value = false;
    }
  }

  function buildApiFilters(): SignFilters {
    const apiFilters: SignFilters = {};
    if (filters.city) apiFilters.city = filters.city;
    if (filters.era) apiFilters.era = filters.era;
    if (filters.inUse) apiFilters.inUse = true;
    if (filters.tagId !== undefined && filters.tagId !== null) {
      apiFilters.tagId = filters.tagId;
    }
    if (filters.keyword) apiFilters.keyword = filters.keyword;
    if (sortBy.value) apiFilters.sortBy = sortBy.value;
    if (sortOrder.value) apiFilters.sortOrder = sortOrder.value;
    return apiFilters;
  }

  async function loadSigns() {
    loading.value = true;
    error.value = null;
    try {
      const apiFilters = buildApiFilters();
      const result = await signsApi.fetchSignsPaginated(page.value, pageSize.value, apiFilters);
      signs.value = result.items;
      total.value = result.total;
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

  async function loadFavorites() {
    favoritesLoading.value = true;
    try {
      favorites.value = await signsApi.fetchFavorites();
    } finally {
      favoritesLoading.value = false;
    }
  }

  async function toggleFavorite(signId: number): Promise<boolean> {
    const isFav = favoriteSignIds.value.has(signId);
    if (isFav) {
      await signsApi.removeFavorite(signId);
      favorites.value = favorites.value.filter((f) => f.signId !== signId);
      return false;
    } else {
      const created = await signsApi.addFavorite(signId);
      favorites.value.unshift(created);
      return true;
    }
  }

  function isFavorited(signId: number): boolean {
    return favoriteSignIds.value.has(signId);
  }

  async function loadHistory() {
    historyLoading.value = true;
    try {
      history.value = await signsApi.fetchHistory();
    } finally {
      historyLoading.value = false;
    }
  }

  async function addToHistory(signId: number) {
    try {
      const created = await signsApi.addHistory(signId);
      const existingIndex = history.value.findIndex((h) => h.signId === signId);
      if (existingIndex !== -1) {
        history.value.splice(existingIndex, 1);
      }
      history.value.unshift(created);
    } catch {
    }
  }

  async function clearAllHistory() {
    await signsApi.clearHistory();
    history.value = [];
  }

  async function setFilter<K extends keyof SignFilters>(key: K, value: SignFilters[K]) {
    filters[key] = value;
    page.value = 1;
    await loadSigns();
  }

  async function setSort(field: SortField, order: SortOrder) {
    sortBy.value = field;
    sortOrder.value = order;
    page.value = 1;
    await loadSigns();
  }

  async function resetFilters() {
    filters.city = undefined;
    filters.era = undefined;
    filters.inUse = false;
    filters.tagId = undefined;
    filters.keyword = undefined;
    page.value = 1;
    await loadSigns();
  }

  async function setPage(newPage: number) {
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages.value) newPage = totalPages.value;
    page.value = newPage;
    await loadSigns();
  }

  async function setPageSize(newSize: number) {
    pageSize.value = Math.max(1, newSize);
    page.value = 1;
    await loadSigns();
  }

  function getById(id: number): BusSign | undefined {
    return signs.value.find((s) => s.id === id);
  }

  async function addSign(input: BusSignInput) {
    const created = await signsApi.createSign(input);
    await loadSigns();
    return created;
  }

  async function editSign(id: number, input: BusSignInput) {
    const updated = await signsApi.updateSign(id, input);
    const idx = signs.value.findIndex((s) => s.id === id);
    if (idx !== -1) signs.value[idx] = updated;
    return updated;
  }

  async function removeSign(id: number) {
    await signsApi.deleteSign(id);
    favorites.value = favorites.value.filter((f) => f.signId !== id);
    if (signs.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }
    await loadSigns();
  }

  return {
    signs,
    allSigns,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    sortBy,
    sortOrder,
    filters,
    tags,
    tagsLoading,
    tagOptions,
    cityOptions,
    eraOptions,
    favorites,
    favoritesLoading,
    favoriteSignIds,
    history,
    historyLoading,
    loadSigns,
    loadTags,
    loadFavorites,
    toggleFavorite,
    isFavorited,
    loadHistory,
    addToHistory,
    clearAllHistory,
    setFilter,
    setSort,
    resetFilters,
    setPage,
    setPageSize,
    getById,
    addSign,
    editSign,
    removeSign,
  };
});
