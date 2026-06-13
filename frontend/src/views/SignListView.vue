<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import DataView from 'primevue/dataview';
import SelectButton from 'primevue/selectbutton';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';
import Paginator from 'primevue/paginator';
import SignFormDialog from '@/components/SignFormDialog.vue';
import { useSignsStore } from '@/stores/signs';
import type { BusSign, SortField, SortOrder } from '@/types/sign';

interface SortOption {
  label: string;
  value: string;
  sortBy: SortField;
  sortOrder: SortOrder;
}

const store = useSignsStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

const layout = ref<'grid' | 'list'>('grid');
const layoutOptions = [
  { label: '网格', value: 'grid', icon: 'pi pi-th-large' },
  { label: '列表', value: 'list', icon: 'pi pi-list' },
];

const keywordInput = ref('');
const keywordClearPending = ref(false);

watch(keywordInput, (newVal, oldVal) => {
  if (oldVal && oldVal.trim() !== '' && newVal.trim() === '' && !keywordClearPending.value) {
    handleKeywordClear();
  }
});

onMounted(async () => {
  try {
    const cityQuery = route.query.city;
    if (typeof cityQuery === 'string' && cityQuery.trim() !== '') {
      store.filters.city = cityQuery;
    }
    const eraQuery = route.query.era;
    if (typeof eraQuery === 'string' && eraQuery.trim() !== '') {
      store.filters.era = eraQuery;
    }
    keywordInput.value = store.filters.keyword || '';
    await Promise.all([store.loadSigns(), store.loadFavorites(), store.loadTags()]);
  } catch {
    toast.add({ severity: 'error', summary: '错误', detail: '无法连接后端服务', life: 4000 });
  }
});

const sortOptions: SortOption[] = [
  { label: '按编号升序', value: 'id-asc', sortBy: 'id', sortOrder: 'asc' },
  { label: '按编号降序', value: 'id-desc', sortBy: 'id', sortOrder: 'desc' },
  { label: '按城市名称升序', value: 'city-asc', sortBy: 'city', sortOrder: 'asc' },
  { label: '按城市名称降序', value: 'city-desc', sortBy: 'city', sortOrder: 'desc' },
  { label: '按年代升序', value: 'era-asc', sortBy: 'era', sortOrder: 'asc' },
  { label: '按年代降序', value: 'era-desc', sortBy: 'era', sortOrder: 'desc' },
];

const currentSortValue = computed({
  get: () => `${store.sortBy}-${store.sortOrder}`,
  set: async (val: string) => {
    const option = sortOptions.find((o) => o.value === val);
    if (option) {
      await store.setSort(option.sortBy, option.sortOrder);
    }
  },
});

const previewSign = ref<BusSign | null>(null);
const previewVisible = ref(false);
const formVisible = ref(false);
const editingSign = ref<BusSign | null>(null);

const selectedIds = ref<number[]>([]);
const selectedCount = computed(() => selectedIds.value.length);
const compareDisabled = computed(() => selectedCount.value !== 2);

function isSelected(id: number): boolean {
  return selectedIds.value.includes(id);
}

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id);
  if (idx !== -1) {
    selectedIds.value.splice(idx, 1);
  } else {
    if (selectedIds.value.length >= 2) {
      toast.add({ severity: 'warn', summary: '最多只能对比两条站牌', life: 2500 });
      return;
    }
    selectedIds.value.push(id);
  }
}

function clearSelection() {
  selectedIds.value = [];
}

function goCompare() {
  router.push({ name: 'sign-compare', query: { ids: selectedIds.value.join(',') } });
}

async function handleKeywordSearch() {
  const trimmed = keywordInput.value.trim();
  await store.setFilter('keyword', trimmed || undefined);
}

async function handleKeywordClear() {
  keywordClearPending.value = true;
  keywordInput.value = '';
  try {
    await store.setFilter('keyword', undefined);
  } finally {
    keywordClearPending.value = false;
  }
}

async function handleResetFilters() {
  keywordClearPending.value = true;
  keywordInput.value = '';
  try {
    await store.resetFilters();
  } finally {
    keywordClearPending.value = false;
  }
}

/** 打开快速预览 Dialog */
function openPreview(sign: BusSign) {
  previewSign.value = sign;
  previewVisible.value = true;
}

/** 跳转详情页 */
function goDetail(id: number) {
  router.push({ name: 'sign-detail', params: { id } });
}

/** 打开新建表单 */
function openCreate() {
  editingSign.value = null;
  formVisible.value = true;
}

/** 打开编辑表单 */
function openEdit(sign: BusSign) {
  editingSign.value = sign;
  formVisible.value = true;
}

/** 删除站牌 */
function confirmDelete(sign: BusSign) {
  confirm.require({
    message: `确定删除「${sign.city}」站牌记录吗？`,
    header: '确认删除',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '删除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.removeSign(sign.id);
        toast.add({ severity: 'success', summary: '已删除', life: 2000 });
      } catch {
        toast.add({ severity: 'error', summary: '删除失败', life: 3000 });
      }
    },
  });
}

/** 表单保存成功回调 */
function onFormSaved() {
  formVisible.value = false;
  toast.add({ severity: 'success', summary: '保存成功', life: 2000 });
}

/** 切换收藏状态 */
async function handleToggleFavorite(sign: BusSign) {
  try {
    const favorited = await store.toggleFavorite(sign.id);
    toast.add({
      severity: 'success',
      summary: favorited ? '已收藏' : '已取消收藏',
      life: 2000,
    });
  } catch {
    toast.add({ severity: 'error', summary: '收藏操作失败', life: 3000 });
  }
}

/** 分页变化处理 */
async function onPageChange(event: { page: number; rows: number; first: number }) {
  if (event.rows !== store.pageSize) {
    await store.setPageSize(event.rows);
  } else {
    await store.setPage(event.page + 1);
  }
}
</script>

<template>
  <div class="min-h-screen">
    <!-- 页头 -->
    <header class="bg-brand-600 text-white shadow-md">
      <div class="mx-auto max-w-6xl px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i class="pi pi-map-marker text-3xl" />
            <div>
              <h1 class="text-2xl font-bold tracking-tight">地方公交站牌设计图鉴</h1>
              <p class="mt-1 text-sm text-blue-100">收录各地公交站牌样式，记录城市公共交通的视觉记忆</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button
              icon="pi pi-heart"
              label="我的收藏"
              outlined
              class="!border-white/30 !text-white hover:!bg-white/10"
              @click="router.push({ name: 'favorites' })"
            />
            <Button
              icon="pi pi-chart-bar"
              label="数据统计"
              outlined
              class="!border-white/30 !text-white hover:!bg-white/10"
              @click="router.push({ name: 'stats' })"
            />
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <!-- 筛选栏 -->
      <div class="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">样式描述关键词</label>
            <div class="flex gap-2">
              <InputText
                v-model="keywordInput"
                placeholder="输入关键词搜索"
                class="w-56"
                @keyup.enter="handleKeywordSearch"
              />
              <Button icon="pi pi-search" label="搜索" @click="handleKeywordSearch" />
              <Button
                v-if="store.filters.keyword || keywordClearPending"
                icon="pi pi-times"
                outlined
                :disabled="keywordClearPending"
                @click="handleKeywordClear"
              />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">城市</label>
            <Dropdown
              v-model="store.filters.city"
              :options="store.cityOptions"
              placeholder="全部城市"
              show-clear
              filter
              filter-placeholder="搜索城市"
              class="w-40"
              @change="store.setFilter('city', store.filters.city)"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">年代</label>
            <Dropdown
              v-model="store.filters.era"
              :options="store.eraOptions"
              placeholder="全部年代"
              show-clear
              class="w-40"
              @change="store.setFilter('era', store.filters.era)"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-slate-600">风格标签</label>
            <Dropdown
              v-model="store.filters.tagId"
              :options="store.tagOptions"
              option-label="label"
              option-value="value"
              placeholder="全部标签"
              show-clear
              class="w-40"
              @change="store.setFilter('tagId', store.filters.tagId)"
            />
          </div>
          <div class="flex items-center gap-2">
            <InputSwitch v-model="store.filters.inUse" @change="store.setFilter('inUse', store.filters.inUse)" />
            <label class="text-sm font-medium text-slate-600">仅显示使用中</label>
          </div>
          <Button
            v-if="store.filters.city || store.filters.era || store.filters.inUse || store.filters.tagId || store.filters.keyword || keywordClearPending"
            label="重置筛选"
            icon="pi pi-refresh"
            outlined
            :disabled="keywordClearPending"
            @click="handleResetFilters"
          />
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <p class="text-slate-600">
            共 <span class="font-semibold text-brand-600">{{ store.total }}</span> 条记录
          </p>
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-slate-600">排序：</label>
            <Dropdown
              v-model="currentSortValue"
              :options="sortOptions"
              option-label="label"
              option-value="value"
              class="w-44"
            />
          </div>
          <div v-if="selectedCount > 0" class="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">
            <span>已选 {{ selectedCount }} / 2</span>
            <button
              class="ml-1 rounded-full p-0.5 hover:bg-brand-100"
              title="清除选择"
              @click="clearSelection"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <SelectButton
            v-model="layout"
            :options="layoutOptions"
            option-label="label"
            option-value="value"
            data-key="value"
          />
          <Button
            label="对比站牌"
            icon="pi pi-clone"
            :disabled="compareDisabled"
            severity="warning"
            @click="goCompare"
          />
          <Button label="新增站牌" icon="pi pi-plus" @click="openCreate" />
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="store.loading" class="flex justify-center py-20">
        <ProgressSpinner />
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="store.total === 0"
        class="rounded-xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-400"
      >
        <i class="pi pi-inbox mb-3 text-4xl" />
        <p>暂无站牌记录，点击「新增站牌」开始收录</p>
      </div>

      <!-- 站牌列表 -->
      <DataView v-else :value="store.signs" :layout="layout">
        <template #grid="slotProps">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="sign in slotProps.items"
              :key="sign.id"
              class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              :class="{ 'ring-2 ring-brand-500 ring-offset-2': isSelected(sign.id) }"
            >
              <div class="relative block aspect-[3/2] overflow-hidden bg-slate-100">
                <img
                  :src="sign.imageUrl"
                  :alt="`${sign.city}站牌`"
                  class="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                />
                <Tag
                  :value="sign.inUse ? '使用中' : '已停用'"
                  :severity="sign.inUse ? 'success' : 'secondary'"
                  class="absolute right-2 top-2 z-10"
                />
                <Button
                  :icon="store.isFavorited(sign.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
                  :severity="store.isFavorited(sign.id) ? 'danger' : 'secondary'"
                  rounded
                  text
                  class="absolute left-2 top-2 z-10 !bg-white/90 hover:!bg-white"
                  @click.stop="handleToggleFavorite(sign)"
                />
                <div
                  class="absolute bottom-2 left-2 z-10 rounded-md bg-white/90 p-1.5 shadow-sm"
                >
                  <Checkbox
                    :modelValue="isSelected(sign.id)"
                    binary
                    @update:modelValue="toggleSelect(sign.id)"
                  />
                </div>
              </div>
              <div class="p-4">
                <div class="mb-1 flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-slate-800">{{ sign.city }}</h3>
                  <span class="text-sm text-slate-400">{{ sign.era }}</span>
                </div>
                <div v-if="sign.tags && sign.tags.length > 0" class="mb-2 flex flex-wrap gap-1">
                  <Tag
                    v-for="tag in sign.tags"
                    :key="tag.id"
                    :value="tag.name"
                    :severity="tag.color as any"
                    size="small"
                  />
                </div>
                <p class="mb-4 line-clamp-2 text-sm text-slate-500">{{ sign.styleDescription }}</p>
                <div class="flex gap-2">
                  <Button label="预览" icon="pi pi-eye" size="small" outlined @click="openPreview(sign)" />
                  <Button label="详情" icon="pi pi-arrow-right" size="small" @click="goDetail(sign.id)" />
                  <Button
                    :label="store.isFavorited(sign.id) ? '已收藏' : '收藏'"
                    :icon="store.isFavorited(sign.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
                    :severity="store.isFavorited(sign.id) ? 'danger' : undefined"
                    size="small"
                    outlined
                    @click="handleToggleFavorite(sign)"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div class="flex flex-col gap-3">
            <div
              v-for="sign in slotProps.items"
              :key="sign.id"
              class="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              :class="{ 'ring-2 ring-brand-500 ring-offset-2': isSelected(sign.id) }"
            >
              <div class="flex shrink-0 items-center pr-2">
                <Checkbox
                  :modelValue="isSelected(sign.id)"
                  binary
                  @update:modelValue="toggleSelect(sign.id)"
                />
              </div>
              <div class="relative shrink-0 overflow-hidden rounded-lg">
                <img
                  :src="sign.imageUrl"
                  :alt="`${sign.city}站牌`"
                  class="block h-24 w-36 object-cover"
                />
                <Button
                  :icon="store.isFavorited(sign.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
                  :severity="store.isFavorited(sign.id) ? 'danger' : 'secondary'"
                  rounded
                  text
                  size="small"
                  class="absolute left-1 top-1 z-10 !bg-white/90 hover:!bg-white"
                  @click.stop="handleToggleFavorite(sign)"
                />
              </div>
              <div class="flex flex-1 flex-col justify-between">
                <div>
                  <div class="mb-1 flex flex-wrap items-center gap-2">
                    <h3 class="text-lg font-semibold">{{ sign.city }}</h3>
                    <Tag :value="sign.era" severity="info" />
                    <Tag
                      v-if="sign.tags && sign.tags.length > 0"
                      v-for="tag in sign.tags"
                      :key="tag.id"
                      :value="tag.name"
                      :severity="tag.color as any"
                    />
                    <Tag
                      :value="sign.inUse ? '使用中' : '已停用'"
                      :severity="sign.inUse ? 'success' : 'secondary'"
                    />
                  </div>
                  <p class="line-clamp-2 text-sm text-slate-500">{{ sign.styleDescription }}</p>
                </div>
                <div class="mt-2 flex gap-2">
                  <Button label="预览" icon="pi pi-eye" size="small" text @click="openPreview(sign)" />
                  <Button label="详情" icon="pi pi-arrow-right" size="small" text @click="goDetail(sign.id)" />
                  <Button
                    :label="store.isFavorited(sign.id) ? '已收藏' : '收藏'"
                    :icon="store.isFavorited(sign.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
                    :severity="store.isFavorited(sign.id) ? 'danger' : undefined"
                    size="small"
                    text
                    @click="handleToggleFavorite(sign)"
                  />
                  <Button label="编辑" icon="pi pi-pencil" size="small" text @click="openEdit(sign)" />
                  <Button
                    label="删除"
                    icon="pi pi-trash"
                    size="small"
                    text
                    severity="danger"
                    @click="confirmDelete(sign)"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>

      <!-- 分页 -->
      <div
        v-if="store.total > 0"
        class="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div class="text-sm text-slate-500">
          第 <span class="font-medium text-slate-700">{{ store.page }}</span> /
          <span class="font-medium text-slate-700">{{ store.totalPages }}</span> 页
        </div>
        <Paginator
          :rows="store.pageSize"
          :total-records="store.total"
          :first="(store.page - 1) * store.pageSize"
          :rows-per-page-options="[6, 12, 24, 48]"
          :template="{
            layout: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown',
            FirstPageLink: {
              tooltip: '首页',
            },
            PrevPageLink: {
              tooltip: '上一页',
            },
            NextPageLink: {
              tooltip: '下一页',
            },
            LastPageLink: {
              tooltip: '末页',
            },
            RowsPerPageDropdown: {
              'aria-label': '每页条数',
              showCurrentPageReport: false,
            },
          }"
          @page="onPageChange"
        />
      </div>
    </main>

    <!-- 快速预览 Dialog -->
    <Dialog
      v-model:visible="previewVisible"
      :header="previewSign ? `${previewSign.city} · 站牌预览` : '站牌预览'"
      modal
      class="w-full max-w-lg"
    >
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
          <div v-if="previewSign.tags && previewSign.tags.length > 0" class="flex justify-between items-center">
            <dt class="text-slate-400">风格标签</dt>
            <dd class="flex flex-wrap gap-1 justify-end">
              <Tag
                v-for="tag in previewSign.tags"
                :key="tag.id"
                :value="tag.name"
                :severity="tag.color as any"
                size="small"
              />
            </dd>
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
          <Button label="查看详情" icon="pi pi-external-link" @click="goDetail(previewSign.id); previewVisible = false" />
        </div>
      </template>
    </Dialog>

    <!-- 新建/编辑表单 -->
    <SignFormDialog
      v-model:visible="formVisible"
      :sign="editingSign"
      @saved="onFormSaved"
    />
  </div>
</template>
