// ============================================================
// Todo API — CRUD 操作
// ============================================================

import { api } from './index'
import type { Todo, CreateTodoInput, TodoUpdate } from '@/types'

// 获取 Todo 列表
export async function getTodoList(): Promise<Todo[]> {
  const res = await api.get<Todo[]>('/api/todos')
  if (res.code === 0) return res.data
  return []
}

// 创建 Todo
export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const res = await api.post<Todo>('/api/todos', input)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

// 更新 Todo
export async function updateTodo(id: number, updates: TodoUpdate): Promise<Todo> {
  const res = await api.put<Todo>(`/api/todos/${id}`, updates)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

// 删除 Todo
export async function deleteTodo(id: number): Promise<void> {
  await api.delete(`/api/todos/${id}`)
}

// 批量删除
export async function batchDeleteTodos(ids: number[]): Promise<void> {
  await api.post('/api/todos/batch-delete', { ids })
}
