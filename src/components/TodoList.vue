<!--
  ============================================================
  TodoList.vue — 待办列表
  知识点：
  - provide / inject — 跨层级传值
  - TransitionGroup — 列表动画
  - 动态组件 :is
  - v-for + key
  - computed 过滤
  - watch — 监听器
  - onMounted / onUnmounted — 生命周期
  ============================================================
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, provide, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTodoStore } from '@/stores/todoStore'
import { useDebounce } from '@/composables/useDebounce'
import type { TodoFilter } from '@/types'
import { TodoStatus, Priority } from '@/types'
import TodoItem from './TodoItem.vue'
import StatsPanel from './StatsPanel.vue'

// ---------- Store 使用 ----------
const todoStore = useTodoStore()

// storeToRefs — 保持响应式地解构 store
// ✅ 正确：使用 storeToRefs 解构 state/getters
const { todos, loading, totalCount, doneCount } = storeToRefs(todoStore)

// ❌ 错误：直接解构会失去响应式
// const { todos } = todoStore  // 这样不行！

// actions 可以直接解构（它们是函数，不需要响应式）
const { toggleStatus, removeTodo, clearCompleted } = todoStore

// ---------- 本地状态 ----------
const filterType = ref<TodoFilter['type']>('all')
const filterStatus = ref(TodoStatus.TODO)
const filterPriority = ref(Priority.HIGH)
const searchKeyword = ref('')

// ---------- Composables ----------
const debouncedKeyword = useDebounce(searchKeyword, 300)

// ---------- Computed 过滤列表 ----------
const currentFilter = computed<TodoFilter>(() => {
  switch (filterType.value) {
    case 'all':
      return { type: 'all' }
    case 'byStatus':
      return { type: 'byStatus', status: filterStatus.value }
    case 'byPriority':
      return { type: 'byPriority', priority: filterPriority.value }
    case 'byKeyword':
      return { type: 'byKeyword', keyword: debouncedKeyword.value }
    default:
      return { type: 'all' }
  }
})

const filteredTodos = computed(() => {
  return todoStore.filterTodos(currentFilter.value)
})

// 按状态分组显示
const todoGroups = computed(() => {
  const groups = {
    [TodoStatus.TODO]: [] as typeof filteredTodos.value,
    [TodoStatus.IN_PROGRESS]: [] as typeof filteredTodos.value,
    [TodoStatus.DONE]: [] as typeof filteredTodos.value,
  }
  for (const t of filteredTodos.value) {
    groups[t.status].push(t)
  }
  return groups
})

const groupLabels = {
  [TodoStatus.TODO]: '📋 待办',
  [TodoStatus.IN_PROGRESS]: '🔄 进行中',
  [TodoStatus.DONE]: '✅ 已完成',
}

// ---------- provide / inject ----------
// 向子组件树提供数据
provide<Ref<number>>('totalCount', totalCount)
provide<string>('appName', 'Vue3 + TS + Pinia Demo')

// ---------- watch 监听 ----------
// 监听过滤类型变化以重置子条件
watch(filterType, (newType) => {
  console.log(`[TodoList] 过滤类型切换为: ${newType}`)
})

// 监听过滤后的数量
watch(
  () => filteredTodos.value.length,
  (newLen, oldLen) => {
    if (oldLen !== undefined && newLen !== oldLen) {
      console.log(`[TodoList] 过滤结果: ${oldLen} → ${newLen}`)
    }
  },
)

// ---------- 事件处理 ----------
function handleEdit(todo: any): void {
  // 简单实现：切换优先级作为"编辑"演示
  const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH]
  const currentIdx = priorities.indexOf(todo.priority)
  const nextPriority = priorities[(currentIdx + 1) % priorities.length]
  todoStore.updateTodo(todo.id, { priority: nextPriority })
}

// ---------- 生命周期 ----------
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  console.log('[TodoList] 组件已挂载')

  // 若无数据，从 API 获取
  if (todos.value.length === 0) {
    todoStore.fetchTodos()
  }

  // 模拟定时刷新（仅演示 onUnmounted 清理）
  timer = setInterval(() => {
    console.log(`[TodoList] 当前共 ${totalCount.value} 条待办`)
  }, 10000)
})

onUnmounted(() => {
  console.log('[TodoList] 组件即将卸载，清理定时器')
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="todo-list-container">
    <!-- 过滤栏 -->
    <div class="filter-bar">
      <div class="filter-tabs">
        <button
          v-for="opt in [
            { key: 'all', label: '📋 全部' },
            { key: 'byStatus', label: '🔍 按状态' },
            { key: 'byPriority', label: '⭐ 按优先级' },
            { key: 'byKeyword', label: '🔎 搜索' },
          ]"
          :key="opt.key"
          :class="['filter-tab', { active: filterType === opt.key }]"
          @click="filterType = opt.key as any"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- 按状态过滤的子选项 -->
      <select v-if="filterType === 'byStatus'" v-model="filterStatus" class="filter-select">
        <option :value="TodoStatus.TODO">📋 待办</option>
        <option :value="TodoStatus.IN_PROGRESS">🔄 进行中</option>
        <option :value="TodoStatus.DONE">✅ 已完成</option>
      </select>

      <!-- 按优先级过滤的子选项 -->
      <select v-if="filterType === 'byPriority'" v-model="filterPriority" class="filter-select">
        <option :value="Priority.LOW">🟢 低</option>
        <option :value="Priority.MEDIUM">🟡 中</option>
        <option :value="Priority.HIGH">🔴 高</option>
      </select>

      <!-- 关键字搜索 -->
      <input
        v-if="filterType === 'byKeyword'"
        v-model="searchKeyword"
        type="text"
        class="filter-search"
        placeholder="搜索标题或描述..."
      />
    </div>

    <!-- 统计面板 — 动态组件演示位置 -->
    <StatsPanel title="📊 统计概览" :show-chart="true" />

    <!-- 列表内容 -->
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="filteredTodos.length === 0" class="empty">
      <p>🎉 没有找到匹配的待办事项</p>
    </div>

    <!--
      TransitionGroup — 列表动画
      为每个 item 提供进入/离开动画
    -->
    <div v-else class="todo-groups">
      <div
        v-for="status in [TodoStatus.TODO, TodoStatus.IN_PROGRESS, TodoStatus.DONE]"
        :key="status"
        class="todo-group"
      >
        <h4 v-if="todoGroups[status].length > 0" class="group-header">
          {{ groupLabels[status] }} ({{ todoGroups[status].length }})
        </h4>

        <TransitionGroup name="list" tag="div">
          <TodoItem
            v-for="(todo, index) in todoGroups[status]"
            :key="todo.id"
            :todo="todo"
            :index="index + 1"
            @toggle="toggleStatus"
            @remove="removeTodo"
            @edit="handleEdit"
          >
            <!-- 使用具名插槽覆盖默认标题 -->
            <template #title>
              <span :style="{ fontWeight: todo.priority === 'high' ? 800 : 600 }">
                {{ todo.title }}
              </span>
            </template>

            <!-- 使用作用域插槽自定义操作按钮 -->
            <template #actions="{ todo: t }">
              <button class="btn-sm" @click="toggleStatus(t.id)">🔄 切换状态</button>
              <button class="btn-sm btn-sm--danger" @click="removeTodo(t.id)">🗑️</button>
            </template>
          </TodoItem>
        </TransitionGroup>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="doneCount > 0" class="bottom-bar">
      <span>{{ doneCount }} 条已完成</span>
      <button class="btn-sm btn-sm--danger" @click="clearCompleted">清空已完成</button>
    </div>
  </div>
</template>

<style scoped>
.todo-list-container {
  max-width: 720px;
  margin: 0 auto;
}

/* 过滤栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--color-card, #fff);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid var(--color-border, #e8e8e8);
}

.filter-tab {
  padding: 6px 14px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-secondary, #666);
  transition: all 0.2s;
}

.filter-tab.active {
  background: var(--color-primary, #4a5cf7);
  color: #fff;
}

.filter-select,
.filter-search {
  padding: 6px 12px;
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 8px;
  background: var(--color-card, #fff);
  color: var(--color-text, #333);
  font-size: 13px;
}

.filter-search {
  min-width: 180px;
}

/* 分组 */
.todo-groups {
  margin-top: 8px;
}

.group-header {
  font-size: 14px;
  color: var(--color-text-secondary, #666);
  margin: 12px 0 6px 0;
  padding-left: 4px;
}

/* TransitionGroup 动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 保持离开中的元素占位，让动画更平滑 */
.list-leave-active {
  position: absolute;
}

.loading,
.empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-secondary, #999);
  font-size: 15px;
}

.bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 13px;
  color: var(--color-text-secondary, #666);
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
