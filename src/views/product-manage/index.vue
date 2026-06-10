<!--
  ProductManage (index.vue) — 产品基础信息管理·编排器页面
  ============================================================
  架构角色：本组件是"产品基础信息"功能模块的顶层编排器（Orchestrator），
  负责协调多个子组件协作完成以下业务：

  业务功能：
  1. 产品档案管理 — 产品的增删改查、分页列表、列自定义
  2. 分类树管理 — 三级分类增删改、展开/收起、拖拽产品到分类
  3. 拖拽排序   — 拖拽表格行调整产品展示顺序（持久化到后端）
  4. 框选批量   — 鼠标拖拽框选表格行，批量移动分类
  5. 右键菜单   — 产品行右键：编辑/移动分类/删除，支持批量模式
  6. 价格面板   — 选中产品后展开底部价格详情面板

  子组件树：
  ├── ProductCategoryPanel   — 左侧分类侧边栏（展示/交互）
  ├── ProductBoxSelect       — 框选批量操作（重叠层 + 批量栏）
  ├── ProductFormModal       — 新增/编辑产品弹窗
  ├── CategoryFormModal      — 新增/编辑分类弹窗
  └── ProductPricePanel      — 选中产品的价格详情面板
-->
<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { productApi } from '@/api/product'
import type { ProductRecord, ProductCategory } from '@/types'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SettingOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExportOutlined, ShoppingOutlined,
} from '@ant-design/icons-vue'
import ProductCategoryPanel from '@/components/ProductCategoryPanel.vue'
import ProductFormModal from './ProductFormModal.vue'
import CategoryFormModal from './CategoryFormModal.vue'
import ProductBoxSelect from './ProductBoxSelect.vue'
import ProductPricePanel from '@/components/ProductPricePanel.vue'

// ============================================================
// 1. 响应式状态 — 页面级数据源
// ============================================================

const loading = ref(false)
const categories = ref<ProductCategory[]>([])
const products = ref<ProductRecord[]>([])
const selectedCategoryId = ref<number | undefined>(undefined)
const expandedKeys = ref<number[]>([])
const totalProducts = ref(0)

// ---- 搜索 & 分页 ----
const keyword = ref('')
const pagination = reactive({
  current: 1, pageSize: 15, total: 0,
})

const selectedProduct = ref<ProductRecord | null>(null)

// ---- 拖拽排序 ----
const dragState = reactive({
  draggingId: null as number | null,
  overId: null as number | null,
  overPosition: null as 'before' | 'after' | null,
})

// ---- 右键菜单 ----
const contextMenu = reactive({
  visible: false,
  x: 0, y: 0,
  product: null as ProductRecord | null,
})

// ---- 框选批量（v-model 同步给 ProductBoxSelect） ----
const selectedRowKeys = ref<number[]>([])

function isRowSelected(id: number) {
  return selectedRowKeys.value.includes(id)
}

function clearRowSelection() {
  selectedRowKeys.value = []
}

// ---- 产品表单弹窗 ----
const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingProduct = ref<ProductRecord | null>(null)

// ---- 列自定义 ----
const allColumns = [
  { key: 'code', title: '产品编码', defaultVisible: true },
  { key: 'name', title: '产品名称', defaultVisible: true },
  { key: 'spec', title: '规格', defaultVisible: true },
  { key: 'unit', title: '单位', defaultVisible: true },
  { key: 'lastPurchasePrice', title: '最后进价', defaultVisible: true },
  { key: 'freightAllocation', title: '运费分摊', defaultVisible: false },
  { key: 'purchasePriceWithFreight', title: '含运费进价', defaultVisible: true },
  { key: 'costPrice', title: '成本价', defaultVisible: false },
  { key: 'stock', title: '库存', defaultVisible: true },
  { key: 'status', title: '状态', defaultVisible: true },
  { key: 'remark', title: '备注', defaultVisible: false },
  { key: 'createdAt', title: '创建日期', defaultVisible: false },
]

const visibleColumnKeys = ref<string[]>(
  allColumns.filter((c) => c.defaultVisible).map((c) => c.key),
)

// ---- 分类弹窗 ----
const catFormVisible = ref(false)
const catFormMode = ref<'create' | 'edit'>('create')
const catParentId = ref<number | null>(null)
const catEditId = ref<number | null>(null)
const catEditName = ref('')

// ============================================================
// 2. 计算属性
// ============================================================

// API 已返回树形结构，无需前端再 buildTree
const categoryTree = computed(() => categories.value)

const visibleCategoryItems = computed(() => {
  const items: { cat: ProductCategory; level: number }[] = []
  
  for (const cat of categoryTree.value) {
    items.push({ cat, level: 1 })
    if (expandedKeys.value.includes(cat.id) && cat.children) {
      for (const sub of cat.children) {
        items.push({ cat: sub, level: 2 })
        if (expandedKeys.value.includes(sub.id) && sub.children) {
          for (const child of sub.children) {
            items.push({ cat: child, level: 3 })
          }
        }
      }
    }
  }
  
  return items
})

const categoryFlatList = computed(() => {
  const result: { id: number; label: string; level: number }[] = []
  function walk(cats: ProductCategory[], level: number) {
    for (const c of cats) {
      result.push({ id: c.id, label: c.name, level })
      if (c.children) walk(c.children, level + 1)
    }
  }
  walk(categoryTree.value, 0)
  return result
})

const cascaderOptions = computed(() => {
  function convert(cats: ProductCategory[]): any[] {
    return cats.map((c) => ({
      value: c.id,
      label: c.name,
      children: c.children?.length ? convert(c.children) : undefined,
    }))
  }
  return convert(categoryTree.value)
})

const tableColumns = computed(() => {
  const cols: any[] = [
    { title: '序号', key: 'index', width: 56, align: 'center', fixed: 'left' },
  ]
  const colDefs: Record<string, any> = {
    code: { title: '产品编码', width: 130 },
    name: { title: '产品名称', width: 200, ellipsis: true },
    spec: { title: '规格', width: 130 },
    unit: { title: '单位', width: 60, align: 'center' },
    lastPurchasePrice: { title: '最后进价', width: 110, align: 'right' },
    freightAllocation: { title: '运费分摊', width: 100, align: 'right' },
    purchasePriceWithFreight: { title: '含运费进价', width: 120, align: 'right' },
    costPrice: { title: '成本价', width: 110, align: 'right' },
    stock: {
      title: '库存', width: 80, align: 'right',
      sorter: (a: ProductRecord, b: ProductRecord) => a.stock - b.stock,
    },
    status: { title: '状态', width: 80, align: 'center' },
    remark: { title: '备注', width: 150, ellipsis: true },
    createdAt: { title: '创建日期', width: 110 },
  }
  for (const key of visibleColumnKeys.value) {
    if (colDefs[key]) cols.push({ ...colDefs[key], dataIndex: key, key })
  }
  cols.push({ title: '操作', key: 'actions', width: 120, align: 'center', fixed: 'right' })
  return cols
})

const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return '全部产品'
  return categories.value.find((c) => c.id === selectedCategoryId.value)?.name ?? '全部产品'
})

const tablePagination = computed(() => ({
  ...pagination,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100'],
}))

const pricePanelCategoryPath = computed(() => {
  if (!selectedProduct.value) return ''
  return getCategoryPath(selectedProduct.value.categoryId)
})

// ============================================================
// 3. 数据获取
// ============================================================

async function fetchCategories() {
  const res = await productApi.getCategories()
  
  if (res.code === 0 && res.data) {
    categories.value = res.data.tree
    totalProducts.value = res.data.totalProducts
    if (expandedKeys.value.length === 0) {
      for (const c of categories.value) {
        if (!c.parentId) expandedKeys.value.push(c.id)
      }
    }
  }
}

async function fetchProducts() {
  loading.value = true
  try {
    const params: any = { page: pagination.current, pageSize: pagination.pageSize }
    if (selectedCategoryId.value) params.categoryId = selectedCategoryId.value
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const res = await productApi.getList(params)
    if (res.code === 0 && res.data) {
      products.value = res.data.list
      pagination.total = res.data.total
      // totalProducts 由 fetchCategories 独立维护，不在此处覆盖
    }
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  await Promise.all([fetchCategories(), fetchProducts()])
}

function handleSearch() {
  pagination.current = 1
  fetchProducts()
}

function handleTableChange(pag: { current: number; pageSize: number }) {
  if (pag.pageSize !== pagination.pageSize) pagination.current = 1
  else pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchProducts()
}

function onSelectChange(keys: (string | number)[]) {
  selectedRowKeys.value = keys as number[]
}

function selectCategory(id: number | undefined) {
  selectedCategoryId.value = id
  selectedProduct.value = null
  pagination.current = 1
  fetchProducts()
}

// ============================================================
// 4. 分类树操作
// ============================================================

function toggleExpand(id: number) {
  const idx = expandedKeys.value.indexOf(id)
  if (idx >= 0) expandedKeys.value.splice(idx, 1)
  else expandedKeys.value.push(id)
}

function expandAll() { expandedKeys.value = categories.value.map((c) => c.id) }
function collapseAll() { expandedKeys.value = [] }

// ---- 分类弹窗（委托给 CategoryFormModal） ----

function openCreateCatForm(parentId: number | null) {
  catFormMode.value = 'create'
  catParentId.value = parentId
  catEditId.value = null
  catEditName.value = ''
  catFormVisible.value = true
}

function handleCatContextMenu(_e: MouseEvent, cat: ProductCategory) {
  catFormMode.value = 'edit'
  catEditId.value = cat.id
  catEditName.value = cat.name
  catParentId.value = cat.parentId
  catFormVisible.value = true
}

async function handleCategorySaved(data: { name: string; parentId: number | null; level: number; id?: number }) {
  try {
    if (data.id) {
      // 编辑模式
      await productApi.updateCategory(data.id, { name: data.name })
    } else {
      // 创建模式 — 层级已由表单选择，无需前端推算
      await productApi.createCategory({
        name: data.name,
        parentId: data.parentId,
        level: data.level,
        sort: 99,
      })
    }
    catFormVisible.value = false
    await fetchCategories()
  } catch {
    message.error('操作失败')
  }
}

async function handleCategoryDeleted(id: number) {
  try {
    await productApi.deleteCategory(id)
    if (selectedCategoryId.value === id) selectedCategoryId.value = undefined
    catFormVisible.value = false
    await fetchCategories()
    await fetchProducts()
  } catch {
    message.error('删除失败')
  }
}

// ============================================================
// 5. 拖拽排序
// ============================================================

let dragLeaveTimer: ReturnType<typeof setTimeout> | null = null

function handleDragStart(e: DragEvent, product: ProductRecord) {
  dragState.draggingId = product.id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(product.id))
  }
  nextTick(() => {
    document.querySelector(`[data-row-key="${product.id}"]`)?.classList.add('pm-row-dragging')
  })
}

function handleDragOver(e: DragEvent, product: ProductRecord) {
  e.preventDefault()
  if (dragState.draggingId === product.id) return
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  if (dragLeaveTimer) { clearTimeout(dragLeaveTimer); dragLeaveTimer = null }
  dragState.overId = product.id
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  dragState.overPosition = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

function handleDragLeave() {
  dragLeaveTimer = setTimeout(() => {
    dragState.overId = null
    dragState.overPosition = null
  }, 80)
}

async function handleDrop(e: DragEvent, targetProduct: ProductRecord) {
  e.preventDefault()
  if (dragLeaveTimer) { clearTimeout(dragLeaveTimer); dragLeaveTimer = null }
  const dragId = dragState.draggingId
  const dropPos = dragState.overPosition
  dragState.draggingId = null; dragState.overId = null; dragState.overPosition = null
  if (!dragId || dragId === targetProduct.id) return

  const dragIdx = products.value.findIndex((p) => p.id === dragId)
  const targetIdx = products.value.findIndex((p) => p.id === targetProduct.id)
  if (dragIdx === -1 || targetIdx === -1) return

  const [dragged] = products.value.splice(dragIdx, 1)
  const adjustedTarget = dragIdx < targetIdx ? targetIdx - 1 : targetIdx
  const pos = dropPos === 'before' ? adjustedTarget : adjustedTarget + 1
  products.value.splice(pos, 0, dragged)

  await Promise.all(products.value.map((p, i) => productApi.updateSort(p.id, i + 1)))
  message.success('排序已更新')
}

function handleDragEnd() {
  if (dragLeaveTimer) { clearTimeout(dragLeaveTimer); dragLeaveTimer = null }
  dragState.draggingId = null; dragState.overId = null; dragState.overPosition = null
  document.querySelectorAll('.pm-row-dragging').forEach((el) => el.classList.remove('pm-row-dragging'))
}

// ---- 拖拽产品到分类 ----
function handleDragOverCat(e: DragEvent, _cat: ProductCategory) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  ;(e.currentTarget as HTMLElement).classList.add('cat-drop-target')
}

function handleDragLeaveCat(e: DragEvent) {
  ;(e.currentTarget as HTMLElement).classList.remove('cat-drop-target')
}

async function handleDropOnCat(e: DragEvent, cat: ProductCategory) {
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).classList.remove('cat-drop-target')
  const dragId = dragState.draggingId
  if (!dragId) return
  const product = products.value.find((p) => p.id === dragId)
  if (!product || product.categoryId === cat.id) return
  await productApi.moveCategory(dragId, cat.id)
  message.success(`已将「${product.name}」移至「${cat.name}」`)
  await fetchProducts()
  await fetchCategories()
}

// ============================================================
// 6. 右键菜单
// ============================================================

function handleRowContextMenu(e: MouseEvent, product: ProductRecord) {
  e.preventDefault()
  contextMenu.visible = true
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.product = product
}

function closeContextMenu() {
  contextMenu.visible = false
  contextMenu.product = null
}

async function moveProductToCategory(productId: number, categoryId: number) {
  const product = products.value.find((p) => p.id === productId)
  await productApi.moveCategory(productId, categoryId)
  message.success(`已将「${product?.name}」移至「${categories.value.find((c) => c.id === categoryId)?.name}」`)
  closeContextMenu()
  await fetchProducts()
  await fetchCategories()
}

function editFromContextMenu() {
  if (contextMenu.product) openEditForm(contextMenu.product)
  closeContextMenu()
}

async function deleteFromContextMenu() {
  if (contextMenu.product) await handleDelete(contextMenu.product.id)
  closeContextMenu()
}

function onGlobalClick() {
  if (contextMenu.visible) closeContextMenu()
}

async function batchMoveToCategory(categoryId: number) {
  if (selectedRowKeys.value.length === 0) return
  const catName = categories.value.find((c) => c.id === categoryId)?.name ?? ''
  const count = selectedRowKeys.value.length
  try {
    await Promise.all(selectedRowKeys.value.map((id) => productApi.moveCategory(id, categoryId)))
    message.success(`已将 ${count} 个产品移至「${catName}」`)
    closeContextMenu()
    clearRowSelection()
    await fetchProducts()
    await fetchCategories()
  } catch {
    message.error('批量移动失败')
  }
}

// ============================================================
// 7. 列自定义
// ============================================================

function toggleColumn(key: string, visible: boolean) {
  visibleColumnKeys.value = visible
    ? [...new Set([...visibleColumnKeys.value, key])]
    : visibleColumnKeys.value.filter((k) => k !== key)
}

function resetColumns() {
  visibleColumnKeys.value = allColumns.filter((c) => c.defaultVisible).map((c) => c.key)
}

// ============================================================
// 8. 产品 CRUD
// ============================================================

function openCreateForm() {
  formMode.value = 'create'
  editingProduct.value = null
  formVisible.value = true
}

function openEditForm(product: ProductRecord) {
  formMode.value = 'edit'
  editingProduct.value = product
  formVisible.value = true
}

async function handleFormSubmit(data: Partial<ProductRecord>) {
  try {
    if (formMode.value === 'create') {
      await productApi.create({ ...data, categoryId: selectedCategoryId.value || 1 })
      message.success('产品创建成功')
    } else if (editingProduct.value) {
      await productApi.update(editingProduct.value.id, data)
      message.success('产品更新成功')
    }
    formVisible.value = false
    await fetchProducts()
    await fetchCategories()
  } catch {
    message.error('操作失败')
  }
}

function handleFormCancel() {
  formVisible.value = false
}

async function handleDelete(id: number) {
  await productApi.delete(id)
  if (selectedProduct.value?.id === id) selectedProduct.value = null
  await fetchProducts()
  await fetchCategories()
}

// ============================================================
// 9. 产品选中 & 工具函数
// ============================================================

function selectProductRow(product: ProductRecord) {
  selectedProduct.value = selectedProduct.value?.id === product.id ? null : product
}

function getCategoryPath(categoryId: number): string {
  const parts: string[] = []
  let current = categories.value.find((c) => c.id === categoryId)
  while (current) {
    parts.unshift(current.name)
    current = current.parentId
      ? categories.value.find((c) => c.id === current!.parentId)
      : undefined
  }
  return parts.join(' > ')
}

// ============================================================
// 10. 生命周期
// ============================================================

onMounted(async () => {
  await refreshAll()
  document.addEventListener('click', onGlobalClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick)
})

watch(selectedCategoryId, () => {
  pagination.current = 1
  fetchProducts()
})
</script>

<template>
  <div class="pm-root" @click.self="selectedProduct = null">
    <!-- ===== 页头 ===== -->
    <div class="pm-header">
      <div class="pm-header--left">
        <div class="pm-header--icon"><ShoppingOutlined /></div>
        <div class="pm-header--text">
          <h1 class="pm-header--title">产品基础信息</h1>
          <span class="pm-header--sub">
            共 <strong>{{ totalProducts }}</strong> 个产品 · <strong>{{ categories.length }}</strong> 个分类
          </span>
        </div>
      </div>
      <div class="pm-header--right">
        <a-button type="text" :loading="loading" @click="refreshAll">
          <ReloadOutlined />
        </a-button>
        <a-button type="primary" @click="openCreateForm">
          <PlusOutlined /> 新增产品
        </a-button>
      </div>
    </div>

    <!-- ===== 主体布局：侧边栏 + 主内容 ===== -->
    <div class="pm-body">
      <!-- 左侧：分类面板 -->
      <ProductCategoryPanel
        :categories="categories"
        :visible-items="visibleCategoryItems"
        :selected-category-id="selectedCategoryId"
        :expanded-keys="expandedKeys"
        :total-products="totalProducts"
        @select-category="selectCategory"
        @toggle-expand="toggleExpand"
        @expand-all="expandAll"
        @collapse-all="collapseAll"
        @cat-context-menu="handleCatContextMenu"
        @drag-over-cat="handleDragOverCat"
        @drag-leave-cat="handleDragLeaveCat"
        @drop-on-cat="handleDropOnCat"
        @create-category="openCreateCatForm"
      />

      <!-- 右侧：主内容区域 -->
      <main class="pm-main">
        <!-- 工具栏 -->
        <div class="pm-toolbar">
          <div class="pm-toolbar--left">
            <a-input-search
              v-model:value="keyword"
              placeholder="搜索产品名称 / 编码…"
              style="width: 280px"
              allow-clear
              @search="handleSearch"
            >
              <template #prefix><SearchOutlined /></template>
            </a-input-search>
            <a-tag v-if="selectedCategoryId" closable color="teal" @close="selectCategory(undefined)">
              {{ selectedCategoryName }}
            </a-tag>
          </div>
          <div class="pm-toolbar--right">
            <a-popover placement="bottomRight" trigger="click" title="列设置">
              <template #content>
                <div class="pm-column-picker">
                  <a-checkbox
                    v-for="col in allColumns"
                    :key="col.key"
                    :checked="visibleColumnKeys.includes(col.key)"
                    @change="(e: any) => toggleColumn(col.key, e.target.checked)"
                  >
                    {{ col.title }}
                  </a-checkbox>
                  <a-divider style="margin: 8px 0" />
                  <a-button size="small" type="link" @click="resetColumns">恢复默认</a-button>
                </div>
              </template>
              <a-button><SettingOutlined /> 列设置</a-button>
            </a-popover>
            <a-button><ExportOutlined /> 导出</a-button>
          </div>
        </div>

        <!-- 框选组件（批量栏 + 遮罩层 + 表格区域） -->
        <ProductBoxSelect v-model="selectedRowKeys">
          <a-table
            :columns="tableColumns"
            :data-source="products"
            :loading="loading"
            :pagination="tablePagination"
            :row-key="(r: ProductRecord) => r.id"
            :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
            :row-class-name="(r: ProductRecord) => {
              const classes = []
              if (selectedProduct?.id === r.id) classes.push('pm-row-selected')
              if (isRowSelected(r.id)) classes.push('pm-row-box-selected')
              if (dragState.overId === r.id) {
                classes.push(dragState.overPosition === 'before' ? 'pm-drop-before' : 'pm-drop-after')
              }
              return classes.join(' ')
            }"
            :custom-row="(r: ProductRecord) => ({
              'data-row-key': r.id,
              onClick: () => selectProductRow(r),
              onContextmenu: (e: MouseEvent) => handleRowContextMenu(e, r),
              onDragover: (e: DragEvent) => handleDragOver(e, r),
              onDragleave: () => handleDragLeave(),
              onDrop: (e: DragEvent) => handleDrop(e, r),
            })"
            size="middle"
            :scroll="{ x: 1200 }"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">
                <span
                  class="pm-row-index"
                  draggable="true"
                  @dragstart="(e: DragEvent) => handleDragStart(e, record)"
                  @dragend="handleDragEnd"
                  @click.stop
                >
                  {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
                </span>
              </template>

              <template v-else-if="column.key === 'status'">
                <span class="pm-status" :class="record.status">
                  <CheckCircleOutlined v-if="record.status === 'active'" />
                  <CloseCircleOutlined v-else />
                  {{ record.status === 'active' ? '启用' : '停用' }}
                </span>
              </template>

              <template v-else-if="column.key === 'purchasePriceWithFreight'">
                <span class="pm-price-cell">¥{{ record.purchasePriceWithFreight.toFixed(2) }}</span>
              </template>

              <template v-else-if="column.key === 'lastPurchasePrice'">
                <span class="pm-price-sub">¥{{ record.lastPurchasePrice.toFixed(2) }}</span>
              </template>

              <template v-else-if="column.key === 'freightAllocation' || column.key === 'costPrice'">
                <span class="pm-freight-cell">¥{{ record[column.key].toFixed(2) }}</span>
              </template>

              <template v-else-if="column.key === 'actions'">
                <a-space :size="4">
                  <a-button type="text" size="small" @click.stop="openEditForm(record)">
                    <EditOutlined />
                  </a-button>
                  <a-popconfirm
                    title="确定要删除该产品吗？"
                    ok-text="确定"
cancel-text="取消"
                    @confirm="handleDelete(record.id)"
                    @click.stop
                  >
                    <a-button type="text" size="small" danger @click.stop>
                      <DeleteOutlined />
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </ProductBoxSelect>

        <!-- 价格详情面板 -->
        <ProductPricePanel
          v-if="selectedProduct"
          :product="selectedProduct"
          :category-path="pricePanelCategoryPath"
          @close="selectedProduct = null"
        />

        <!-- 空数据状态 -->
        <div v-if="!loading && products.length === 0" class="pm-empty">
          <a-empty description="暂无产品数据">
            <a-button type="primary" @click="openCreateForm">
              <PlusOutlined /> 新增第一个产品
            </a-button>
          </a-empty>
        </div>
      </main>
    </div>

    <!-- ===== 右键菜单（Teleport 到 body） ===== -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="pm-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <template v-if="selectedRowKeys.length <= 1 || !isRowSelected(contextMenu.product!.id)">
          <div class="pm-ctx-item" @click="editFromContextMenu">
            <EditOutlined /> 编辑产品
          </div>
          <div class="pm-ctx-divider" ></div>
          <div class="pm-ctx-label">移动到分类</div>
          <div
            v-for="cat in categoryFlatList"
            :key="cat.id"
            class="pm-ctx-item"
            :style="{ paddingLeft: 12 + cat.level * 16 + 'px' }"
            @click="moveProductToCategory(contextMenu.product!.id, cat.id)"
          >
            {{ cat.label }}
          </div>
          <div class="pm-ctx-divider" ></div>
          <div class="pm-ctx-item pm-ctx-item--danger" @click="deleteFromContextMenu">
            <DeleteOutlined /> 删除产品
          </div>
        </template>

        <template v-else>
          <div class="pm-ctx-label">已选择 {{ selectedRowKeys.length }} 个产品</div>
          <div class="pm-ctx-label">批量移动到分类</div>
          <div
            v-for="cat in categoryFlatList"
            :key="cat.id"
            class="pm-ctx-item"
            :style="{ paddingLeft: 12 + cat.level * 16 + 'px' }"
            @click="batchMoveToCategory(cat.id)"
          >
            {{ cat.label }}
          </div>
          <div class="pm-ctx-divider" ></div>
          <div class="pm-ctx-item" @click="clearRowSelection(); closeContextMenu()">
            取消选择
          </div>
        </template>
      </div>
    </Teleport>

    <!-- ===== 弹窗 ===== -->
    <!-- 产品新增/编辑弹窗 -->
    <ProductFormModal
      :visible="formVisible"
      :mode="formMode"
      :product="editingProduct"
      :category-tree="cascaderOptions"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />

    <!-- 分类新增/编辑弹窗 -->
    <CategoryFormModal
      v-model:visible="catFormVisible"
      :mode="catFormMode"
      :edit-id="catEditId"
      :edit-name="catEditName"
      :parent-id="catParentId"
      :categories="categories"
      @saved="handleCategorySaved"
      @deleted="handleCategoryDeleted"
    />
  </div>
</template>

<style scoped>
@import '../../styles/product.less';
</style>
