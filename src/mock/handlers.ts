// ============================================================
// Mock 请求处理器 —— 模拟后端 API 路由
// 匹配 URL + method，返回对应的模拟数据
// 知识点：统一的 API 响应结构 { code, data, message }
// ============================================================

import { users, todos, tableRecords, dashboardData } from './data'
import type { MockUser, TableRecord } from './data'
import type { Todo } from '@/types'
import { TodoStatus } from '@/types'

// 统一响应结构
export interface ApiResult<T = unknown> {
  code: number
  data: T
  message: string
}

let todoNextId = 6
let tableNextId = 9

// 当前会话的 token→user 映射
const sessions = new Map<string, MockUser>()

// 简单的 token 生成
function makeToken(): string {
  return 'mock_token_' + Math.random().toString(36).slice(2)
}

// URL+method → handler 映射
export async function handleRequest(
  url: string,
  method: string,
  body: unknown,
): Promise<ApiResult> {
  // 模拟网络延迟 200-500ms
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300))

  // ==================== Auth ====================
  if (url === '/api/auth/login' && method === 'POST') {
    const { username, password } = body as { username: string; password: string }
    const user = users.find((u) => u.username === username && u.password === password)
    if (!user) {
      return { code: 401, data: null, message: '用户名或密码错误' }
    }
    const token = makeToken()
    sessions.set(token, user)
    return {
      code: 0,
      data: { token, user: sanitizeUser(user) },
      message: '登录成功',
    }
  }

  if (url === '/api/auth/logout' && method === 'POST') {
    const { token } = body as { token: string }
    sessions.delete(token)
    return { code: 0, data: null, message: '已退出' }
  }

  if (url === '/api/auth/userinfo' && method === 'GET') {
    // 简化：从 sessions 中取第一个
    const entries = [...sessions.entries()]
    if (entries.length > 0) {
      return { code: 0, data: sanitizeUser(entries[0][1]), message: 'ok' }
    }
    return { code: 401, data: null, message: '未登录' }
  }

  // ==================== Todo CRUD ====================
  if (url === '/api/todos' && method === 'GET') {
    return { code: 0, data: [...todos], message: 'ok' }
  }

  if (url === '/api/todos' && method === 'POST') {
    const input = body as Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>
    const now = new Date()
    const todo: Todo = { ...input, id: todoNextId++, createdAt: now, updatedAt: now }
    todos.unshift(todo)
    return { code: 0, data: todo, message: '创建成功' }
  }

  if (url.match(/^\/api\/todos\/\d+$/) && method === 'PUT') {
    const id = Number(url.split('/').pop())
    const updates = body as Partial<Todo>
    const idx = todos.findIndex((t) => t.id === id)
    if (idx !== -1) {
      todos[idx] = { ...todos[idx], ...updates, updatedAt: new Date() }
      return { code: 0, data: todos[idx], message: '更新成功' }
    }
    return { code: 404, data: null, message: '记录不存在' }
  }

  if (url.match(/^\/api\/todos\/\d+$/) && method === 'DELETE') {
    const id = Number(url.split('/').pop())
    const idx = todos.findIndex((t) => t.id === id)
    if (idx !== -1) {
      todos.splice(idx, 1)
      return { code: 0, data: null, message: '删除成功' }
    }
    return { code: 404, data: null, message: '记录不存在' }
  }

  if (url === '/api/todos/batch-delete' && method === 'POST') {
    const { ids } = body as { ids: number[] }
    for (const id of ids) {
      const idx = todos.findIndex((t) => t.id === id)
      if (idx !== -1) todos.splice(idx, 1)
    }
    return { code: 0, data: null, message: '批量删除成功' }
  }

  // ==================== Table CRUD ====================
  if (url === '/api/table/list' && method === 'GET') {
    return {
      code: 0,
      data: { items: [...tableRecords], total: tableRecords.length },
      message: 'ok',
    }
  }

  if (url === '/api/table/create' && method === 'POST') {
    const record = body as Omit<TableRecord, 'id'>
    const newRecord: TableRecord = { ...record, id: tableNextId++ }
    tableRecords.unshift(newRecord)
    return { code: 0, data: newRecord, message: '创建成功' }
  }

  if (url.match(/^\/api\/table\/\d+$/) && method === 'PUT') {
    const id = Number(url.split('/').pop())
    const idx = tableRecords.findIndex((r) => r.id === id)
    if (idx !== -1) {
      tableRecords[idx] = { ...tableRecords[idx], ...(body as Partial<TableRecord>) }
      return { code: 0, data: tableRecords[idx], message: '更新成功' }
    }
    return { code: 404, data: null, message: '记录不存在' }
  }

  if (url.match(/^\/api\/table\/\d+$/) && method === 'DELETE') {
    const id = Number(url.split('/').pop())
    const idx = tableRecords.findIndex((r) => r.id === id)
    if (idx !== -1) {
      tableRecords.splice(idx, 1)
      return { code: 0, data: null, message: '删除成功' }
    }
    return { code: 404, data: null, message: '记录不存在' }
  }

  if (url === '/api/table/batch-delete' && method === 'POST') {
    const { ids } = body as { ids: number[] }
    for (const id of ids) {
      const idx = tableRecords.findIndex((r) => r.id === id)
      if (idx !== -1) tableRecords.splice(idx, 1)
    }
    return { code: 0, data: null, message: '批量删除成功' }
  }

  // ==================== Dashboard ====================
  if (url === '/api/dashboard/stats' && method === 'GET') {
    return {
      code: 0,
      data: {
        ...dashboardData,
        pendingTasks: todos.filter((t) => t.status !== TodoStatus.DONE).length,
      },
      message: 'ok',
    }
  }

  // ==================== Menu ====================
  if (url === '/api/menu/list' && method === 'GET') {
    return { code: 0, data: getMenuList(), message: 'ok' }
  }

  return { code: 404, data: null, message: `未找到接口: ${method} ${url}` }
}

// ---------- 工具函数 ----------

function sanitizeUser(user: MockUser) {
  // 不返回 password
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...rest } = user
  return rest
}

function getMenuList() {
  return [
    { path: '/', name: 'Dashboard', meta: { title: 'menu.dashboard', icon: 'DashboardOutlined' } },
    { path: '/todo', name: 'TodoDemo', meta: { title: 'menu.todo', icon: 'CheckSquareOutlined' } },
    { path: '/form', name: 'ComplexForm', meta: { title: 'menu.form', icon: 'FormOutlined' } },
    { path: '/table', name: 'DataTable', meta: { title: 'menu.table', icon: 'TableOutlined' } },
    {
      path: '/timeline',
      name: 'Timeline',
      meta: { title: 'menu.timeline', icon: 'ClockCircleOutlined' },
    },
    {
      path: '/shortcuts',
      name: 'Shortcuts',
      meta: { title: 'menu.shortcuts', icon: 'ThunderboltOutlined' },
    },
    {
      path: '/store-demo',
      name: 'StoreDemo',
      meta: { title: 'menu.store', icon: 'DatabaseOutlined' },
    },
    {
      path: '/composables',
      name: 'ComposableDemo',
      meta: { title: 'menu.composables', icon: 'ApiOutlined' },
    },
  ]
}
