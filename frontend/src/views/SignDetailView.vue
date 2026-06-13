<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import SignFormDialog from '@/components/SignFormDialog.vue';
import { useSignsStore } from '@/stores/signs';
import { fetchSign } from '@/api/signs';
import type { BusSign } from '@/types/sign';

const props = defineProps<{ id: string }>();

const store = useSignsStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const sign = ref<BusSign | null>(null);
const loading = ref(true);
const formVisible = ref(false);

const signId = computed(() => Number(props.id));

onMounted(async () => {
  await Promise.all([loadDetail(), store.loadFavorites()]);
});

/** 加载站牌详情 */
async function loadDetail() {
  loading.value = true;
  try {
    if (store.signs.length === 0) {
      await store.loadSigns();
    }
    const cached = store.getById(signId.value);
    if (cached) {
      sign.value = cached;
    } else {
      sign.value = await fetchSign(signId.value);
    }
  } catch {
    toast.add({ severity: 'error', summary: '错误', detail: '站牌不存在或加载失败', life: 3000 });
    router.push('/');
  } finally {
    loading.value = false;
  }
}

/** 返回列表 */
function goBack() {
  router.push('/');
}

/** 删除站牌 */
function confirmDelete() {
  if (!sign.value) return;
  confirm.require({
    message: `确定删除「${sign.value.city}」站牌记录吗？`,
    header: '确认删除',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '删除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.removeSign(sign.value!.id);
        toast.add({ severity: 'success', summary: '已删除', life: 2000 });
        router.push('/');
      } catch {
        toast.add({ severity: 'error', summary: '删除失败', life: 3000 });
      }
    },
  });
}

/** 编辑保存成功 */
function onFormSaved(updated: BusSign) {
  sign.value = updated;
  formVisible.value = false;
  toast.add({ severity: 'success', summary: '保存成功', life: 2000 });
}

/** 切换收藏状态 */
async function handleToggleFavorite() {
  if (!sign.value) return;
  try {
    const favorited = await store.toggleFavorite(sign.value.id);
    toast.add({
      severity: 'success',
      summary: favorited ? '已收藏' : '已取消收藏',
      life: 2000,
    });
  } catch {
    toast.add({ severity: 'error', summary: '收藏操作失败', life: 3000 });
  }
}
</script>

<template>
  <div class="min-h-screen">
    <header class="bg-brand-600 text-white shadow-md">
      <div class="mx-auto max-w-4xl px-4 py-5">
        <Button
          icon="pi pi-arrow-left"
          label="返回图鉴"
          text
          class="mb-2 !text-white hover:!bg-white/10"
          @click="goBack"
        />
        <h1 class="text-xl font-bold">站牌详情</h1>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 py-8">
      <div v-if="loading" class="flex justify-center py-20">
        <ProgressSpinner />
      </div>

      <template v-else-if="sign">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="relative">
            <img
              :src="sign.imageUrl"
              :alt="`${sign.city}站牌`"
              class="aspect-[16/9] w-full object-cover"
            />
            <Button
              :icon="store.isFavorited(sign.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
              :label="store.isFavorited(sign.id) ? '已收藏' : '收藏'"
              :severity="store.isFavorited(sign.id) ? 'danger' : undefined"
              class="absolute left-4 top-4"
              @click="handleToggleFavorite"
            />
          </div>
          <div class="p-6 md:p-8">
            <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 class="text-3xl font-bold text-slate-800">{{ sign.city }}</h2>
                <p class="mt-1 text-slate-400">公交站牌设计记录 #{{ sign.id }}</p>
              </div>
              <div class="flex gap-2">
                <Tag :value="sign.era" severity="info" />
                <Tag
                  :value="sign.inUse ? '使用中' : '已停用'"
                  :severity="sign.inUse ? 'success' : 'secondary'"
                />
              </div>
            </div>

            <section class="mb-8">
              <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">样式描述</h3>
              <p class="leading-relaxed text-slate-700">{{ sign.styleDescription }}</p>
            </section>

            <section class="mb-8 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-4">
              <div>
                <p class="text-xs text-slate-400">城市</p>
                <p class="font-medium">{{ sign.city }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">年代</p>
                <p class="font-medium">{{ sign.era }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">使用状态</p>
                <p class="font-medium">{{ sign.inUse ? '使用中' : '已停用' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">图片</p>
                <a :href="sign.imageUrl" target="_blank" class="font-medium text-brand-600 hover:underline">
                  查看原图
                </a>
              </div>
            </section>

            <div class="flex gap-3">
              <Button
                :label="store.isFavorited(sign.id) ? '已收藏' : '收藏'"
                :icon="store.isFavorited(sign.id) ? 'pi pi-heart-fill' : 'pi pi-heart'"
                :severity="store.isFavorited(sign.id) ? 'danger' : undefined"
                @click="handleToggleFavorite"
              />
              <Button label="编辑" icon="pi pi-pencil" @click="formVisible = true" />
              <Button label="删除" icon="pi pi-trash" severity="danger" outlined @click="confirmDelete" />
            </div>
          </div>
        </div>
      </template>
    </main>

    <SignFormDialog
      v-if="sign"
      v-model:visible="formVisible"
      :sign="sign"
      @saved="onFormSaved"
    />
  </div>
</template>
