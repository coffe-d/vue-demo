<!--
  菜单管理 — 树形表格，支持增删改
  功能：树形展示、新增子菜单、编辑、删除、图标选择
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import type { SysMenu } from '@/types'
import {
  getMenuTree, getMenuList,
  createMenu, updateMenu, deleteMenu,
} from '@/api/system'

const { t } = useI18n()

const loading = ref(false)
const menuList = ref<SysMenu[]>([])
const flatMenuList = ref<SysMenu[]>([]) // 父菜单下拉用（只含 menu 类型）

// 表单弹窗
const modalVisible = ref(false)
const modalTitle = ref('')
const isEdit = ref(false)
const formRef = ref()
const formData = reactive<Partial<SysMenu>>({
  parentId: null, name: '', path: '', component: '',
  icon: 'MenuOutlined', type: 'menu', permission: '', sort: 0,
})

// 常用图标
const iconOptions = [
  'HomeOutlined', 'SettingOutlined', 'MenuOutlined', 'BookOutlined',
  'UserOutlined', 'TeamOutlined', 'FileTextOutlined', 'AppstoreOutlined',
  'DashboardOutlined', 'TableOutlined', 'FormOutlined', 'CheckSquareOutlined',
  'ClockCircleOutlined', 'DatabaseOutlined', 'ApiOutlined', 'ThunderboltOutlined',
]

const columns = [
  { title: t('system.menu.menuName'), dataIndex: 'name', width: 200 },
  { title: t('system.menu.menuIcon'), dataIndex: 'icon', width: 80 },
  { title: t('system.menu.menuType'), dataIndex: 'type', width: 80 },
  { title: t('system.menu.routePath'), dataIndex: 'path', width: 180 },
  { title: t('system.menu.permission'), dataIndex: 'permission', width: 180 },
  { title: t('system.menu.sort'), dataIndex: 'sort', width: 60 },
  { title: t('common.actions'), key: 'actions', width: 200, fixed: 'right' as const },
]

async function loadData() {
  loading.value = true
  try {
    menuList.value = await getMenuTree()
    flatMenuList.value = await getMenuList()
  } finally {
    loading.value = false
  }
}

function handleAdd(parentId: number | null = null) {
  isEdit.value = false
  modalTitle.value = t('common.add')
  Object.assign(formData, {
    id: undefined, parentId, name: '', path: '', component: '',
    icon: 'MenuOutlined', type: 'menu', permission: '', sort: 0,
  })
  modalVisible.value = true
}

function handleEdit(record: SysMenu) {
  isEdit.value = true
  modalTitle.value = t('common.edit')
  Object.assign(formData, { ...record })
  modalVisible.value = true
}

async function handleDelete(record: SysMenu) {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: `确定删除菜单「${record.name}」？若有子菜单将一并删除。`,
    onOk: async () => {
      await deleteMenu(record.id)
      message.success(t('common.success'))
      loadData()
    },
  })
}

async function handleSubmit() {
  await formRef.value?.validate()
  const data = { ...formData }
  if (isEdit.value && formData.id) {
    await updateMenu(formData.id, data)
  } else {
    await createMenu(data)
  }
  message.success(t('common.success'))
  modalVisible.value = false
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="menu-manage">
    <div class="page-header">
      <h3>{{ t('menu.menuManage') }}</h3>
      <a-space>
        <a-button type="primary" @click="handleAdd(null)">
          {{ t('common.add') }}
        </a-button>
      </a-space>
    </div>

    <a-table
      :columns="columns"
      :dataSource="menuList"
      :loading="loading"
      rowKey="id"
      :pagination="false"
      :defaultExpandAllRows="true"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <a-space size="small">
            <a-button type="link" size="small" @click="handleEdit(record)">{{ t('common.edit') }}</a-button>
            <a-button
              v-if="record.type === 'menu'"
              type="link" size="small" @click="handleAdd(record.id)"
            >添加子菜单</a-button>
            <a-button type="link" size="small" danger @click="handleDelete(record)">{{ t('common.delete') }}</a-button>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'icon'">
          <span>{{ record.icon }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'type'">
          <a-tag :color="record.type === 'menu' ? 'blue' : 'green'">
            {{ record.type === 'menu' ? t('system.menu.typeMenu') : t('system.menu.typeButton') }}
          </a-tag>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      width="600px"
    >
      <a-form ref="formRef" :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="t('system.menu.parentMenu')" name="parentId">
          <a-tree-select
            v-model:value="formData.parentId"
            :treeData="menuList"
            :fieldNames="{ label: 'name', value: 'id', children: 'children' }"
            :placeholder="t('system.menu.rootMenu')"
            :allowClear="true"
            treeDefaultExpandAll
          />
        </a-form-item>
        <a-form-item :label="t('system.menu.menuName')" name="name" :rules="[{ required: true, message: '请输入菜单名称' }]">
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item :label="t('system.menu.menuType')" name="type">
          <a-radio-group v-model:value="formData.type">
            <a-radio value="menu">{{ t('system.menu.typeMenu') }}</a-radio>
            <a-radio value="button">{{ t('system.menu.typeButton') }}</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="formData.type === 'menu'" :label="t('system.menu.routePath')" name="path">
          <a-input v-model:value="formData.path" placeholder="/system/xxx" />
        </a-form-item>
        <a-form-item :label="t('system.menu.menuIcon')" name="icon">
          <a-select v-model:value="formData.icon" showSearch>
            <a-select-option v-for="icon in iconOptions" :key="icon" :value="icon">{{ icon }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('system.menu.permission')" name="permission">
          <a-input v-model:value="formData.permission" placeholder="如: system:menu:add" />
        </a-form-item>
        <a-form-item :label="t('system.menu.sort')" name="sort">
          <a-input-number v-model:value="formData.sort" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
</style>
