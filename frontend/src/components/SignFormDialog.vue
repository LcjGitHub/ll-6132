<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
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

const form = ref<BusSignInput>({
  city: '',
  styleDescription: '',
  era: '',
  inUse: true,
  imageUrl: '',
});

const isEdit = ref(false);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.sign) {
        isEdit.value = true;
        form.value = {
          city: props.sign.city,
          styleDescription: props.sign.styleDescription,
          era: props.sign.era,
          inUse: props.sign.inUse,
          imageUrl: props.sign.imageUrl,
        };
      } else {
        isEdit.value = false;
        form.value = {
          city: '',
          styleDescription: '',
          era: '',
          inUse: true,
          imageUrl: '',
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

  saving.value = true;
  try {
    let result: BusSign;
    if (isEdit.value && props.sign) {
      result = await store.editSign(props.sign.id, form.value);
    } else {
      result = await store.addSign(form.value);
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
        <Button :label="isEdit ? '保存' : '创建'" type="submit" :loading="saving" />
      </div>
    </form>
  </Dialog>
</template>
