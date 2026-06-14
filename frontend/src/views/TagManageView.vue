<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import SelectButton from 'primevue/selectbutton';
import ProgressSpinner from 'primevue/progressspinner';
import AppHeader from '@/components/AppHeader.vue';
import { fetchTags, createTag, updateTag, deleteTag } from '@/api/signs';
import type { Tag as TagType } from '@/types/sign';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const tags = ref<TagType[]>([]);
const loading = ref(false);

const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const editingTag = ref<TagType | null>(null);
const formName = ref('');
const formColor = ref('info');
const saving = ref(false);

const colorPresets = [
  { label: '蓝色', value: 'info' },
  { label: '绿色', value: 'success' },
  { label: '橙色', value: 'warning' },
  { label: '红色', value: 'danger' },
  { label: '紫色', value: 'help' },
  { label: '灰色', value: 'secondary' },
  { label: '深色', value: 'contrast' },
];

onMounted(async () => {
  await loadTags();
});

async function loadTags() {
  loading.value = true;
  try {
    tags.value = await fetchTags();
  } catch {
    toast.add({ severity: 'error', summary: '加载失败', detail: '无法获取标签列表', life: 3000 });
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  dialogMode.value = 'create';
  editingTag.value = null;
  formName.value = '';
  formColor.value = 'info';
  dialogVisible.value = true;
}

function openEdit(tag: TagType) {
  dialogMode.value = 'edit';
  editingTag.value = tag;
  formName.value = tag.name;
  formColor.value = tag.color;
  dialogVisible.value = true;
}

async function handleSubmit() {
  const name = formName.value.trim();
  if (!name) {
    toast.add({ severity: 'warn', summary: '请输入标签名称', life: 2000 });
    return;
  }

  saving.value = true;
  try {
    if (dialogMode.value === 'create') {
      await createTag({ name, color: formColor.value });
      toast.add({ severity: 'success', summary: '创建成功', life: 2000 });
    } else if (editingTag.value) {
      await updateTag(editingTag.value.id, { name, color: formColor.value });
      toast.add({ severity: 'success', summary: '更新成功', life: 2000 });
    }
    dialogVisible.value = false;
    await loadTags();
  } catch (err: any) {
    const msg = err?.response?.data?.error || '操作失败';
    toast.add({ severity: 'error', summary: msg, life: 3000 });
  } finally {
    saving.value = false;
  }
}

function confirmDeleteTag(tag: TagType) {
  confirm.require({
    message: `确定删除标签「${tag.name}」吗？删除后将自动解除与该标签关联的所有站牌。`,
    header: '确认删除',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '删除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteTag(tag.id);
        toast.add({ severity: 'success', summary: '已删除', detail: `标签「${tag.name}」已删除`, life: 2000 });
        await loadTags();
      } catch {
        toast.add({ severity: 'error', summary: '删除失败', life: 3000 });
      }
    },
  });
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('zh-CN');
  } catch {
    return dateStr;
  }
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader
      title="标签管理"
      subtitle="管理风格标签，新增、编辑或删除标签"
      icon="pi pi-tags"
      :show-back="true"
      back-label="返回图鉴"
      back-route="home"
    />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-6 flex items-center justify-between">
        <p class="text-slate-600">
          共 <span class="font-semibold text-brand-600">{{ tags.length }}</span> 个标签
        </p>
        <Button label="新增标签" icon="pi pi-plus" @click="openCreate" />
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <ProgressSpinner />
      </div>

      <div
        v-else-if="tags.length === 0"
        class="rounded-xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-400"
      >
        <i class="pi pi-tags mb-3 text-4xl" />
        <p>暂无标签，点击「新增标签」开始创建</p>
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <DataTable :value="tags" striped-rows>
          <Column field="name" header="标签名称" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Tag :value="data.name" :severity="data.color as any" />
              </div>
            </template>
          </Column>
          <Column field="color" header="颜色" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <span
                  class="inline-block h-4 w-4 rounded-full border border-slate-200"
                  :class="{
                    'bg-blue-500': data.color === 'info',
                    'bg-green-500': data.color === 'success',
                    'bg-orange-500': data.color === 'warning',
                    'bg-red-500': data.color === 'danger',
                    'bg-purple-500': data.color === 'help',
                    'bg-slate-400': data.color === 'secondary',
                    'bg-slate-800': data.color === 'contrast',
                  }"
                />
                <span class="text-sm text-slate-600">
                  {{ colorPresets.find(c => c.value === data.color)?.label || data.color }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="createdAt" header="创建时间" sortable>
            <template #body="{ data }">
              <span class="text-sm text-slate-500">{{ formatDate(data.createdAt) }}</span>
            </template>
          </Column>
          <Column header="操作" :style="{ width: '180px' }">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  label="编辑"
                  size="small"
                  text
                  @click="openEdit(data)"
                />
                <Button
                  icon="pi pi-trash"
                  label="删除"
                  size="small"
                  text
                  severity="danger"
                  @click="confirmDeleteTag(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>

    <Dialog
      v-model:visible="dialogVisible"
      :header="dialogMode === 'create' ? '新增标签' : '编辑标签'"
      modal
      class="w-full max-w-md"
    >
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-600">标签名称</label>
          <InputText
            v-model="formName"
            class="w-full"
            placeholder="输入标签名称"
            :maxlength="20"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-600">标签颜色</label>
          <SelectButton
            v-model="formColor"
            :options="colorPresets"
            option-label="label"
            option-value="value"
            class="flex-wrap"
          />
          <div class="mt-3 flex items-center gap-2">
            <span class="text-sm text-slate-400">预览：</span>
            <Tag :value="formName || '标签'" :severity="formColor as any" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button
            label="取消"
            severity="secondary"
            text
            type="button"
            @click="dialogVisible = false"
          />
          <Button
            :label="dialogMode === 'create' ? '创建' : '保存'"
            type="submit"
            :loading="saving"
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>
