<!--
  日志管理 — 只读表格，搜索/筛选，详情查看，清空日志
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import type { SysLog, LogQueryParams } from '@/types'
import { getLogList, getLogDetail, clearLogs } from '@/api/system'

const { t } = useI18n()

const loading = ref(false)
const logList = ref<SysLog[]>([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

// 搜索
const searchForm = reactive<LogQueryParams>({
  username: '', module: '', action: '', status: undefined,
})

// 详情弹窗
const detailVisible = ref(false)
const currentLog = ref<SysLog | null>(null)

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: t('system.user.username'), dataIndex: 'username', width: 100 },
  { title: t('system.log.module'), dataIndex: 'module', width: 100 },
  { title: t('system.log.action'), dataIndex: 'action', width: 80 },
  { title: t('system.log.description'), dataIndex: 'description', width: 200, ellipsis: true },
  { title: t('system.log.requestMethod'), dataIndex: 'method', width: 70 },
  { title: t('system.log.ip'), dataIndex: 'ip', width: 130 },
  { title: t('system.log.duration'), dataIndex: 'duration', width: 80 },
  { title: t('common.status'), dataIndex: 'status', width: 70 },
  { title: t('common.createTime'), dataIndex: 'createdAt', width: 170 },
  { title: t('common.actions'), key: 'actions', width: 80, fixed: 'right' as const },
]

const actionOptions = ['create', 'update', 'delete', 'query', 'login', 'export']

async function loadData() {
  loading.value = true
  try {
    const params: LogQueryParams = { page: pagination.current, pageSize: pagination.pageSize }
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.module) params.module = searchForm.module
    if (searchForm.action) params.action = searchForm.action
    if (searchForm.status) params.status = searchForm.status
    const result = await getLogList(params)
    logList.value = result.items
    pagination.total = result.total
  } finally { loading.value = false }
}

function handlePageChange(page: number, pageSize: number) {
  pagination.current = page; pagination.pageSize = pageSize; loadData()
}

function handleSearch() { pagination.current = 1; loadData() }
function handleReset() {
  searchForm.username = ''; searchForm.module = ''; searchForm.action = ''; searchForm.status = undefined
  pagination.current = 1; loadData()
}

async function handleDetail(record: SysLog) {
  currentLog.value = await getLogDetail(record.id)
  detailVisible.value = true
}

async function handleClear() {
  Modal.confirm({
    title: '清空日志',
    content: '确定要清空所有操作日志吗？此操作不可恢复！',
    onOk: async () => {
      await clearLogs()
      message.success('日志已清空')
      loadData()
    },
  })
}

onMounted(loadData)
</script>

<template>
  <div class="log-manage">
    <div class="page-header">
      <h3>{{ t('menu.logManage') }}</h3>
      <a-button danger @click="handleClear">清空日志</a-button>
    </div>

    <!-- 搜索区域 -->
    <a-card size="small" class="search-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item :label="t('system.user.username')">
          <a-input v-model:value="searchForm.username" placeholder="请输入用户名" allowClear style="width: 140px" />
        </a-form-item>
        <a-form-item :label="t('system.log.module')">
          <a-input v-model:value="searchForm.module" placeholder="请输入模块" allowClear style="width: 140px" />
        </a-form-item>
        <a-form-item :label="t('system.log.action')">
          <a-select v-model:value="searchForm.action" placeholder="全部" allowClear style="width: 120px">
            <a-select-option v-for="a in actionOptions" :key="a" :value="a">{{ t(`system.log.${a}`) }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('common.status')">
          <a-select v-model:value="searchForm.status" placeholder="全部" allowClear style="width: 100px">
            <a-select-option value="success">成功</a-select-option>
            <a-select-option value="fail">失败</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">{{ t('common.search') }}</a-button>
            <a-button @click="handleReset">{{ t('common.reset') }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-table
      :columns="columns"
      :dataSource="logList"
      :loading="loading"
      :pagination="{ ...pagination, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
      :scroll="{ x: 1300 }"
      rowKey="id"
      size="small"
      @change="({ current, pageSize }: any) => handlePageChange(current, pageSize)"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <a-button type="link" size="small" @click="handleDetail(record)">{{ t('common.detail') }}</a-button>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <a-tag>{{ t(`system.log.${record.action}`) }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 'success' ? 'green' : 'red'">
            {{ record.status === 'success' ? '成功' : '失败' }}
          </a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'duration'">
          <span :style="{ color: record.duration > 200 ? '#ff4d4f' : '#52c41a' }">{{ record.duration }}ms</span>
        </template>
      </template>
    </a-table>

    <!-- 详情弹窗 -->
    <a-modal v-model:open="detailVisible" title="日志详情" :footer="null" width="700px">
      <a-descriptions v-if="currentLog" :column="2" bordered size="small">
        <a-descriptions-item label="ID">{{ currentLog.id }}</a-descriptions-item>
        <a-descriptions-item :label="t('system.user.username')">{{ currentLog.username }}</a-descriptions-item>
        <a-descriptions-item :label="t('system.log.module')">{{ currentLog.module }}</a-descriptions-item>
        <a-descriptions-item :label="t('system.log.action')">
          <a-tag>{{ t(`system.log.${currentLog.action}`) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="t('system.log.description')" :span="2">{{ currentLog.description }}</a-descriptions-item>
        <a-descriptions-item :label="t('system.log.requestMethod')">{{ currentLog.method }}</a-descriptions-item>
        <a-descriptions-item :label="t('system.log.requestUrl')">{{ currentLog.requestUrl }}</a-descriptions-item>
        <a-descriptions-item :label="t('system.log.ip')">{{ currentLog.ip }}</a-descriptions-item>
        <a-descriptions-item :label="t('system.log.duration')">
          <span :style="{ color: currentLog.duration > 200 ? '#ff4d4f' : '#52c41a' }">{{ currentLog.duration }}ms</span>
        </a-descriptions-item>
        <a-descriptions-item label="请求参数" :span="2">
          <pre style="max-height: 200px; overflow: auto; margin: 0; font-size: 12px;">{{ currentLog.requestParams }}</pre>
        </a-descriptions-item>
        <a-descriptions-item v-if="currentLog.errorMsg" :label="t('system.log.errorMsg')" :span="2">
          <span style="color: #ff4d4f">{{ currentLog.errorMsg }}</span>
        </a-descriptions-item>
        <a-descriptions-item :label="t('common.createTime')">{{ currentLog.createdAt }}</a-descriptions-item>
        <a-descriptions-item :label="t('common.status')">
          <a-tag :color="currentLog.status === 'success' ? 'green' : 'red'">
            {{ currentLog.status === 'success' ? '成功' : '失败' }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.search-card { margin-bottom: 16px; }
</style>
