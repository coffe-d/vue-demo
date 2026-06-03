<!--
  ============================================================
  TodoItem.vue — 单个待办条目
  知识点：
  - defineProps 泛型标注
  - 具名插槽 (Named Slots)
  - 作用域插槽 (Scoped Slots)
  - v-show vs v-if
  - 动态 class/style 绑定
  - 计算属性
  ============================================================
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentProps, Todo } from '@/types'
import { TodoStatus, Priority } from '@/types'

// ---------- Props ----------
const props = withDefaults(defineProps<ComponentProps.TodoItem>(), {
  showIndex: true,
})

// ---------- Emits ----------
const emit = defineEmits<{
  (e: 'toggle', id: number): void
  (e: 'remove', id: number): void
  (e: 'edit', todo: Todo): void
}>()

// ---------- Computed 计算属性 ----------
// 状态标签映射
const statusLabel = computed<string>(() => {
  const map: Record<TodoStatus, string> = {
    [TodoStatus.TODO]: '📋 待办',
    [TodoStatus.IN_PROGRESS]: '🔄 进行中',
    [TodoStatus.DONE]: '✅ 已完成',
  }
  return map[props.todo.status]
})

const priorityLabel = computed<string>(() => {
  const map: Record<Priority, string> = {
    [Priority.LOW]: '🟢 低',
    [Priority.MEDIUM]: '🟡 中',
    [Priority.HIGH]: '🔴 高',
  }
  return map[props.todo.priority]
})

// 是否已完成 — 用于样式绑定
const isDone = computed(() => props.todo.status === TodoStatus.DONE)

// 动态 class 对象
const itemClasses = computed(() => ({
  'todo-item': true,
  'todo-item--done': isDone.value,
  'todo-item--high': props.todo.priority === Priority.HIGH && !isDone.value,
}))

// 格式化时间
const formattedDate = computed(() => {
  const d = props.todo.createdAt
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})
</script>

<template>
  <!-- :class 绑定计算属性返回的对象 -->
  <div :class="itemClasses">
    <!-- 默认插槽之前的内容 -->
    <div class="todo-item__header">
      <!-- v-show — 频繁切换用 v-show（不销毁 DOM） -->
      <span v-show="props.showIndex" class="todo-item__index">#{{ props.index }}</span>

      <span class="todo-item__priority" :title="priorityLabel">
        {{ priorityLabel }}
      </span>

      <span class="todo-item__status" @click="emit('toggle', props.todo.id)">
        {{ statusLabel }}
      </span>
    </div>

    <!-- 默认插槽 — 父组件可以传入自定义标题渲染 -->
    <div class="todo-item__title">
      <!--
        具名插槽 "title" — 父组件可用 <template #title> 覆盖
        同时提供默认内容作为 fallback
      -->
      <slot name="title">
        <span :class="{ 'line-through': isDone }">{{ props.todo.title }}</span>
      </slot>
    </div>

    <!-- v-if — 条件成立才渲染（不成立时 DOM 不存在） -->
    <p v-if="props.todo.description" class="todo-item__desc">
      {{ props.todo.description }}
    </p>

    <!-- 标签 -->
    <div v-if="props.todo.tags.length > 0" class="todo-item__tags">
      <span v-for="tag in props.todo.tags" :key="tag" class="tag">
        {{ tag }}
      </span>
    </div>

    <div class="todo-item__footer">
      <span class="todo-item__date">{{ formattedDate }}</span>

      <!--
        作用域插槽 "actions" — 父组件可获取 todo 数据
        用法：<template #actions="{ todo }"> ... </template>
      -->
      <slot name="actions" :todo="props.todo">
        <!-- 默认操作按钮（当父组件未提供 #actions 插槽时显示） -->
        <button class="btn-sm" @click="emit('edit', props.todo)">✏️ 编辑</button>
        <button class="btn-sm btn-sm--danger" @click="emit('remove', props.todo.id)">
          🗑️ 删除
        </button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.todo-item {
  background: var(--color-card, #fff);
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 10px;
  transition: all 0.3s;
  /* vue TransitionGroup 会用到这些 */
}

.todo-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.todo-item--done {
  opacity: 0.6;
  border-left: 4px solid var(--color-success, #52c41a);
}

.todo-item--high {
  border-left: 4px solid var(--color-danger, #ff4d4f);
}

.todo-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.todo-item__index {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
  font-weight: 600;
}

.todo-item__priority {
  font-size: 12px;
}

.todo-item__status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--color-primary, #4a5cf7);
  color: #fff;
  cursor: pointer;
  user-select: none;
  transition: filter 0.2s;
}

.todo-item__status:hover {
  filter: brightness(1.1);
}

.todo-item__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text, #333);
  margin-bottom: 4px;
}

.line-through {
  text-decoration: line-through;
  color: var(--color-text-secondary, #999);
}

.todo-item__desc {
  font-size: 13px;
  color: var(--color-text-secondary, #666);
  margin: 4px 0;
  line-height: 1.5;
}

.todo-item__tags {
  display: flex;
  gap: 6px;
  margin: 6px 0;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--color-primary, #4a5cf7);
  color: #fff;
  opacity: 0.7;
}

.todo-item__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.todo-item__date {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
}

.btn-sm {
  padding: 4px 10px;
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text, #333);
  cursor: pointer;
  font-size: 12px;
  margin-left: 4px;
  transition: all 0.2s;
}

.btn-sm:hover {
  background: var(--color-primary, #4a5cf7);
  color: #fff;
  border-color: var(--color-primary, #4a5cf7);
}

.btn-sm--danger:hover {
  background: var(--color-danger, #ff4d4f);
  border-color: var(--color-danger, #ff4d4f);
}
</style>
