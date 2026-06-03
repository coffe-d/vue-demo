<!--
  数据表格 —— 通过 API 层直接操作
  数据流: Component → tableApi → Mock Handler → 更新本地数据
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import * as tableApi from '@/api/table'
import type { TableRecord } from '@/api/table'

const { t } = useI18n()

const records = ref<TableRecord[]>([])
const loading = ref(false)
const searchText = ref('')

const filteredData = computed(() => {
  if (!searchText.value.trim()) return records.value
  const kw = searchText.value.toLowerCase()
  return records.value.filter((r) => r.name.includes(kw) || r.email.toLowerCase().includes(kw))
})

const selectedRowKeys = ref<number[]>([])
const modalVisible = ref(false)
const modalTitle = ref('')
const editingRecord = ref<TableRecord>({
  id: 0,
  name: '',
  email: '',
  role: '用户',
  status: 'active',
  created: '',
})

onMounted(async () => {
  loading.value = true
  const result = await tableApi.getTableList()
  records.value = result.items
  loading.value = false
})

function handleAdd() {
  modalTitle.value = t('table.addRecord')
  editingRecord.value = { id: 0, name: '', email: '', role: '用户', status: 'active', created: '' }
  modalVisible.value = true
}

function handleEdit(record: TableRecord) {
  modalTitle.value = t('table.editRecord')
  editingRecord.value = { ...record }
  modalVisible.value = true
}

async function handleSave() {
  if (!editingRecord.value.name.trim() || !editingRecord.value.email.trim()) {
    message.warning('请填写姓名和邮箱')
    return
  }
  if (editingRecord.value.id === 0) {
    const created = await tableApi.createRecord({
      name: editingRecord.value.name,
      email: editingRecord.value.email,
      role: editingRecord.value.role,
      status: editingRecord.value.status,
      created: new Date().toISOString().slice(0, 10),
    })
    records.value.unshift(created)
  } else {
    const updated = await tableApi.updateRecord(editingRecord.value.id, editingRecord.value)
    const idx = records.value.findIndex((r) => r.id === editingRecord.value.id)
    if (idx > -1) records.value.splice(idx, 1, updated)
  }
  modalVisible.value = false
  message.success(t('common.success'))
}

async function handleDelete(id: number) {
  await tableApi.deleteRecord(id)
  const idx = records.value.findIndex((r) => r.id === id)
  if (idx > -1) records.value.splice(idx, 1)
  message.success(t('common.success'))
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择记录')
    return
  }
  await tableApi.batchDeleteRecords(selectedRowKeys.value)
  records.value = records.value.filter((r) => !selectedRowKeys.value.includes(r.id))
  selectedRowKeys.value = []
  message.success(t('common.success'))
}
</script>

<template>
  <div class="data-table">
    <a-page-header :title="t('table.title')" />

    <a-card>
      <a-space class="toolbar" style="width: 100%; justify-content: space-between; flex-wrap: wrap">
        <a-space>
          <a-button type="primary" @click="handleAdd">{{ t('table.addRecord') }}</a-button>
          <a-popconfirm
            :title="t('table.deleteConfirm')"
            :ok-text="t('common.yes')"
            :cancel-text="t('common.no')"
            @confirm="handleBatchDelete"
          >
            <a-button danger :disabled="selectedRowKeys.length === 0"
              >{{ t('table.batchDelete') }}
              {{ selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : '' }}</a-button
            >
          </a-popconfirm>
        </a-space>
        <a-input-search
          v-model:value="searchText"
          :placeholder="t('table.searchPlaceholder')"
          style="width: 280px"
          allowClear
        />
      </a-space>

      <a-table
        :dataSource="filteredData"
        :rowSelection="{
          selectedRowKeys,
          onChange: (keys: any) => (selectedRowKeys = keys as number[]),
        }"
        :pagination="{
          pageSize: 5,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        :loading="loading"
        rowKey="id"
        size="middle"
        class="table-main"
      >
        <a-table-column title="ID" dataIndex="id" width="80" />
        <a-table-column :title="t('table.name')" dataIndex="name" />
        <a-table-column :title="t('table.email')" dataIndex="email" />
        <a-table-column :title="t('table.role')" dataIndex="role">
          <template #default="{ text }"
            ><a-tag>{{ text }}</a-tag></template
          >
        </a-table-column>
        <a-table-column :title="t('table.status')" dataIndex="status">
          <template #default="{ text }">
            <a-badge :status="text === 'active' ? 'success' : 'default'" />
            <span>{{ text === 'active' ? '启用' : '停用' }}</span>
          </template>
        </a-table-column>
        <a-table-column :title="t('table.created')" dataIndex="created" />
        <a-table-column key="actions" :title="t('table.actions')" width="200">
          <template #default="{ record }">
            <a-button type="link" size="small" @click="handleEdit(record)">{{
              t('common.edit')
            }}</a-button>
            <a-popconfirm
              :title="t('table.deleteConfirm')"
              :ok-text="t('common.yes')"
              :cancel-text="t('common.no')"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>{{ t('common.delete') }}</a-button>
            </a-popconfirm>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :ok-text="t('common.save')"
      :cancel-text="t('common.cancel')"
      @ok="handleSave"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('table.name')" required
          ><a-input v-model:value="editingRecord.name"
        /></a-form-item>
        <a-form-item :label="t('table.email')" required
          ><a-input v-model:value="editingRecord.email"
        /></a-form-item>
        <a-form-item :label="t('table.role')">
          <a-select v-model:value="editingRecord.role">
            <a-select-option value="管理员">管理员</a-select-option>
            <a-select-option value="编辑">编辑</a-select-option>
            <a-select-option value="用户">用户</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('table.status')">
          <a-switch
            :checked="editingRecord.status === 'active'"
            checked-children="启用"
            un-checked-children="停用"
            @change="(val: boolean) => (editingRecord.status = val ? 'active' : 'inactive')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
.table-main {
  margin-top: 8px;
}
</style>
