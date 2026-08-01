<!--
  字典管理 — 字典类型表 + 字典项子表（展开行），支持增删改查
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import type { SysDictType, SysDictItem } from '@/types'
import {
  getDictTypeList, createDictType, updateDictType, deleteDictType,
  getDictItems, createDictItem, updateDictItem, deleteDictItem,
} from '@/api/system'

const { t } = useI18n()

// ===== 字典类型 =====
const loading = ref(false)
const typeList = ref<SysDictType[]>([])
const expandedRowKeys = ref<number[]>([])
const dictItemsMap = ref<Record<string, SysDictItem[]>>({})

// 类型表单
const typeModalVisible = ref(false)
const isTypeEdit = ref(false)
const typeFormRef = ref()
const typeForm = reactive<Partial<SysDictType>>({ dictName: '', dictCode: '', status: 'enabled', remark: '' })

// 字典项表单
const itemModalVisible = ref(false)
const isItemEdit = ref(false)
const itemFormRef = ref()
const currentDictCode = ref('')
const itemForm = reactive<Partial<SysDictItem>>({ dictCode: '', label: '', value: '', sort: 0, status: 'enabled', remark: '' })

const typeColumns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: t('system.dict.dictName'), dataIndex: 'dictName', width: 200 },
  { title: t('system.dict.dictCode'), dataIndex: 'dictCode', width: 180 },
  { title: t('common.status'), dataIndex: 'status', width: 80 },
  { title: t('common.remark'), dataIndex: 'remark' },
  { title: t('common.createTime'), dataIndex: 'createdAt', width: 180 },
  { title: t('common.actions'), key: 'actions', width: 280, fixed: 'right' as const },
]

const itemColumns = [
  { title: t('system.dict.dictLabel'), dataIndex: 'label', width: 150 },
  { title: t('system.dict.dictValue'), dataIndex: 'value', width: 150 },
  { title: t('system.menu.sort'), dataIndex: 'sort', width: 60 },
  { title: t('common.status'), dataIndex: 'status', width: 80 },
  { title: t('common.remark'), dataIndex: 'remark' },
  { title: t('common.actions'), key: 'actions', width: 180 },
]

async function loadDictTypes() {
  loading.value = true
  try { typeList.value = await getDictTypeList() } finally { loading.value = false }
}

async function loadDictItems(dictCode: string) {
  const items = await getDictItems(dictCode)
  dictItemsMap.value[dictCode] = items
}

function handleExpand(expanded: boolean, record: SysDictType) {
  if (expanded) {
    loadDictItems(record.dictCode)
  }
}

// ===== 字典类型 CRUD =====
function handleAddType() {
  isTypeEdit.value = false
  Object.assign(typeForm, { id: undefined, dictName: '', dictCode: '', status: 'enabled', remark: '' })
  typeModalVisible.value = true
}

function handleEditType(record: SysDictType) {
  isTypeEdit.value = true
  Object.assign(typeForm, { ...record })
  typeModalVisible.value = true
}

async function handleDeleteType(record: SysDictType) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: `确定删除字典「${record.dictName}」？字典项将一并删除。`,
    onOk: async () => {
      await deleteDictType(record.id)
      message.success(t('common.success'))
      loadDictTypes()
    },
  })
}

async function handleTypeSubmit() {
  await typeFormRef.value?.validate()
  const data = { ...typeForm }
  if (isTypeEdit.value && typeForm.id) {
    await updateDictType(typeForm.id, data)
  } else {
    await createDictType(data)
  }
  message.success(t('common.success'))
  typeModalVisible.value = false
  loadDictTypes()
}

// ===== 字典项 CRUD =====
function handleAddItem(dictCode: string) {
  isItemEdit.value = false
  currentDictCode.value = dictCode
  Object.assign(itemForm, { id: undefined, dictCode, label: '', value: '', sort: 0, status: 'enabled', remark: '' })
  itemModalVisible.value = true
}

function handleEditItem(dictCode: string, record: SysDictItem) {
  isItemEdit.value = true
  currentDictCode.value = dictCode
  Object.assign(itemForm, { ...record })
  itemModalVisible.value = true
}

async function handleDeleteItem(dictCode: string, item: SysDictItem) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: `确定删除字典项「${item.label}」？`,
    onOk: async () => {
      await deleteDictItem(item.id)
      message.success(t('common.success'))
      await loadDictItems(dictCode)
    },
  })
}

async function handleItemSubmit() {
  await itemFormRef.value?.validate()
  const data = { ...itemForm }
  if (isItemEdit.value && itemForm.id) {
    await updateDictItem(itemForm.id, data)
  } else {
    await createDictItem(data)
  }
  message.success(t('common.success'))
  itemModalVisible.value = false
  await loadDictItems(currentDictCode.value)
}

onMounted(loadDictTypes)
</script>

<template>
  <div class="dict-manage">
    <div class="page-header">
      <h3>{{ t('menu.dictManage') }}</h3>
      <a-button type="primary" @click="handleAddType">{{ t('common.add') }}</a-button>
    </div>

    <a-table
      :columns="typeColumns"
      :dataSource="typeList"
      :loading="loading"
      rowKey="id"
      :expandRowByClick="true"
      :expandedRowKeys="expandedRowKeys"
      :pagination="false"
      size="small"
      @expand="handleExpand"
    >
      <template #expandedRowRender="{ record }">
        <div class="dict-items-panel">
          <div class="dict-items-header">
            <span class="dict-items-title">{{ t('system.dict.dictManage') }}</span>
            <a-button type="link" size="small" @click.stop="handleAddItem(record.dictCode)">+ 新增字典项</a-button>
          </div>
          <a-table
            :columns="itemColumns"
            :dataSource="dictItemsMap[record.dictCode] || []"
            rowKey="id"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record: item }">
              <template v-if="column.key === 'actions'">
                <a-space size="small">
                  <a-button type="link" size="small" @click="handleEditItem(record.dictCode, item)">{{ t('common.edit') }}</a-button>
                  <a-button type="link" size="small" danger @click="handleDeleteItem(record.dictCode, item)">{{ t('common.delete') }}</a-button>
                </a-space>
              </template>
              <template v-else-if="column.dataIndex === 'status'">
                <a-tag :color="item.status === 'enabled' ? 'green' : 'red'">
                  {{ item.status === 'enabled' ? '启用' : '禁用' }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </div>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <a-space size="small">
            <a-button type="link" size="small" @click="handleEditType(record)">{{ t('common.edit') }}</a-button>
            <a-button type="link" size="small" danger @click="handleDeleteType(record)">{{ t('common.delete') }}</a-button>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 'enabled' ? 'green' : 'red'">
            {{ record.status === 'enabled' ? '启用' : '禁用' }}
          </a-tag>
        </template>
      </template>
    </a-table>

    <!-- 字典类型弹窗 -->
    <a-modal v-model:open="typeModalVisible" :title="isTypeEdit ? t('common.edit') : t('common.add')" @ok="handleTypeSubmit">
      <a-form ref="typeFormRef" :model="typeForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="t('system.dict.dictName')" name="dictName" :rules="[{ required: true, message: '请输入字典名称' }]">
          <a-input v-model:value="typeForm.dictName" />
        </a-form-item>
        <a-form-item :label="t('system.dict.dictCode')" name="dictCode" :rules="[{ required: true, message: '请输入字典编码' }]">
          <a-input v-model:value="typeForm.dictCode" :disabled="isTypeEdit" />
        </a-form-item>
        <a-form-item :label="t('common.status')" name="status">
          <a-radio-group v-model:value="typeForm.status">
            <a-radio value="enabled">启用</a-radio>
            <a-radio value="disabled">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item :label="t('common.remark')" name="remark">
          <a-textarea v-model:value="typeForm.remark" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 字典项弹窗 -->
    <a-modal v-model:open="itemModalVisible" :title="(isItemEdit ? t('common.edit') : t('common.add')) + '字典项'" @ok="handleItemSubmit">
      <a-form ref="itemFormRef" :model="itemForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="t('system.dict.dictLabel')" name="label" :rules="[{ required: true, message: '请输入字典项标签' }]">
          <a-input v-model:value="itemForm.label" />
        </a-form-item>
        <a-form-item :label="t('system.dict.dictValue')" name="value" :rules="[{ required: true, message: '请输入字典项值' }]">
          <a-input v-model:value="itemForm.value" />
        </a-form-item>
        <a-form-item :label="t('system.menu.sort')" name="sort">
          <a-input-number v-model:value="itemForm.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="t('common.status')" name="status">
          <a-radio-group v-model:value="itemForm.status">
            <a-radio value="enabled">启用</a-radio>
            <a-radio value="disabled">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item :label="t('common.remark')" name="remark">
          <a-textarea v-model:value="itemForm.remark" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.dict-items-panel { padding: 12px; background: #fafafa; border-radius: 4px; }
.dict-items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.dict-items-title { font-weight: 600; font-size: 13px; }
</style>
