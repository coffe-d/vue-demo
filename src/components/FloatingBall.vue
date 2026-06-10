<!--
  FloatingBall.vue — 全局悬浮球（入口组件）
  ============================================================
  功能：
  1. 全局悬浮在页面右下角（首次加载）或上次拖拽位置
  2. 支持拖拽移动：Pointer Events API 实现，比 Drag API 更流畅
  3. 松手自动吸附到屏幕左/右边缘（避免遮挡内容）
  4. 位置持久化到 localStorage（刷新后保持位置）
  5. 点击打开 AI 聊天对话框（通过 chatStore.toggle()）
  6. 视觉反馈：
     - 未打开时：绿色脉冲点提示"我有新功能"
     - 打开时：黄色点表示聊天激活中
     - 拖拽中：去掉 transition 避免延迟
     - hover：微放大 + 增强阴影

  交互细节：
  - 移动 < 4px 视为点击（打开对话框）
  - 移动 ≥ 4px 视为拖拽（移动悬浮球）
  - 窗口 resize 时自动修正位置（防止球跑到屏幕外）

  Vue3 知识点：
  - Pointer Events API 实现拖拽（比 mousedown/move/up 更现代，支持触屏）
  - setPointerCapture / releasePointerCapture 确保拖拽稳定
  - onMounted / onUnmounted 管理 window resize 监听
  - localStorage 持久化位置信息
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { RobotOutlined } from '@ant-design/icons-vue'

const store = useChatStore()

// ===== 位置状态 =====

const STORAGE_KEY = 'floating_ball_pos'

/**
 * 从 localStorage 加载上次位置
 * 首次加载默认右下角（距右 80px，距底 160px，给聊天弹窗留空间）
 */
function loadPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // 解析失败 → 使用默认位置
  }
  const vw = window.innerWidth
  return { x: vw - 80, y: window.innerHeight - 160 }
}

/** 悬浮球当前位置（left / top） */
const pos = ref(loadPos())

/** 是否正在拖拽中 */
const dragging = ref(false)

/** 拖拽起始点（鼠标按下时的 clientX/Y） */
const dragStart = ref({ x: 0, y: 0 })

/** 拖拽起始位置（悬浮球在按下时的 left/top） */
const posStart = ref({ x: 0, y: 0 })

const ballSize = 56       // 悬浮球尺寸（px）
const edgeMargin = 12     // 距屏幕边缘的最小间距

// ===== 拖拽逻辑（Pointer Events） =====

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  posStart.value = { x: pos.value.x, y: pos.value.y }
  // 捕获指针：确保鼠标移出球体时仍能接收事件
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return

  // 计算偏移量
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  let newX = posStart.value.x + dx
  let newY = posStart.value.y + dy

  // 边界限制：防止球移出屏幕
  const vw = window.innerWidth
  const vh = window.innerHeight
  newX = Math.max(edgeMargin, Math.min(vw - ballSize - edgeMargin, newX))
  newY = Math.max(edgeMargin, Math.min(vh - ballSize - edgeMargin, newY))

  pos.value = { x: newX, y: newY }
}

function onPointerUp(e: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

  // 松手后吸附到最近的屏幕边缘
  const vw = window.innerWidth
  const centerX = vw / 2
  let newX = pos.value.x
  if (pos.value.x + ballSize / 2 < centerX) {
    newX = edgeMargin // 贴左边
  } else {
    newX = vw - ballSize - edgeMargin // 贴右边
  }
  pos.value = { x: newX, y: pos.value.y }

  // 位置持久化
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pos.value))
}

// ===== 点击判断（移动 < 4px 视为点击，≥ 4px 视为拖拽） =====

let movedDistance = 0

function onPointerDownForClick() {
  movedDistance = 0
}

function onPointerMoveForClick(e: PointerEvent) {
  if (!dragging.value) return
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  movedDistance = Math.abs(dx) + Math.abs(dy)
}

function onPointerUpForClick() {
  if (movedDistance < 4) {
    // 移动量极小 → 判定为点击 → 打开/关闭 AI 对话框
    store.toggle()
  }
}

// ===== 窗口大小变化 → 修正位置 =====

function onResize() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  pos.value = {
    x: Math.min(pos.value.x, vw - ballSize - edgeMargin),
    y: Math.min(pos.value.y, vh - ballSize - edgeMargin),
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div
    class="floating-ball"
    :class="{ dragging }"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @pointerdown="
      onPointerDown($event);
      onPointerDownForClick();
    "
    @pointermove="
      onPointerMove($event);
      onPointerMoveForClick($event);
    "
    @pointerup="
      onPointerUp($event);
      onPointerUpForClick();
    "
  >
    <!-- 球体内部 -->
    <div class="ball-inner">
      <RobotOutlined class="ball-icon" />
      <!-- 未打开时：绿色脉冲小点 -->
      <span v-if="!store.visible" class="ball-badge" />
      <!-- 打开时：黄色指示点 -->
      <span v-if="store.visible" class="ball-active-dot" />
    </div>
  </div>
</template>

<style scoped>
/* ========== 悬浮球容器 ========== */
.floating-ball {
  position: fixed;
  width: 56px;
  height: 56px;
  /* z-index 低于对话框遮罩(9998)和对话框(9999)，高于页面内容 */
  z-index: 9997;
  cursor: grab;
  user-select: none;
  /* touch-action: none 禁止浏览器默认手势（滚动/缩放）干扰拖拽 */
  touch-action: none;
  transition: box-shadow 0.25s, transform 0.15s;
}

.floating-ball:active {
  cursor: grabbing;
}

/* 拖拽中去掉 transition（否则拖拽有延迟感） */
.floating-ball.dragging {
  transition: none;
}

/* ========== 球体内核 ========== */
.ball-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  /* 渐变背景：品牌蓝 → 紫色 */
  background: linear-gradient(135deg, var(--color-primary, #1890ff), #722ed1);
  /* 多层阴影营造悬浮感 */
  box-shadow:
    0 4px 16px rgba(24, 144, 255, 0.35),
    0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s, box-shadow 0.25s;
}

/* hover 微放大 + 阴影增强 */
.floating-ball:not(.dragging):hover .ball-inner {
  transform: scale(1.08);
  box-shadow:
    0 6px 24px rgba(24, 144, 255, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.15);
}

/* ========== 图标 ========== */
.ball-icon {
  font-size: 24px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* ========== 状态指示点 ========== */

/* 未打开时的绿色脉冲圆点 */
.ball-badge {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #52c41a;
  border: 2px solid #fff;
  animation: pulse-badge 2s infinite;
}

/* 打开时的黄色指示点（无脉冲动画） */
.ball-active-dot {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #faad14;
  border: 2px solid #fff;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

/* ========== 深色主题适配 ========== */
[data-theme='dark'] .ball-inner {
  box-shadow:
    0 4px 16px rgba(24, 144, 255, 0.25),
    0 1px 4px rgba(0, 0, 0, 0.3);
}

/* ========== 响应式：小屏幕缩小尺寸 ========== */
@media (max-width: 500px) {
  .floating-ball {
    width: 48px;
    height: 48px;
  }
  .ball-icon {
    font-size: 20px;
  }
}
</style>
