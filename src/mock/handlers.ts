// ============================================================
// Mock 请求处理器 —— 模拟后端 API 路由
// 匹配 URL + method，返回对应的模拟数据
// 知识点：统一的 API 响应结构 { code, data, message }
// ============================================================

import {
  users,
  todos,
  tableRecords,
  dashboardData,
  products,
  productCategories,
  freightRecords,
  PRODUCT_INITIAL_ID,
  PRICE_LEVEL_INITIAL_ID,
} from './data'
import type { MockUser, TableRecord } from './data'
import type { Todo, ProductRecord, ProductCategory } from '@/types'
import { TodoStatus } from '@/types'

let todoNextId = 6
let tableNextId = 9
let productNextId = PRODUCT_INITIAL_ID
const priceLevelNextId = PRICE_LEVEL_INITIAL_ID

// 统一响应结构
export interface ApiResult<T = unknown> {
  code: number
  data: T
  message: string
}

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

  // ==================== Categories ====================
  if (url === '/api/categories' && method === 'GET') {
    const result = buildCategoriesResult()
    return { code: 0, data: result, message: 'ok' }
  }

  if (url === '/api/categories' && method === 'POST') {
    const input = body as Pick<ProductCategory, 'name' | 'parentId' | 'level' | 'sort'>
    const cat: ProductCategory = {
      id: Math.max(...productCategories.map((c) => c.id)) + 1,
      ...input,
      productCount: 0,
    }
    productCategories.push(cat)
    return { code: 0, data: cat, message: '创建成功' }
  }

  if (url.match(/^\/api\/categories\/\d+$/) && method === 'PUT') {
    const id = Number(url.split('/').pop())
    const idx = productCategories.findIndex((c) => c.id === id)
    if (idx !== -1) {
      productCategories[idx] = { ...productCategories[idx], ...(body as Partial<ProductCategory>) }
      return { code: 0, data: productCategories[idx], message: '更新成功' }
    }
    return { code: 404, data: null, message: '分类不存在' }
  }

  if (url.match(/^\/api\/categories\/\d+$/) && method === 'DELETE') {
    const id = Number(url.split('/').pop())
    const idx = productCategories.findIndex((c) => c.id === id)
    if (idx !== -1) {
      // 将子分类产品的 categoryId 移到父分类
      const children = productCategories.filter((c) => c.parentId === id)
      for (const child of children) {
        for (const p of products) {
          if (p.categoryId === child.id) {
            p.categoryId = productCategories[idx].parentId ?? 1
          }
        }
      }
      // 删除分类及其子分类
      const idsToRemove = new Set([id, ...children.map((c) => c.id)])
      for (let i = productCategories.length - 1; i >= 0; i--) {
        if (idsToRemove.has(productCategories[i].id)) {
          productCategories.splice(i, 1)
        }
      }
      return { code: 0, data: null, message: '删除成功' }
    }
    return { code: 404, data: null, message: '分类不存在' }
  }

  // ==================== Products ====================
  if (url === '/api/products' && method === 'GET') {
    const params = body as Record<string, unknown> | null
    let filtered = [...products]

    if (params?.categoryId) {
      // 包含子分类产品（递归获取所有子孙分类 ID）
      const catId = Number(params.categoryId)
      const descendantIds = getDescendantCategoryIds(catId)
      const allIds = [catId, ...descendantIds]
      filtered = filtered.filter((p) => allIds.includes(p.categoryId))
    }
    if (params?.keyword) {
      const kw = String(params.keyword).toLowerCase()
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw),
      )
    }
    if (params?.status) {
      filtered = filtered.filter((p) => p.status === params!.status)
    }

    filtered.sort((a, b) => a.sort - b.sort)

    const page = Number(params?.page) || 1
    const pageSize = Number(params?.pageSize) || 20
    const total = filtered.length
    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return { code: 0, data: { list, total, page, pageSize }, message: 'ok' }
  }

  if (url === '/api/products' && method === 'POST') {
    const input = body as Partial<ProductRecord>
    const now = new Date().toISOString().slice(0, 10)
    const product: ProductRecord = {
      id: productNextId++,
      code: input.code || `CP-${Date.now()}`,
      name: input.name || '',
      categoryId: input.categoryId || 1,
      spec: input.spec || '',
      unit: input.unit || '',
      lastPurchasePrice: input.lastPurchasePrice || 0,
      freightAllocation: input.freightAllocation || 0,
      purchasePriceWithFreight: (input.lastPurchasePrice || 0) + (input.freightAllocation || 0),
      costPrice: input.costPrice || 0,
      prices: input.prices || [],
      stock: input.stock || 0,
      status: input.status || 'active',
      sort: products.length + 1,
      remark: input.remark || '',
      createdAt: now,
      updatedAt: now,
    }
    products.push(product)
    return { code: 0, data: product, message: '创建成功' }
  }

  if (url.match(/^\/api\/products\/\d+\/sort$/) && method === 'PUT') {
    const id = Number(url.split('/')[3])
    const { sort: newSort } = body as { sort: number }
    const idx = products.findIndex((p) => p.id === id)
    if (idx !== -1) {
      products[idx].sort = newSort
      products[idx].updatedAt = new Date().toISOString().slice(0, 10)
      return { code: 0, data: products[idx], message: '排序更新成功' }
    }
    return { code: 404, data: null, message: '产品不存在' }
  }

  if (url.match(/^\/api\/products\/\d+\/category$/) && method === 'PUT') {
    const id = Number(url.split('/')[3])
    const { categoryId } = body as { categoryId: number }
    const idx = products.findIndex((p) => p.id === id)
    if (idx !== -1) {
      products[idx].categoryId = categoryId
      products[idx].updatedAt = new Date().toISOString().slice(0, 10)
      return { code: 0, data: products[idx], message: '分类转移成功' }
    }
    return { code: 404, data: null, message: '产品不存在' }
  }

  if (url.match(/^\/api\/products\/\d+$/) && method === 'PUT') {
    const id = Number(url.split('/').pop())
    const idx = products.findIndex((p) => p.id === id)
    if (idx !== -1) {
      const updates = body as Partial<ProductRecord>
      products[idx] = {
        ...products[idx],
        ...updates,
        purchasePriceWithFreight:
          (updates.lastPurchasePrice ?? products[idx].lastPurchasePrice) +
          (updates.freightAllocation ?? products[idx].freightAllocation),
        updatedAt: new Date().toISOString().slice(0, 10),
      }
      return { code: 0, data: products[idx], message: '更新成功' }
    }
    return { code: 404, data: null, message: '产品不存在' }
  }

  if (url.match(/^\/api\/products\/\d+$/) && method === 'DELETE') {
    const id = Number(url.split('/').pop())
    const idx = products.findIndex((p) => p.id === id)
    if (idx !== -1) {
      products.splice(idx, 1)
      return { code: 0, data: null, message: '删除成功' }
    }
    return { code: 404, data: null, message: '产品不存在' }
  }

  if (url === '/api/products/batch-delete' && method === 'POST') {
    const { ids } = body as { ids: number[] }
    for (const id of ids) {
      const idx = products.findIndex((p) => p.id === id)
      if (idx !== -1) products.splice(idx, 1)
    }
    return { code: 0, data: null, message: '批量删除成功' }
  }

  // ==================== Freight Records ====================
  if (url === '/api/freight-records' && method === 'GET') {
    return { code: 0, data: freightRecords, message: 'ok' }
  }

  return { code: 404, data: null, message: `未找到接口: ${method} ${url}` }
}

// ---------- 工具函数 ----------

function sanitizeUser(user: MockUser) {
  // 不返回 password
   
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
    {
      path: '/product-manage',
      name: 'ProductManage',
      meta: { title: 'menu.productManage', icon: 'AppstoreOutlined' },
    },
  ]
}

/**
 * 递归获取某个分类下的所有子孙分类 ID
 * 用于产品列表过滤时，选中父分类也能展示其所有后代分类的产品
 */
function getDescendantCategoryIds(catId: number): number[] {
  const result: number[] = []
  const children = productCategories.filter((c) => c.parentId === catId)
  for (const child of children) {
    result.push(child.id)
    result.push(...getDescendantCategoryIds(child.id))
  }
  return result
}

/** 构建分类结果：树 + 全量产品总数，递归计算每个分类的产品数（含子分类） */
function buildCategoriesResult(): { tree: ProductCategory[]; totalProducts: number } {
  const map = new Map<number, ProductCategory>()
  const roots: ProductCategory[] = []

  // 1. 直接产品计数（只统计直接挂在该分类下的产品）
  const directCounts: Record<number, number> = {}
  for (const p of products) {
    directCounts[p.categoryId] = (directCounts[p.categoryId] || 0) + 1
  }
  // 2. 克隆分类并写入直接计数
  for (const cat of productCategories) {
    map.set(cat.id, { ...cat, children: [], productCount: directCounts[cat.id] || 0 })
  }

  // 3. 建立父子关系
  for (const cat of map.values()) {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children!.push(cat)
    } else if (!cat.parentId) {
      roots.push(cat)
    } else {
      roots.push(cat)
    }
  }

  // 4. 按 sort 排序
  const sortFn = (a: ProductCategory, b: ProductCategory) => a.sort - b.sort
  roots.sort(sortFn)
  for (const [, cat] of map) {
    if (cat.children) cat.children.sort(sortFn)
  }

  // 5. 递归计算 productCount（自身 + 所有子孙直接计数之和）
  function accumulateCount(cat: ProductCategory): number {
    let total = cat.productCount // 已设置的直接计数
    if (cat.children) {
      for (const child of cat.children) {
        total += accumulateCount(child)
      }
    }
    cat.productCount = total
    return total
  }
  for (const root of roots) {
    accumulateCount(root)
  }

  return { tree: roots, totalProducts: products.length }
}
