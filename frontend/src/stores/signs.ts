import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import type { BusSign, BusSignInput, SignFilters, FavoriteWithSign, Tag } from '@/types/sign';
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
    tagId: undefined,
  });

  const tags = ref<Tag[]>([]);
  const tagsLoading = ref(false);

  const favorites = ref<FavoriteWithSign[]>([]);
  const favoritesLoading = ref(false);
  const favoriteSignIds = computed(() => new Set(favorites.value.map((f) => f.signId)));

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

  async function loadSigns() {
    loading.value = true;
    error.value = null;
    try {
      const apiFilters: SignFilters = {};
      if (filters.city) apiFilters.city = filters.city;
      if (filters.era) apiFilters.era = filters.era;
      if (filters.inUse) apiFilters.inUse = true;
      if (filters.tagId !== undefined && filters.tagId !== null) {
        apiFilters.tagId = filters.tagId;
      }
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

  async function setFilter<K extends keyof SignFilters>(key: K, value: SignFilters[K]) {
    filters[key] = value;
    await loadSigns();
  }

  async function resetFilters() {
    filters.city = undefined;
    filters.era = undefined;
    filters.inUse = false;
    filters.tagId = undefined;
    await loadSigns();
  }

  function getById(id: number): BusSign | undefined {
    return signs.value.find((s) => s.id === id);
  }

  async function addSign(input: BusSignInput) {
    const created = await signsApi.createSign(input);
    signs.value.push(created);
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
    signs.value = signs.value.filter((s) => s.id !== id);
    favorites.value = favorites.value.filter((f) => f.signId !== id);
  }

  return {
    signs,
    allSigns,
    loading,
    error,
    filters,
    tags,
    tagsLoading,
    tagOptions,
    cityOptions,
    eraOptions,
    favorites,
    favoritesLoading,
    favoriteSignIds,
    loadSigns,
    loadTags,
    loadFavorites,
    toggleFavorite,
    isFavorited,
    setFilter,
    resetFilters,
    getById,
    addSign,
    editSign,
    removeSign,
  };
});
