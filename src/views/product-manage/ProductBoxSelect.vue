<!--
  ProductBoxSelect.vue — 框选批量选择组件
  ==========================================
  架构角色：插槽包装组件（Slot Wrapper）
  - 包裹 <a-table> 区域，拦截 mousedown 事件启动框选
  - 鼠标拖拽绘制半透明选框（固定定位 overlay）
  - 计算选框与表格行的碰撞检测，更新选中行集合
  - 通过 v-model 与父组件同步 selectedRowKeys
  - 显示批量操作栏（选中数量 + 取消按钮）

  Props:  modelValue (number[]) — 当前选中的行 ID 集合
  Emits:  update:modelValue — 选中集合变更
  Slots:  default — 表格内容区域
-->
<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount } from 'vue'
import { CheckCircleOutlined } from '@ant-design/icons-vue'

// ===== Props & Emits =====
const props = defineProps<{
  modelValue: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

// ===== 框选状态 =====
const boxSelect = reactive({
  active: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
})

/** 清空选中 */
function clearSelection() {
  emit('update:modelValue', [])
}

// ============================================================
// 框选事件处理
// ============================================================

function handleMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button, a, .ant-btn, .pm-row-index, .ant-popconfirm')) return
  if (!target.closest('.ant-table-tbody')) return

  boxSelect.active = false
  boxSelect.startX = e.clientX
  boxSelect.startY = e.clientY
  boxSelect.endX = boxSelect.startX
  boxSelect.endY = boxSelect.startY

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
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
    computeIntersections()
  }
}

function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  boxSelect.active = false
}

/** 计算框选矩形与表格行的碰撞（矩形相交算法） */
function computeIntersections() {
  const selLeft = Math.min(boxSelect.startX, boxSelect.endX)
  const selRight = Math.max(boxSelect.startX, boxSelect.endX)
  const selTop = Math.min(boxSelect.startY, boxSelect.endY)
  const selBottom = Math.max(boxSelect.startY, boxSelect.endY)

  const ids: number[] = []
  const rows = document.querySelectorAll<HTMLTableRowElement>(
    '.pm-table-wrap .ant-table-tbody tr[data-row-key]',
  )

  for (const row of rows) {
    const r = row.getBoundingClientRect()
    if (selLeft < r.right && selRight > r.left && selTop < r.bottom && selBottom > r.top) {
      const id = Number(row.getAttribute('data-row-key'))
      if (!Number.isNaN(id)) ids.push(id)
    }
  }

  emit('update:modelValue', ids)
}

/** Escape 键清除选中 */
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') clearSelection()
}

// ===== 生命周期 =====
onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div class="pm-table-wrap" @mousedown="handleMouseDown">
    <!-- 批量操作栏 -->
    <div v-if="modelValue.length > 0" class="pm-batch-bar">
      <span class="pm-batch-bar--info">
        <CheckCircleOutlined />
        已选择 <strong>{{ modelValue.length }}</strong> 个产品
      </span>
      <a-button size="small" @click="clearSelection">取消选择</a-button>
    </div>

    <!-- 表格内容插槽 -->
    <slot ></slot>

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
</template>
<style scoped>
@import '../../styles/product.less';
</style>
