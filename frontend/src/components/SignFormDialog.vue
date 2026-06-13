<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import MultiSelect from 'primevue/multiselect';
import { useSignsStore } from '@/stores/signs';
import type { BusSign, BusSignInput } from '@/types/sign';

const props = defineProps<{
  visible: boolean;
  sign?: BusSign | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  saved: [sign: BusSign];
}>();

const store = useSignsStore();
const saving = ref(false);

const form = ref<BusSignInput & { tagIds: number[] }>({
  city: '',
  styleDescription: '',
  era: '',
  inUse: true,
  imageUrl: '',
  tagIds: [],
});

const isEdit = ref(false);
const maxTags = 3;

onMounted(async () => {
  if (store.tags.length === 0) {
    await store.loadTags();
  }
});

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      if (store.tags.length === 0) {
        await store.loadTags();
      }
      if (props.sign) {
        isEdit.value = true;
        form.value = {
          city: props.sign.city,
          styleDescription: props.sign.styleDescription,
          era: props.sign.era,
          inUse: props.sign.inUse,
          imageUrl: props.sign.imageUrl,
          tagIds: props.sign.tags?.map((t) => t.id) || [],
        };
      } else {
        isEdit.value = false;
        form.value = {
          city: '',
          styleDescription: '',
          era: '',
          inUse: true,
          imageUrl: '',
          tagIds: [],
        };
      }
    }
  }
);

/** 提交表单 */
async function handleSubmit() {
  if (!form.value.city || !form.value.styleDescription || !form.value.era || !form.value.imageUrl) {
    return;
  }
  if (form.value.tagIds.length > maxTags) {
    return;
  }

  saving.value = true;
  try {
    const submitData: BusSignInput = {
      city: form.value.city,
      styleDescription: form.value.styleDescription,
      era: form.value.era,
      inUse: form.value.inUse,
      imageUrl: form.value.imageUrl,
      tagIds: form.value.tagIds.length > 0 ? form.value.tagIds : undefined,
    };
    let result: BusSign;
    if (isEdit.value && props.sign) {
      result = await store.editSign(props.sign.id, submitData);
    } else {
      result = await store.addSign(submitData);
    }
    emit('saved', result);
    emit('update:visible', false);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="isEdit ? '编辑站牌' : '新增站牌'"
    modal
    class="w-full max-w-md"
    @update:visible="emit('update:visible', $event)"
  >
    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-600">城市</label>
        <InputText v-model="form.city" class="w-full" placeholder="如：北京" required />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-600">年代</label>
        <InputText v-model="form.era" class="w-full" placeholder="如：2010年代" required />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-600">
          站牌风格标签
          <span class="text-slate-400">(最多 {{ maxTags }} 个)</span>
        </label>
        <MultiSelect
          v-model="form.tagIds"
          :options="store.tagOptions"
          option-label="label"
          option-value="value"
          :selection-limit="maxTags"
          :max-selected-labels="maxTags"
          placeholder="选择标签..."
          display="chip"
          class="w-full"
          :filter="store.tags.length > 8"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-600">样式描述</label>
        <Textarea
          v-model="form.styleDescription"
          class="w-full"
          rows="3"
          placeholder="描述站牌的外观特征..."
          required
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-600">图片 URL</label>
        <InputText v-model="form.imageUrl" class="w-full" placeholder="https://..." required />
      </div>
      <div class="flex items-center gap-3">
        <InputSwitch v-model="form.inUse" />
        <label class="text-sm text-slate-600">{{ form.inUse ? '使用中' : '已停用' }}</label>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <Button
          label="取消"
          severity="secondary"
          text
          type="button"
          @click="emit('update:visible', false)"
        />
        <Button
          :label="isEdit ? '保存' : '创建'"
          type="submit"
          :loading="saving"
          :disabled="form.tagIds.length > maxTags"
        />
      </div>
    </form>
  </Dialog>
</template>
