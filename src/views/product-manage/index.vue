<!--
  ProductManage — 产品基础信息管理（编排器）
  子组件：ProductCategoryPanel / ProductFormModal / ProductPricePanel
-->
<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { productApi } from '@/api/product'
import type { ProductRecord, ProductCategory, ProductPriceLevel } from '@/types'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SettingOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExportOutlined, ShoppingOutlined,
} from '@ant-design/icons-vue'
import ProductCategoryPanel from '@/components/ProductCategoryPanel.vue'
import ProductFormModal from '@/components/ProductFormModal.vue'
import ProductPricePanel from '@/components/ProductPricePanel.vue'

// ============================================================
// 1. 响应式状态
// ============================================================
const loading = ref(false)
const categories = ref<ProductCategory[]>([])
const products = ref<ProductRecord[]>([])
const selectedCategoryId = ref<number | undefined>(undefined)
const expandedKeys = ref<number[]>([])
const totalProducts = ref(0)

const keyword = ref('')
const pagination = reactive({ current: 1, pageSize: 15, total: 0 })
const selectedProduct = ref<ProductRecord | null>(null)

const dragState = reactive({
  draggingId: null as number | null,
  overId: null as number | null,
  overPosition: null as 'before' | 'after' | null,
})

const contextMenu = reactive({
  visible: false, x: 0, y: 0,
  product: null as ProductRecord | null,
})

// 框选批量操作
const selectedRowKeys = ref<number[]>([])
const boxSelect = reactive({
  active: false, startX: 0, startY: 0, endX: 0, endY: 0,
})
function isRowSelected(id: number) { return selectedRowKeys.value.includes(id) }
function clearRowSelection() { selectedRowKeys.value = [] }
function toggleRowSelection(id: number) {
  const idx = selectedRowKeys.value.indexOf(id)
  idx >= 0 ? selectedRowKeys.value.splice(idx, 1) : selectedRowKeys.value.push(id)
}

// 产品表单（由子组件 ProductFormModal 承载）
const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingProduct = ref<ProductRecord | null>(null)

// 列自定义
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

// 分类表单
const catFormVisible = ref(false)
const catFormMode = ref<'create' | 'edit'>('create')
const catParentId = ref<number | null>(null)
const catEditingId = ref<number | null>(null)
const catFormName = ref('')

// ============================================================
// 2. 计算属性
// ============================================================
const categoryTree = computed(() => buildTree(categories.value))

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
      value: c.id, label: c.name,
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
    stock: { title: '库存', width: 80, align: 'right', sorter: (a: ProductRecord, b: ProductRecord) => a.stock - b.stock },
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

// ============================================================
// 3. 数据获取
// ============================================================
async function fetchCategories() {
  const res = await productApi.getCategories()
  if (res.code === 0 && res.data) {
    categories.value = res.data
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
      totalProducts.value = res.data.total
    }
  } finally { loading.value = false }
}

async function refreshAll() {
  await Promise.all([fetchCategories(), fetchProducts()])
}

function handleSearch() { pagination.current = 1; fetchProducts() }
function handleTableChange(pag: { current: number; pageSize: number }) {
  if (pag.pageSize !== pagination.pageSize) pagination.current = 1
  else pagination.current = pag.current
  pagination.pageSize = pag.pageSize; fetchProducts()
}
function onSelectChange(keys: (string | number)[]) { selectedRowKeys.value = keys as number[] }

const tablePagination = computed(() => ({
  ...pagination,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100'],
}))
function selectCategory(id: number | undefined) {
  selectedCategoryId.value = id; selectedProduct.value = null; pagination.current = 1; fetchProducts()
}

// ============================================================
// 4. 分类操作
// ============================================================
function toggleExpand(id: number) {
  const idx = expandedKeys.value.indexOf(id)
  if (idx >= 0) {
    expandedKeys.value.splice(idx, 1)
  } else {
    expandedKeys.value.push(id)
  }
}
function expandAll() { expandedKeys.value = categories.value.map((c) => c.id) }
function collapseAll() { expandedKeys.value = [] }

function handleCatContextMenu(e: MouseEvent, cat: ProductCategory) {
  catEditingId.value = cat.id; catFormName.value = cat.name
  catParentId.value = cat.parentId; catFormMode.value = 'edit'; catFormVisible.value = true
}
function openCreateCatForm(parentId: number | null) {
  catFormMode.value = 'create'; catParentId.value = parentId
  catFormName.value = ''; catEditingId.value = null; catFormVisible.value = true
}

async function saveCategory() {
  if (!catFormName.value.trim()) { message.warning('请输入分类名称'); return }
  try {
    if (catFormMode.value === 'create') {
      let level = 1
      if (catParentId.value) {
        const parent = categories.value.find((c) => c.id === catParentId.value)
        if (parent) level = Math.min(parent.level + 1, 3)
      }
      await productApi.createCategory({ name: catFormName.value.trim(), parentId: catParentId.value, level, sort: 99 })
    } else if (catEditingId.value) {
      await productApi.updateCategory(catEditingId.value, { name: catFormName.value.trim() })
    }
    catFormVisible.value = false; await fetchCategories()
  } catch { message.error('操作失败') }
}

async function deleteCategory(id: number) {
  await productApi.deleteCategory(id)
  if (selectedCategoryId.value === id) selectedCategoryId.value = undefined
  catFormVisible.value = false; await fetchCategories(); await fetchProducts()
}

// ============================================================
// 5. 拖拽排序
// ============================================================
let dragLeaveTimer: ReturnType<typeof setTimeout> | null = null

function handleDragStart(e: DragEvent, product: ProductRecord) {
  dragState.draggingId = product.id
  if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(product.id)) }
  nextTick(() => document.querySelector(`[data-row-key="${product.id}"]`)?.classList.add('pm-row-dragging'))
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
  const dropPos = dragState.overPosition  // 必须在清空前保存
  dragState.draggingId = null; dragState.overId = null; dragState.overPosition = null
  if (!dragId || dragId === targetProduct.id) return

  const dragIdx = products.value.findIndex((p) => p.id === dragId)
  const targetIdx = products.value.findIndex((p) => p.id === targetProduct.id)
  if (dragIdx === -1 || targetIdx === -1) return

  // 先移除被拖拽项，再计算插入位置
  const [dragged] = products.value.splice(dragIdx, 1)
  // 移除后 targetIdx 的偏移校正
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

function handleDragOverCat(e: DragEvent, _cat: ProductCategory) {
  e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  ;(e.currentTarget as HTMLElement).classList.add('cat-drop-target')
}
function handleDragLeaveCat(e: DragEvent) {
  ;(e.currentTarget as HTMLElement).classList.remove('cat-drop-target')
}
async function handleDropOnCat(e: DragEvent, cat: ProductCategory) {
  e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('cat-drop-target')
  const dragId = dragState.draggingId
  if (!dragId) return
  const product = products.value.find((p) => p.id === dragId)
  if (!product || product.categoryId === cat.id) return
  await productApi.moveCategory(dragId, cat.id)
  message.success(`已将「${product.name}」移至「${cat.name}」`)
  await fetchProducts(); await fetchCategories()
}

// ============================================================
// 6. 右键菜单
// ============================================================
function handleRowContextMenu(e: MouseEvent, product: ProductRecord) {
  e.preventDefault()
  contextMenu.visible = true; contextMenu.x = e.clientX; contextMenu.y = e.clientY; contextMenu.product = product
}
function closeContextMenu() { contextMenu.visible = false; contextMenu.product = null }

async function moveProductToCategory(productId: number, categoryId: number) {
  const product = products.value.find((p) => p.id === productId)
  await productApi.moveCategory(productId, categoryId)
  message.success(`已将「${product?.name}」移至「${categories.value.find((c) => c.id === categoryId)?.name}」`)
  closeContextMenu(); await fetchProducts(); await fetchCategories()
}

function editFromContextMenu() { if (contextMenu.product) openEditForm(contextMenu.product); closeContextMenu() }
async function deleteFromContextMenu() { if (contextMenu.product) await handleDelete(contextMenu.product.id); closeContextMenu() }
function onGlobalClick() { if (contextMenu.visible) closeContextMenu() }
function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') clearRowSelection() }

async function batchMoveToCategory(categoryId: number) {
  if (selectedRowKeys.value.length === 0) return
  const catName = categories.value.find((c) => c.id === categoryId)?.name ?? ''
  const count = selectedRowKeys.value.length
  try {
    await Promise.all(selectedRowKeys.value.map((id) => productApi.moveCategory(id, categoryId)))
    message.success(`已将 ${count} 个产品移至「${catName}」`)
    closeContextMenu(); clearRowSelection()
    await fetchProducts(); await fetchCategories()
  } catch { message.error('批量移动失败') }
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
  formMode.value = 'create'; editingProduct.value = null; formVisible.value = true
}
function openEditForm(product: ProductRecord) {
  formMode.value = 'edit'; editingProduct.value = product; formVisible.value = true
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
    formVisible.value = false; await fetchProducts(); await fetchCategories()
  } catch { message.error('操作失败') }
}

function handleFormCancel() { formVisible.value = false }

async function handleDelete(id: number) {
  await productApi.delete(id)
  if (selectedProduct.value?.id === id) selectedProduct.value = null
  await fetchProducts(); await fetchCategories()
}

// ============================================================
// 9. 产品选择 & 工具函数
// ============================================================
function selectProductRow(product: ProductRecord) {
  selectedProduct.value = selectedProduct.value?.id === product.id ? null : product
}

const pricePanelCategoryPath = computed(() => {
  if (!selectedProduct.value) return ''
  return getCategoryPath(selectedProduct.value.categoryId)
})

function buildTree(flatList: ProductCategory[]): ProductCategory[] {
  const map = new Map<number, ProductCategory>()
  const roots: ProductCategory[] = []
  for (const cat of flatList) map.set(cat.id, { ...cat, children: [] })
  for (const cat of map.values()) {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children!.push(cat)
    } else { roots.push(cat) }
  }
  const sorter = (a: ProductCategory, b: ProductCategory) => a.sort - b.sort
  roots.sort(sorter)
  for (const [, cat] of map) { if (cat.children) cat.children.sort(sorter) }
  for (const cat of map.values()) { if (cat.children?.length === 0) cat.children = undefined }
  return roots
}

function getCategoryPath(categoryId: number): string {
  const parts: string[] = []
  let current = categories.value.find((c) => c.id === categoryId)
  while (current) {
    parts.unshift(current.name)
    current = current.parentId ? categories.value.find((c) => c.id === current!.parentId) : undefined
  }
  return parts.join(' > ')
}

// ============================================================
// 10. 框选批量操作
// ============================================================
function handleTableMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  // 不拦截按钮、链接、序号拖拽柄上的点击
  if (target.closest('button, a, .ant-btn, .pm-row-index, .ant-popconfirm')) return
  // 只在表格行区域启动框选
  if (!target.closest('.ant-table-tbody')) return

  boxSelect.active = false
  boxSelect.startX = e.clientX
  boxSelect.startY = e.clientY
  boxSelect.endX = boxSelect.startX
  boxSelect.endY = boxSelect.startY

  document.addEventListener('mousemove', onBoxMouseMove)
  document.addEventListener('mouseup', onBoxMouseUp)
}

function onBoxMouseMove(e: MouseEvent) {
  const x = e.clientX
  const y = e.clientY

  const dx = Math.abs(x - boxSelect.startX)
  const dy = Math.abs(y - boxSelect.startY)

  if (!boxSelect.active && (dx > 5 || dy > 5)) {
    boxSelect.active = true
  }
  if (boxSelect.active) {
    boxSelect.endX = x
    boxSelect.endY = y
    computeBoxIntersections()
  }
}

function onBoxMouseUp() {
  document.removeEventListener('mousemove', onBoxMouseMove)
  document.removeEventListener('mouseup', onBoxMouseUp)
  boxSelect.active = false
}

function computeBoxIntersections() {
  const selLeft = Math.min(boxSelect.startX, boxSelect.endX)
  const selRight = Math.max(boxSelect.startX, boxSelect.endX)
  const selTop = Math.min(boxSelect.startY, boxSelect.endY)
  const selBottom = Math.max(boxSelect.startY, boxSelect.endY)

  const ids: number[] = []
  const rows = document.querySelectorAll<HTMLTableRowElement>('.pm-table-wrap .ant-table-tbody tr[data-row-key]')

  for (const row of rows) {
    const r = row.getBoundingClientRect()
    if (selLeft < r.right && selRight > r.left && selTop < r.bottom && selBottom > r.top) {
      const id = Number(row.getAttribute('data-row-key'))
      if (!Number.isNaN(id)) ids.push(id)
    }
  }
  selectedRowKeys.value = ids
}

// ============================================================
// 11. 生命周期
// ============================================================
onMounted(async () => {
  await refreshAll()
  document.addEventListener('click', onGlobalClick)
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick)
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('mousemove', onBoxMouseMove)
  document.removeEventListener('mouseup', onBoxMouseUp)
})

watch(selectedCategoryId, () => { pagination.current = 1; fetchProducts() })
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
        <a-button type="text" :loading="loading" @click="refreshAll"><ReloadOutlined /></a-button>
        <a-button type="primary" @click="openCreateForm"><PlusOutlined /> 新增产品</a-button>
      </div>
    </div>

    <!-- ===== 主体布局 ===== -->
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

      <!-- 右侧：主内容 -->
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
                  >{{ col.title }}</a-checkbox>
                  <a-divider style="margin: 8px 0" />
                  <a-button size="small" type="link" @click="resetColumns">恢复默认</a-button>
                </div>
              </template>
              <a-button><SettingOutlined /> 列设置</a-button>
            </a-popover>
            <a-button><ExportOutlined /> 导出</a-button>
          </div>
        </div>

        <!-- 批量操作栏 -->
        <div v-if="selectedRowKeys.length > 0" class="pm-batch-bar">
          <span class="pm-batch-bar--info">
            <CheckCircleOutlined /> 已选择 <strong>{{ selectedRowKeys.length }}</strong> 个产品
          </span>
          <a-button size="small" @click="clearRowSelection">取消选择</a-button>
        </div>

        <!-- 产品表格 -->
        <div class="pm-table-wrap" @mousedown="handleTableMouseDown">
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
              if (dragState.overId === r.id) classes.push(dragState.overPosition === 'before' ? 'pm-drop-before' : 'pm-drop-after')
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
                >{{ (pagination.current - 1) * pagination.pageSize + index + 1 }}</span>
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
                  <a-button type="text" size="small" @click.stop="openEditForm(record)"><EditOutlined /></a-button>
                  <a-popconfirm
                    title="确定要删除该产品吗？"
                    ok-text="确定"
                    cancel-text="取消"
                    @confirm="handleDelete(record.id)"
                    @click.stop>
                    <a-button type="text" size="small" danger @click.stop><DeleteOutlined /></a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>

          <!-- 框选遮罩层 -->
          <div
            v-if="boxSelect.active"
            class="pm-box-overlay"
            :style="{
              left: Math.min(boxSelect.startX, boxSelect.endX) + 'px',
              top: Math.min(boxSelect.startY, boxSelect.endY) + 'px',
              width: Math.abs(boxSelect.endX - boxSelect.startX) + 'px',
              height: Math.abs(boxSelect.endY - boxSelect.startY) + 'px',
            }"
          ></div>
        </div>

        <!-- 价格面板 -->
        <ProductPricePanel
          v-if="selectedProduct"
          :product="selectedProduct"
          :category-path="pricePanelCategoryPath"
          @close="selectedProduct = null"
        />

        <!-- 空状态 -->
        <div v-if="!loading && products.length === 0" class="pm-empty">
          <a-empty description="暂无产品数据">
            <a-button type="primary" @click="openCreateForm"><PlusOutlined /> 新增第一个产品</a-button>
          </a-empty>
        </div>
      </main>
    </div>

    <!-- ===== 右键菜单 ===== -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="pm-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop>
        <!-- 单选模式 -->
        <template v-if="selectedRowKeys.length <= 1 || !isRowSelected(contextMenu.product!.id)">
          <div class="pm-ctx-item" @click="editFromContextMenu"><EditOutlined /> 编辑产品</div>
          <div class="pm-ctx-divider"></div>
          <div class="pm-ctx-label">移动到分类</div>
          <div
            v-for="cat in categoryFlatList"
            :key="cat.id"
            class="pm-ctx-item"
            :style="{ paddingLeft: 12 + cat.level * 16 + 'px' }"
            @click="moveProductToCategory(contextMenu.product!.id, cat.id)">
            {{ cat.label }}
          </div>
          <div class="pm-ctx-divider"></div>
          <div class="pm-ctx-item pm-ctx-item--danger" @click="deleteFromContextMenu"><DeleteOutlined /> 删除产品</div>
        </template>
        <!-- 批量模式 -->
        <template v-else>
          <div class="pm-ctx-label">已选择 {{ selectedRowKeys.length }} 个产品</div>
          <div class="pm-ctx-item" @click="editFromContextMenu"><EditOutlined /> 编辑当前产品</div>
          <div class="pm-ctx-divider"></div>
          <div class="pm-ctx-label">批量移动到分类</div>
          <div
            v-for="cat in categoryFlatList"
            :key="cat.id"
            class="pm-ctx-item"
            :style="{ paddingLeft: 12 + cat.level * 16 + 'px' }"
            @click="batchMoveToCategory(cat.id)">
            {{ cat.label }}
          </div>
          <div class="pm-ctx-divider"></div>
          <div class="pm-ctx-item" @click="clearRowSelection(); closeContextMenu()">取消选择</div>
        </template>
      </div>
    </Teleport>

    <!-- ===== 弹窗 ===== -->
    <ProductFormModal
      :visible="formVisible"
      :mode="formMode"
      :product="editingProduct"
      :category-tree="cascaderOptions"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />

    <!-- 分类表单（简单，保留在母页） -->
    <a-modal
      v-model:open="catFormVisible"
      :title="catFormMode === 'create' ? '新增分类' : '编辑分类'"
      width="400px"
      @ok="saveCategory"
      @cancel="catFormVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item label="分类名称" required>
          <a-input v-model:value="catFormName" placeholder="请输入分类名称" />
        </a-form-item>
        <a-form-item v-if="catFormMode === 'create'" label="父级分类">
          <a-select v-model:value="catParentId" placeholder="无（作为一级分类）" allow-clear style="width: 100%">
            <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id" :disabled="cat.level >= 3">
              {{ '　'.repeat(Math.max(0, cat.level - 1)) }}{{ cat.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
      <template v-if="catFormMode === 'edit'" #footer>
        <a-button @click="catFormVisible = false">取消</a-button>
        <a-space>
          <a-popconfirm title="删除分类将一并删除子分类，确定？" @confirm="deleteCategory(catEditingId!)">
            <a-button danger>删除</a-button>
          </a-popconfirm>
          <a-button type="primary" @click="saveCategory">保存</a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
@import '../../styles/product.css';
</style>
