<!--
  角色管理 — 角色表格，增删改查，菜单权限分配
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import type { SysRole, SysMenu } from '@/types'
import { getRoleList, createRole, updateRole, deleteRole } from '@/api/system'
import { getMenuTree } from '@/api/system'

const { t } = useI18n()

const loading = ref(false)
const roleList = ref<SysRole[]>([])

// 表单弹窗
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const formData = reactive<Partial<SysRole>>({
  roleName: '', roleCode: '', description: '', status: 'enabled', menuIds: [],
})

// 权限分配弹窗
const permVisible = ref(false)
const permRoleId = ref<number>()
const permRoleName = ref('')
const menuTree = ref<SysMenu[]>([])
const checkedMenuIds = ref<number[]>([])

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: t('system.role.roleName'), dataIndex: 'roleName', width: 150 },
  { title: t('system.role.roleCode'), dataIndex: 'roleCode', width: 150 },
  { title: t('system.role.description'), dataIndex: 'description' },
  { title: t('common.status'), dataIndex: 'status', width: 80 },
  { title: t('common.createTime'), dataIndex: 'createdAt', width: 180 },
  { title: t('common.actions'), key: 'actions', width: 260, fixed: 'right' as const },
]

async function loadData() {
  loading.value = true
  try { roleList.value = await getRoleList() } finally { loading.value = false }
}

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, { id: undefined, roleName: '', roleCode: '', description: '', status: 'enabled', menuIds: [] })
  modalVisible.value = true
}

function handleEdit(record: SysRole) {
  isEdit.value = true
  Object.assign(formData, { ...record })
  modalVisible.value = true
}

async function handleDelete(record: SysRole) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: `确定删除角色「${record.roleName}」？`,
    onOk: async () => { await deleteRole(record.id); message.success(t('common.success')); loadData() },
  })
}

async function handleSubmit() {
  await formRef.value?.validate()
  if (isEdit.value && formData.id) {
    await updateRole(formData.id, formData)
  } else {
    await createRole(formData)
  }
  message.success(t('common.success'))
  modalVisible.value = false
  loadData()
}

// ===== 权限分配 =====
async function handleAssignPerm(record: SysRole) {
  permRoleId.value = record.id
  permRoleName.value = record.roleName
  checkedMenuIds.value = [...record.menuIds]
  menuTree.value = await getMenuTree()
  permVisible.value = true
}

async function handlePermSave() {
  if (permRoleId.value) {
    await updateRole(permRoleId.value, { menuIds: checkedMenuIds.value } as Partial<SysRole>)
    message.success(t('common.success'))
    permVisible.value = false
    loadData()
  }
}

onMounted(loadData)
</script>

<template>
  <div class="role-manage">
    <div class="page-header">
      <h3>{{ t('menu.roleManage') }}</h3>
      <a-button type="primary" @click="handleAdd">{{ t('common.add') }}</a-button>
    </div>

    <a-table
      :columns="columns"
      :dataSource="roleList"
      :loading="loading"
      :pagination="false"
      rowKey="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <a-space size="small">
            <a-button type="link" size="small" @click="handleEdit(record)">{{ t('common.edit') }}</a-button>
            <a-button type="link" size="small" @click="handleAssignPerm(record)">
              {{ t('system.role.assignPermission') }}
            </a-button>
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
    <a-modal v-model:open="modalVisible" :title="isEdit ? t('common.edit') : t('common.add')" @ok="handleSubmit">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="t('system.role.roleName')" name="roleName" :rules="[{ required: true, message: '请输入角色名称' }]">
          <a-input v-model:value="formData.roleName" />
        </a-form-item>
        <a-form-item :label="t('system.role.roleCode')" name="roleCode" :rules="[{ required: true, message: '请输入角色编码' }]">
          <a-input v-model:value="formData.roleCode" :disabled="isEdit" />
        </a-form-item>
        <a-form-item :label="t('system.role.description')" name="description">
          <a-textarea v-model:value="formData.description" :rows="3" />
        </a-form-item>
        <a-form-item :label="t('common.status')" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio value="enabled">启用</a-radio>
            <a-radio value="disabled">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 权限分配弹窗 -->
    <a-modal
      v-model:open="permVisible"
      :title="`${t('system.role.assignPermission')} — ${permRoleName}`"
      @ok="handlePermSave"
      width="500px"
    >
      <a-tree
        v-model:checkedKeys="checkedMenuIds"
        :treeData="menuTree"
        :fieldNames="{ title: 'name', key: 'id', children: 'children' }"
        checkable
        defaultExpandAll
      />
    </a-modal>
  </div>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
</style>
