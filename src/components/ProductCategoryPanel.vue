<!--
  ProductCategoryPanel.vue — 产品分类侧边栏（展示型子组件）
  ============================================================
  架构角色：纯展示组件（Presentational Component）
  - 只依赖 Props 输入 + Emits 输出，无内部业务逻辑
  - 不直接调用 API，所有数据变更由父组件（ProductManage）处理

  功能：
  1. "全部产品"入口 — 展示总数，点击取消分类筛选
  2. 三级分类树 — 带展开/收起箭头、层级缩进、连接线
  3. 分类节点交互：
     - 点击：切换分类筛选
     - 右键：触发编辑（父组件打开编辑弹窗）
     - 拖拽悬停/放置：接收从表格拖来的产品，移动到该分类
  4. 新增分类按钮 → 通知父组件打开创建表单

  Vue3 知识点：
  - defineProps 类型泛型声明（编译时类型检查）
  - defineEmits 类型安全的事件声明
  - 纯展示组件模式：无副作用、无状态变更、易于测试
-->
<script setup lang="ts">
import { AppstoreOutlined, PlusOutlined, RightOutlined, DownOutlined } from '@ant-design/icons-vue'
import type { ProductCategory } from '@/types'

// ===== Props =====
// 父组件负责数据获取和状态管理，本组件仅负责渲染
defineProps<{
  /** 全部分类（扁平列表，用于面板底部统计等） */
  categories: ProductCategory[]
  /** 当前可见的分类项（根据展开/收起状态动态计算） */
  visibleItems: { cat: ProductCategory; level: number }[]
  /** 当前选中的分类 ID（undefined = "全部产品"） */
  selectedCategoryId: number | undefined
  /** 已展开的节点 ID 集合 */
  expandedKeys: number[]
  /** 产品总数（展示在"全部产品"行） */
  totalProducts: number
}>()

// ===== Emits =====
// 所有事件均向上冒泡到父组件，由父组件处理业务逻辑
const emit = defineEmits<{
  /** 切换分类筛选 */
  'select-category': [id: number | undefined]
  /** 展开/收起某个分类节点 */
  'toggle-expand': [id: number]
  'expand-all': []
  'collapse-all': []
  /** 分类右键 → 弹出编辑菜单 */
  'cat-context-menu': [e: MouseEvent, cat: ProductCategory]
  /** 拖拽产品悬停在分类上方 */
  'drag-over-cat': [e: DragEvent, cat: ProductCategory]
  /** 拖拽产品离开分类 */
  'drag-leave-cat': [e: DragEvent]
  /** 产品放置到分类上 → 移动分类 */
  'drop-on-cat': [e: DragEvent, cat: ProductCategory]
  /** 新增分类（parentId = null 表示创建一级分类） */
  'create-category': [parentId: number | null]
}>()
</script>

<template>
  <aside class="pm-sidebar">
    <!-- 面板头部：标题 + 展开/收起全局操作 -->
    <div class="pm-sidebar--head">
      <span class="pm-sidebar--label">
        <AppstoreOutlined /> 产品分类
      </span>
      <span class="pm-sidebar--actions">
        <a-button size="small" type="text" @click="emit('expand-all')">展开</a-button>
        <a-button size="small" type="text" @click="emit('collapse-all')">收起</a-button>
      </span>
    </div>

    <!-- "全部产品"入口 — 始终在第一行 -->
    <div
      class="pm-cat-item"
      :class="{ active: selectedCategoryId === undefined }"
      @click="emit('select-category', undefined)"
    >
      <span class="pm-cat-dot" ></span>
      <span class="pm-cat-name">全部产品</span>
      <span class="pm-cat-count">{{ totalProducts }}</span>
    </div>

    <!-- 分类树：按 visibleItems 的展开状态递归渲染三层 -->
    <div class="pm-cat-tree">
      <div
        v-for="item in visibleItems"
        :key="item.cat.id"
        class="pm-cat-item"
        :class="{
          'pm-cat-l1': item.level === 1,      // 一级样式：左对齐
          'pm-cat-l2': item.level === 2,      // 二级样式：缩进
          'pm-cat-l3': item.level === 3,      // 三级样式：更深缩进
          active: selectedCategoryId === item.cat.id,
        }"
        @click="emit('select-category', item.cat.id)"
        @contextmenu.prevent="emit('cat-context-menu', $event, item.cat)"
        @dragover.prevent="emit('drag-over-cat', $event, item.cat)"
        @dragleave="emit('drag-leave-cat', $event)"
        @drop="emit('drop-on-cat', $event, item.cat)"
      >
        <!-- 展开/收起箭头：有子节点的才可点击展开 -->
        <span
          v-if="item.cat.children?.length"
          class="pm-cat-arrow"
          @click.stop="emit('toggle-expand', item.cat.id)"
        >
          <DownOutlined v-if="expandedKeys.includes(item.cat.id)" />
          <RightOutlined v-else />
        </span>
        <!-- 无子节点占位（保持对齐） -->
        <span v-else-if="item.level === 3" class="pm-cat-arrow" ></span>
        <span v-else class="pm-cat-arrow" ></span>

        <!-- 层级标识：一级用圆点，三级用小点 -->
        <span v-if="item.level === 1" class="pm-cat-dot" ></span>
        <span v-if="item.level === 3" class="pm-cat-dot-leaf" ></span>

        <span class="pm-cat-name">{{ item.cat.name }}</span>
        <!-- 该分类下的产品数量徽标 -->
        <span class="pm-cat-count">{{ item.cat.productCount }}</span>
      </div>
    </div>

    <!-- 底部新增按钮 — 吸底显示 -->
    <div class="pm-sidebar--add">
      <a-button size="small" type="dashed" block @click="emit('create-category', null)">
        <PlusOutlined /> 新增分类
      </a-button>
    </div>
  </aside>
</template>

<style scoped>
/* ========== 侧边栏容器 ========== */
.pm-sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--pm-sidebar-bg, #f5f4f0);
  border-right: 1px solid var(--pm-border, #e7e5e2);
  display: flex;
  flex-direction: column;
  user-select: none;
}

.pm-sidebar--head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--pm-border, #e7e5e2);
}

.pm-sidebar--label {
  font-size: 13px;
  font-weight: 600;
  color: var(--pm-text, #44403c);
  display: flex;
  align-items: center;
  gap: 6px;
}

.pm-sidebar--actions {
  display: flex;
  gap: 2px;
}
.pm-sidebar--actions :deep(.ant-btn) {
  font-size: 12px;
  color: var(--pm-text-muted, #a8a29e);
}

/* ========== 分类项通用 ========== */
.pm-cat-item {
  display: flex;
  align-items: center;
  padding: 7px 14px;
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
  gap: 6px;
  font-size: 13px;
  color: var(--pm-text, #44403c);
  /* 左侧留白作为选中指示条位置 */
  border-left: 3px solid transparent;
}

.pm-cat-item:hover {
  background: var(--pm-hover, #f0efe9);
}

/* 选中态：高亮背景 + 左侧指示条 */
.pm-cat-item.active {
  background: var(--pm-active, #e6f7f5);
  border-left-color: var(--pm-accent, #0d9488);
  color: var(--pm-accent, #0d9488);
  font-weight: 600;
}

/* 拖拽悬停目标高亮：虚线边框 */
.pm-cat-item.cat-drop-target {
  background: var(--pm-accent-light, #e6f7f5) !important;
  outline: 2px dashed var(--pm-accent, #0d9488);
  outline-offset: -2px;
}

/* ========== 箭头 & 层级标识 ========== */
.pm-cat-arrow {
  width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--pm-text-muted, #a8a29e);
  flex-shrink: 0;
}

/* 一级分类圆点 */
.pm-cat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--pm-accent, #0d9488);
  flex-shrink: 0;
  opacity: 0.5;
}

/* 三级分类小点（比圆点更轻量） */
.pm-cat-dot-leaf {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--pm-text-muted, #a8a29e);
  flex-shrink: 0;
  margin-left: 2px;
}

.pm-cat-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 产品数量徽标 */
.pm-cat-count {
  font-size: 11px;
  color: var(--pm-text-muted, #a8a29e);
  background: var(--pm-border, #e7e5e2);
  border-radius: 10px;
  padding: 0 7px;
  height: 18px;
  line-height: 18px;
  min-width: 22px;
  text-align: center;
}

/* 选中态徽标反色 */
.pm-cat-item.active .pm-cat-count {
  background: var(--pm-accent, #0d9488);
  color: #fff;
}

/* ========== 层级缩进 ========== */
.pm-cat-l1 { padding-left: 14px; }
.pm-cat-l2 { padding-left: 34px; }
.pm-cat-l3 { padding-left: 54px; }

/* 树形连接线（二级、三级用 ::before 伪元素绘制竖线） */
.pm-cat-l2::before,
.pm-cat-l3::before {
  content: '';
  position: absolute;
  left: 22px;
  top: 0;
  bottom: 50%;
  width: 1px;
  background: var(--pm-border, #e7e5e2);
}
.pm-cat-l3::before { left: 42px; }

/* ========== 底部新增按钮区 ========== */
.pm-sidebar--add {
  /* margin-top: auto 使其吸底 */
  margin-top: auto;
  padding: 12px 14px;
  border-top: 1px solid var(--pm-border, #e7e5e2);
}
</style>
