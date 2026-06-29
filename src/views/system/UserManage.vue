<!--
  用户管理 — 分页表格，增删改查，状态切换，角色分配
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import type { SysUser, SysRole } from '@/types'
import { getUserList, createUser, updateUser, deleteUser } from '@/api/system'
import { getRoleList } from '@/api/system'

const { t } = useI18n()

const loading = ref(false)
const userList = ref<SysUser[]>([])
const roleList = ref<SysRole[]>([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

// 搜索
const searchForm = reactive({ username: '', nickname: '', status: undefined as string | undefined })

// 表单弹窗
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const formData = reactive<Partial<SysUser & { password: string }>>({
  username: '', nickname: '', email: '', phone: '',
  roleId: 2, status: 'enabled', password: '',
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: t('system.user.username'), dataIndex: 'username', width: 120 },
  { title: t('system.user.nickname'), dataIndex: 'nickname', width: 120 },
  { title: t('system.user.email'), dataIndex: 'email', width: 200 },
  { title: t('system.user.phone'), dataIndex: 'phone', width: 140 },
  { title: t('system.user.role'), dataIndex: 'roleName', width: 120 },
  { title: t('common.status'), dataIndex: 'status', width: 80 },
  { title: t('system.user.lastLogin'), dataIndex: 'lastLoginTime', width: 180 },
  { title: t('common.actions'), key: 'actions', width: 200, fixed: 'right' as const },
]

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: pagination.current, pageSize: pagination.pageSize }
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.nickname) params.nickname = searchForm.nickname
    if (searchForm.status) params.status = searchForm.status
    const result = await getUserList(params)
    userList.value = result.items
    pagination.total = result.total
  } finally { loading.value = false }
}

async function loadRoles() {
  roleList.value = await getRoleList()
}

function handlePageChange(page: number, pageSize: number) {
  pagination.current = page
  pagination.pageSize = pageSize
  loadData()
}

function handleSearch() { pagination.current = 1; loadData() }
function handleReset() {
  searchForm.username = ''
  searchForm.nickname = ''
  searchForm.status = undefined
  pagination.current = 1
  loadData()
}

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, { id: undefined, username: '', nickname: '', email: '', phone: '', roleId: 2, status: 'enabled', password: '' })
  modalVisible.value = true
}

function handleEdit(record: SysUser) {
  isEdit.value = true
  Object.assign(formData, { ...record, password: '' })
  modalVisible.value = true
}

async function handleDelete(record: SysUser) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: `确定删除用户「${record.nickname || record.username}」？`,
    onOk: async () => { await deleteUser(record.id); message.success(t('common.success')); loadData() },
  })
}

async function handleToggleStatus(record: SysUser) {
  const newStatus = record.status === 'enabled' ? 'disabled' : 'enabled'
  await updateUser(record.id, { status: newStatus } as Partial<SysUser>)
  message.success(t('common.success'))
  loadData()
}

async function handleSubmit() {
  await formRef.value?.validate()
  if (isEdit.value && formData.id) {
    const { password, ...data } = formData
    await updateUser(formData.id, data as Partial<SysUser>)
  } else {
    await createUser(formData)
  }
  message.success(t('common.success'))
  modalVisible.value = false
  loadData()
}

onMounted(() => { loadData(); loadRoles() })
</script>

<template>
  <div class="user-manage">
    <div class="page-header">
      <h3>{{ t('menu.userManage') }}</h3>
      <a-button type="primary" @click="handleAdd">{{ t('common.add') }}</a-button>
    </div>

    <!-- 搜索区域 -->
    <a-card size="small" class="search-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item :label="t('system.user.username')">
          <a-input v-model:value="searchForm.username" placeholder="请输入用户名" allowClear />
        </a-form-item>
        <a-form-item :label="t('system.user.nickname')">
          <a-input v-model:value="searchForm.nickname" placeholder="请输入昵称" allowClear />
        </a-form-item>
        <a-form-item :label="t('common.status')">
          <a-select v-model:value="searchForm.status" placeholder="全部" allowClear style="width: 120px">
            <a-select-option value="enabled">启用</a-select-option>
            <a-select-option value="disabled">禁用</a-select-option>
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
      :dataSource="userList"
      :loading="loading"
      :pagination="{ ...pagination, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
      rowKey="id"
      size="small"
      @change="({ current, pageSize }: any) => handlePageChange(current, pageSize)"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <a-space size="small">
            <a-button type="link" size="small" @click="handleEdit(record)">{{ t('common.edit') }}</a-button>
            <a-button
              type="link" size="small"
              :danger="record.status === 'enabled'"
              @click="handleToggleStatus(record)"
            >{{ record.status === 'enabled' ? '禁用' : '启用' }}</a-button>
            <a-popconfirm :title="t('common.deleteConfirm')" @confirm="handleDelete(record)">
              <a-button type="link" size="small" danger>{{ t('common.delete') }}</a-button>
            </a-popconfirm>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 'enabled' ? 'green' : 'red'">
            {{ record.status === 'enabled' ? '启用' : '禁用' }}
          </a-tag>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="isEdit ? t('common.edit') : t('common.add')" @ok="handleSubmit" width="560px">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="t('system.user.username')" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="formData.username" :disabled="isEdit" />
        </a-form-item>
        <a-form-item :label="t('system.user.nickname')" name="nickname" :rules="[{ required: true, message: '请输入昵称' }]">
          <a-input v-model:value="formData.nickname" />
        </a-form-item>
        <a-form-item v-if="!isEdit" :label="t('system.user.password')" name="password" :rules="[{ required: !isEdit, message: '请输入密码' }]">
          <a-input-password v-model:value="formData.password" />
        </a-form-item>
        <a-form-item :label="t('system.user.email')" name="email">
          <a-input v-model:value="formData.email" />
        </a-form-item>
        <a-form-item :label="t('system.user.phone')" name="phone">
          <a-input v-model:value="formData.phone" />
        </a-form-item>
        <a-form-item :label="t('system.user.role')" name="roleId" :rules="[{ required: true, message: '请选择角色' }]">
          <a-select v-model:value="formData.roleId" placeholder="请选择角色">
            <a-select-option v-for="r in roleList" :key="r.id" :value="r.id">{{ r.roleName }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('common.status')" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="enabled">启用</a-radio>
            <a-radio value="disabled">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.search-card { margin-bottom: 16px; }
</style>
