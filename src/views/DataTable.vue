<!--
  数据表格 —— 通过 API 层直接操作
  数据流: Component → tableApi → Mock Handler → 更新本地数据

  ============================================================
  Vue3 父子组件通信演示（父组件视角）
  ============================================================
  本页面展示如何以"声明式 Props + Emits"模式使用子组件：

  【数据向下（父→子）】
    :record="editingRecord"     → Props 传递编辑数据给弹窗
    :title="modalTitle"         → Props 传递标题给弹窗

  【事件向上（子→父）】
    @save="handleSave"          → 子组件校验通过后通知父组件保存

  【双向绑定（v-model 语法糖）】
    v-model:open="modalVisible" → 等价于 :open + @update:open
                                  父组件修改 modalVisible → 弹窗打开/关闭
                                  子组件 emit('update:open') → 自动同步回父组件

  【对比：改造前 vs 改造后】
    改造前：<a-modal> 直接写在 DataTable.vue 中
            - 表单状态和表格状态混在一个组件
            - 弹窗逻辑无法复用
            - 组件过大，维护困难

    改造后：<TableFormModal> 独立组件
            - 弹窗表单状态封装在子组件内（formData）
            - 父组件只关心"什么时候保存"和"保存什么数据"
            - 弹窗可在其他页面复用
            - 职责清晰：子组件管 UI + 校验，父组件管 API + 数据
  ============================================================
-->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import * as tableApi from '@/api/table'
import type { TableRecord } from '@/api/table'
import TableFormModal from '@/components/TableFormModal.vue'

const { t } = useI18n()

// ============================================================
// 表格数据状态（父组件管理）
// ============================================================
const records = ref<TableRecord[]>([])
const loading = ref(false)
const searchText = ref('')

// 搜索过滤
const filteredData = computed(() => {
  if (!searchText.value.trim()) return records.value
  const kw = searchText.value.toLowerCase()
  return records.value.filter((r) => r.name.includes(kw) || r.email.toLowerCase().includes(kw))
})

// 多选
const selectedRowKeys = ref<number[]>([])

// ============================================================
// 弹窗控制状态（通过 Props 传给子组件）
// ============================================================
const modalVisible = ref(false) // v-model:open → 子组件可读写
const modalTitle = ref('') // :title → 子组件只读
const editingRecord = ref<TableRecord>({
  // :record → 子组件只读（内部会创建副本）
  id: 0,
  name: '',
  email: '',
  role: '用户',
  status: 'active',
  created: '',
})

// ============================================================
// 初始化加载数据
// ============================================================
onMounted(async () => {
  loading.value = true
  const result = await tableApi.getTableList()
  records.value = result.items
  loading.value = false
})

// ============================================================
// 弹窗操作
// ============================================================

// 新增 — 设置初始数据后打开弹窗
function handleAdd() {
  modalTitle.value = t('table.addRecord')
  editingRecord.value = { id: 0, name: '', email: '', role: '用户', status: 'active', created: '' }
  // 打开弹窗 — 子组件的 watch(props.open) 会检测到变化并重置表单
  modalVisible.value = true
}

// 编辑 — 复制行数据后打开弹窗
function handleEdit(record: TableRecord) {
  modalTitle.value = t('table.editRecord')
  // 展开运算符创建副本，避免直接引用表格行数据
  editingRecord.value = { ...record }
  modalVisible.value = true
}

// ============================================================
// 保存回调 — 子组件 emit('save', data) 触发
// ============================================================
// 改造后的关键变化：
//   改造前：handleSave() 直接读取本地 editingRecord（表单直接绑定它）
//   改造后：handleSave(data) 接收子组件传回的数据
//
// 好处：父组件不感知表单的中间编辑状态，
//        只在用户确认保存时才收到最终数据
async function handleSave(data: TableRecord) {
  if (data.id === 0) {
    // --- 新增 ---
    const created = await tableApi.createRecord({
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      created: new Date().toISOString().slice(0, 10),
    })
    records.value.unshift(created)
  } else {
    // --- 更新 ---
    const updated = await tableApi.updateRecord(data.id, data)
    const idx = records.value.findIndex((r) => r.id === data.id)
    if (idx > -1) records.value.splice(idx, 1, updated)
  }
  // 子组件已通过 v-model:open 自动关闭弹窗（emit('update:open', false) 在子组件 onOk 之后由 modal 触发）
  // 实际上这里需要手动关闭：子组件的 handleOk emit save 后，父组件处理完需要关闭
  // 看 TableFormModal：handleOk 只 emit save，没有 emit update:open
  // a-modal 的 @ok 会关闭弹窗吗？不会，需要手动关闭
  // 所以在 TableFormModal 中，应该在 emit save 后由父组件关闭
  modalVisible.value = false
  message.success(t('common.success'))
}

// ============================================================
// 删除操作
// ============================================================
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

    <!--
      ============================================================
      子组件声明式用法（推荐模式）

      数据流拆解：
        父 → 子 (Props):
          :record="editingRecord"    → 编辑数据流入子组件
          :title="modalTitle"        → 标题流入子组件

        子 → 父 (Emits):
          @save="handleSave"         → 子组件通知父组件保存

        双向绑定 (v-model):
          v-model:open="modalVisible"
          → 父组件改 modalVisible → 子组件 open prop 自动更新
          → 子组件 emit('update:open', val) → 父组件 modalVisible 自动同步
      ============================================================
    -->
    <TableFormModal
      v-model:open="modalVisible"
      :title="modalTitle"
      :record="editingRecord"
      @save="handleSave"
    />
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
