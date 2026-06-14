<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import { fetchRandomSign } from '@/api/signs';

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    icon?: string;
    showBack?: boolean;
    backLabel?: string;
    backRoute?: string;
    maxWidth?: string;
  }>(),
  {
    showBack: false,
    backLabel: '返回图鉴',
    backRoute: 'home',
    maxWidth: 'max-w-6xl',
  },
);

const router = useRouter();
const route = useRoute();
const toast = useToast();

const randomLoading = ref(false);
const currentRouteName = computed(() => route.name);

const paddingClass = computed(() =>
  props.icon || props.subtitle ? 'py-6' : 'py-5',
);

const titleClass = computed(() =>
  props.icon || props.subtitle ? 'text-2xl tracking-tight' : 'text-xl',
);

function goBack() {
  if (props.backRoute) {
    router.push({ name: props.backRoute });
  } else {
    router.back();
  }
}

interface NavItem {
  label: string;
  icon: string;
  routeName: string;
}

const navItems: NavItem[] = [
  { label: '首页', icon: 'pi pi-home', routeName: 'home' },
  { label: '历史', icon: 'pi pi-history', routeName: 'history' },
  { label: '收藏', icon: 'pi pi-heart', routeName: 'favorites' },
  { label: '统计', icon: 'pi pi-chart-bar', routeName: 'stats' },
];

async function goRandom() {
  if (randomLoading.value) return;
  randomLoading.value = true;
  try {
    const sign = await fetchRandomSign();
    router.push({ name: 'sign-detail', params: { id: sign.id } });
  } catch {
    toast.add({ severity: 'error', summary: '加载失败', detail: '无法获取随机站牌', life: 3000 });
  } finally {
    randomLoading.value = false;
  }
}
</script>

<template>
  <header class="bg-brand-600 text-white shadow-md">
    <div :class="['mx-auto px-4', maxWidth, paddingClass]">
      <Button
        v-if="showBack"
        icon="pi pi-arrow-left"
        :label="backLabel"
        text
        class="mb-2 !text-white hover:!bg-white/10"
        @click="goBack"
      />
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <i v-if="icon" :class="[icon, 'text-3xl']" />
          <div>
            <h1 :class="['font-bold', titleClass]">{{ title }}</h1>
            <p v-if="subtitle" class="mt-1 text-sm text-blue-100">{{ subtitle }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-for="item in navItems"
            :key="item.routeName"
            :icon="item.icon"
            :label="item.label"
            outlined
            :class="[
              currentRouteName === item.routeName
                ? '!bg-white/20 !border-white/50'
                : '!border-white/30',
              '!text-white hover:!bg-white/10',
            ]"
            @click="
              currentRouteName !== item.routeName && router.push({ name: item.routeName })
            "
          />
          <Button
            icon="pi pi-compass"
            label="随机发现"
            outlined
            :loading="randomLoading"
            class="!border-white/30 !text-white hover:!bg-white/10"
            @click="goRandom"
          />
          <slot name="right" />
        </div>
      </div>
    </div>
  </header>
</template>
