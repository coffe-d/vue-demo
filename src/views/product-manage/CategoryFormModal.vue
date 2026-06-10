<!--
  CategoryFormModal.vue — 分类新增/编辑弹窗
  ============================================
  架构角色：受控弹窗组件（Controlled Modal）
  - 接收 visible / mode 控制弹窗开关
  - 通过 saved / deleted 事件将操作交给父组件处理
  - 不自行调用 API，保持组件纯粹性

  新增流程：TreeSelect 直接选择父分类（树形展示），
  层级自动推导 — 不选=一级，选一级父=二级，选二级父=三级，
  三级节点不可选（已达最大深度）。

  Props:  visible, mode, editId, editName, parentId, categories
  Emits:  update:visible, saved, deleted
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { ProductCategory } from '@/types'

// ===== Props =====
const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  editId: number | null
  editName: string
  /** 新增时预选的父级分类 ID（侧边栏右键添加子分类等场景） */
  parentId: number | null
  /** 全部分类树 */
  categories: ProductCategory[]
}>()

// ===== Emits =====
const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: [data: { name: string; parentId: number | null; level: number; id?: number }]
  deleted: [id: number]
}>()

// ===== 内部状态 =====
const formName = ref('')
const selectedParentId = ref<number | null>(null)
const submitting = ref(false)

// ===== 计算属性 =====

/** 将 ProductCategory 树转为 a-tree-select 的 tree-data 格式 */
const treeData = computed(() => {
  function convert(cats: ProductCategory[]): any[] {
    return cats.map((c) => ({
      value: c.id,
      title: c.name,
      disabled: c.level >= 3, // 三级分类不可作为父节点
      children: c.children?.length ? convert(c.children) : undefined,
    }))
  }
  return convert(props.categories)
})

/** 从树中查找分类节点 */
function findCat(id: number, cats: ProductCategory[]): ProductCategory | undefined {
  for (const c of cats) {
    if (c.id === id) return c
    if (c.children) {
      const found = findCat(id, c.children)
      if (found) return found
    }
  }
  return undefined
}

/** 根据选中的父分类自动计算层级 */
const computedLevel = computed(() => {
  if (!selectedParentId.value) return 1
  const parent = findCat(selectedParentId.value, props.categories)
  return parent ? Math.min(parent.level + 1, 3) : 1
})

// ===== 监视器 =====

watch(
  () => [props.visible, props.mode, props.editName, props.parentId] as const,
  ([visible, mode, editName, parentId]) => {
    if (!visible) return
    if (mode === 'edit') {
      formName.value = editName
    } else {
      formName.value = ''
      selectedParentId.value = parentId
    }
  },
  { immediate: true },
)

// ===== 方法 =====
function close() {
  emit('update:visible', false)
}

function handleOk() {
  if (!formName.value.trim()) {
    message.warning('请输入分类名称')
    return
  }
  submitting.value = true
  const data: { name: string; parentId: number | null; level: number; id?: number } = {
    name: formName.value.trim(),
    parentId: props.mode === 'create' ? selectedParentId.value : null,
    level: computedLevel.value,
  }
  if (props.mode === 'edit' && props.editId) {
    data.id = props.editId
  }
  emit('saved', data)
}

function handleDelete() {
  if (props.editId) {
    emit('deleted', props.editId)
  }
}

function done() {
  submitting.value = false
}

defineExpose({ done })
</script>

<template>
  <a-modal
    :open="visible"
    :title="mode === 'create' ? '新增分类' : '编辑分类'"
    width="400px"
    :confirm-loading="submitting"
    @ok="handleOk"
    @cancel="close"
  >
    <a-form layout="vertical">
      <!-- 分类名称 -->
      <a-form-item label="分类名称" required>
        <a-input v-model:value="formName" placeholder="请输入分类名称" />
      </a-form-item>

      <!-- 新增模式：树形选择父分类 -->
      <a-form-item v-if="mode === 'create'" label="父级分类">
        <a-tree-select
          v-model:value="selectedParentId"
          :tree-data="treeData"
          :placeholder="selectedParentId ? '' : '留空则创建一级分类'"
          allow-clear
          tree-default-expand-all
          style="width: 100%"
        />
        <div style="color: #999; font-size: 12px; margin-top: 4px">
          <template v-if="selectedParentId">
            将创建 <strong>{{ computedLevel }}</strong> 级分类
          </template>
          <template v-else>
            不选父级则创建一级分类，三级分类不可作为父级
          </template>
        </div>
      </a-form-item>
    </a-form>

    <!-- 编辑模式底部 -->
    <template v-if="mode === 'edit'" #footer>
      <a-button @click="close">取消</a-button>
      <a-space>
        <a-popconfirm title="删除分类将一并删除子分类，确定？" @confirm="handleDelete">
          <a-button danger>删除</a-button>
        </a-popconfirm>
        <a-button type="primary" :loading="submitting" @click="handleOk">保存</a-button>
      </a-space>
    </template>
  </a-modal>
</template>
<style scoped>
@import '../../styles/product.less';
</style>
