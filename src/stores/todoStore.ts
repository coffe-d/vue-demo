// ============================================================
// Pinia Setup Store — Todo 状态管理（通过 API 交互）
// 知识点：setup store / async actions / storeToRefs / API 层分离
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Todo, CreateTodoInput, TodoUpdate, TodoFilter, TodoSummary } from '@/types'
import { Priority, TodoStatus } from '@/types'
import * as todoApi from '@/api/todo'

export const useTodoStore = defineStore('todo', () => {
  // ==================== State ====================
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ==================== Getters ====================
  const totalCount = computed(() => todos.value.length)
  const doneCount = computed(() => todos.value.filter((t) => t.status === TodoStatus.DONE).length)
  const undoneCount = computed(() => todos.value.filter((t) => t.status !== TodoStatus.DONE).length)

  const groupedByPriority = computed(() => {
    const groups: Record<Priority, Todo[]> = {
      [Priority.LOW]: [],
      [Priority.MEDIUM]: [],
      [Priority.HIGH]: [],
    }
    for (const todo of todos.value) groups[todo.priority].push(todo)
    return groups
  })

  const summaries = computed<TodoSummary[]>(() =>
    todos.value.map((t) => ({ id: t.id, title: t.title, status: t.status })),
  )

  // ==================== Actions ====================
  // 从 API 加载列表
  async function fetchTodos(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      todos.value = await todoApi.getTodoList()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  // 创建 Todo —— 调用 API
  async function addTodo(input: CreateTodoInput): Promise<Todo> {
    loading.value = true
    try {
      const todo = await todoApi.createTodo(input)
      todos.value.unshift(todo)
      return todo
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 更新 Todo
  async function updateTodo(id: number, updates: TodoUpdate): Promise<void> {
    const updated = await todoApi.updateTodo(id, updates)
    const idx = todos.value.findIndex((t) => t.id === id)
    if (idx !== -1) todos.value[idx] = updated
  }

  // 切换状态
  async function toggleStatus(id: number): Promise<void> {
    const todo = todos.value.find((t) => t.id === id)
    if (!todo) return
    const statuses = [TodoStatus.TODO, TodoStatus.IN_PROGRESS, TodoStatus.DONE]
    const nextStatus = statuses[(statuses.indexOf(todo.status) + 1) % statuses.length]
    await updateTodo(id, { status: nextStatus })
  }

  // 删除
  async function removeTodo(id: number): Promise<void> {
    await todoApi.deleteTodo(id)
    const idx = todos.value.findIndex((t) => t.id === id)
    if (idx !== -1) todos.value.splice(idx, 1)
  }

  // 清空已完成
  async function clearCompleted(): Promise<void> {
    const doneIds = todos.value.filter((t) => t.status === TodoStatus.DONE).map((t) => t.id)
    if (doneIds.length === 0) return
    await todoApi.batchDeleteTodos(doneIds)
    todos.value = todos.value.filter((t) => t.status !== TodoStatus.DONE)
  }

  // 过滤
  function filterTodos(filter: TodoFilter): Todo[] {
    switch (filter.type) {
      case 'all':
        return todos.value
      case 'byStatus':
        return todos.value.filter((t) => t.status === filter.status)
      case 'byPriority':
        return todos.value.filter((t) => t.priority === filter.priority)
      case 'byKeyword':
        return todos.value.filter(
          (t) => t.title.includes(filter.keyword) || t.description?.includes(filter.keyword),
        )
    }
  }

  return {
    todos,
    loading,
    error,
    totalCount,
    doneCount,
    undoneCount,
    groupedByPriority,
    summaries,
    fetchTodos,
    addTodo,
    updateTodo,
    toggleStatus,
    removeTodo,
    clearCompleted,
    filterTodos,
  }
})
