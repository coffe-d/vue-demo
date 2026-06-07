<!--
  ProductCategoryPanel.vue — 产品分类侧边栏
  三级分类树 | 展开/收起 | 拖拽目标 | 右键编辑分类 | 新增分类
-->
<script setup lang="ts">
import { AppstoreOutlined, PlusOutlined, RightOutlined, DownOutlined } from '@ant-design/icons-vue'
import type { ProductCategory } from '@/types'

// ===== Props =====
defineProps<{
  categories: ProductCategory[]
  visibleItems: { cat: ProductCategory; level: number }[]
  selectedCategoryId: number | undefined
  expandedKeys: number[]
  totalProducts: number
}>()

// ===== Emits =====
const emit = defineEmits<{
  'select-category': [id: number | undefined]
  'toggle-expand': [id: number]
  'expand-all': []
  'collapse-all': []
  'cat-context-menu': [e: MouseEvent, cat: ProductCategory]
  'drag-over-cat': [e: DragEvent, cat: ProductCategory]
  'drag-leave-cat': [e: DragEvent]
  'drop-on-cat': [e: DragEvent, cat: ProductCategory]
  'create-category': [parentId: number | null]
}>()
</script>

<template>
  <aside class="pm-sidebar">
    <div class="pm-sidebar--head">
      <span class="pm-sidebar--label"><AppstoreOutlined /> 产品分类</span>
      <span class="pm-sidebar--actions">
        <a-button size="small" type="text" @click="emit('expand-all')">展开</a-button>
        <a-button size="small" type="text" @click="emit('collapse-all')">收起</a-button>
      </span>
    </div>

    <!-- 全部产品 -->
    <div
      class="pm-cat-item"
      :class="{ active: selectedCategoryId === undefined }"
      @click="emit('select-category', undefined)"
    >
      <span class="pm-cat-dot"></span>
      <span class="pm-cat-name">全部产品</span>
      <span class="pm-cat-count">{{ totalProducts }}</span>
    </div>

    <!-- 分类树 -->
    <div class="pm-cat-tree">
      <div
        v-for="item in visibleItems"
        :key="item.cat.id"
        class="pm-cat-item"
        :class="{
          'pm-cat-l1': item.level === 1,
          'pm-cat-l2': item.level === 2,
          'pm-cat-l3': item.level === 3,
          active: selectedCategoryId === item.cat.id,
        }"
        @click="emit('select-category', item.cat.id)"
        @contextmenu.prevent="emit('cat-context-menu', $event, item.cat)"
        @dragover.prevent="emit('drag-over-cat', $event, item.cat)"
        @dragleave="emit('drag-leave-cat', $event)"
        @drop="emit('drop-on-cat', $event, item.cat)"
      >
        <span
          v-if="item.cat.children?.length"
          class="pm-cat-arrow"
          @click.stop="emit('toggle-expand', item.cat.id)"
        >
          <DownOutlined v-if="expandedKeys.includes(item.cat.id)" />
          <RightOutlined v-else />
        </span>
        <span v-else-if="item.level === 3" class="pm-cat-arrow"></span>
        <span v-else class="pm-cat-arrow"></span>
        <span v-if="item.level === 1" class="pm-cat-dot"></span>
        <span v-if="item.level === 3" class="pm-cat-dot-leaf"></span>
        <span class="pm-cat-name">{{ item.cat.name }}</span>
        <span class="pm-cat-count">{{ item.cat.productCount }}</span>
      </div>
    </div>

    <!-- 新增分类 -->
    <div class="pm-sidebar--add">
      <a-button size="small" type="dashed" block @click="emit('create-category', null)">
        <PlusOutlined /> 新增分类
      </a-button>
    </div>
  </aside>
</template>

<style scoped>
/* 分类面板 */
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

/* 分类项 */
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
  border-left: 3px solid transparent;
}
.pm-cat-item:hover {
  background: var(--pm-hover, #f0efe9);
}
.pm-cat-item.active {
  background: var(--pm-active, #e6f7f5);
  border-left-color: var(--pm-accent, #0d9488);
  color: var(--pm-accent, #0d9488);
  font-weight: 600;
}
.pm-cat-item.cat-drop-target {
  background: var(--pm-accent-light, #e6f7f5) !important;
  outline: 2px dashed var(--pm-accent, #0d9488);
  outline-offset: -2px;
}

.pm-cat-arrow {
  width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--pm-text-muted, #a8a29e);
  flex-shrink: 0;
}
.pm-cat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--pm-accent, #0d9488);
  flex-shrink: 0;
  opacity: 0.5;
}
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
.pm-cat-item.active .pm-cat-count {
  background: var(--pm-accent, #0d9488);
  color: #fff;
}

/* 层级缩进 */
.pm-cat-l1 { padding-left: 14px; }
.pm-cat-l2 { padding-left: 34px; }
.pm-cat-l3 { padding-left: 54px; }

/* 连接线 */
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

.pm-sidebar--add {
  margin-top: auto;
  padding: 12px 14px;
  border-top: 1px solid var(--pm-border, #e7e5e2);
}
</style>
