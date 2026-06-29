// ============================================================
// Mock 请求处理器 — 系统管理脚手架 API 模拟
// ============================================================

import {
  users,
  sysMenus,
  sysDictTypes,
  sysDictItems,
  sysUsers,
  sysRoles,
  sysLogs,
  dashboardData,
  menuIdSeq,
  dictTypeIdSeq,
  dictItemIdSeq,
  userIdSeq,
  roleIdSeq,
  logIdSeq,
} from './data'
import type { MockUser } from './data'
import type { SysMenu, SysDictType, SysDictItem, SysUser, SysRole, SysLog } from '@/types'

// 统一响应结构
export interface ApiResult<T = unknown> {
  code: number
  data: T
  message: string
}

const sessions = new Map<string, MockUser>()
function makeToken(): string { return 'mock_token_' + Math.random().toString(36).slice(2) }

let _menuIdSeq = menuIdSeq
let _dictTypeIdSeq = dictTypeIdSeq
let _dictItemIdSeq = dictItemIdSeq
let _userIdSeq = userIdSeq
let _roleIdSeq = roleIdSeq
let _logIdSeq = logIdSeq

export async function handleRequest(url: string, method: string, body: unknown): Promise<ApiResult> {
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 200))

  // ==================== Auth ====================
  if (url === '/api/auth/login' && method === 'POST') {
    const { username, password } = body as { username: string; password: string }
    const user = users.find((u) => u.username === username && u.password === password)
    if (!user) return { code: 401, data: null, message: '用户名或密码错误' }
    const token = makeToken()
    sessions.set(token, user)
    // 记录登录日志
    addLog({ userId: user.id, username: user.username, module: '系统管理', action: 'login', description: '用户登录', method: 'POST', requestUrl: '/api/auth/login', ip: '127.0.0.1', duration: Math.floor(Math.random() * 200), status: 'success' })
    return { code: 0, data: { token, user: sanitizeUser(user) }, message: '登录成功' }
  }
  if (url === '/api/auth/logout' && method === 'POST') {
    const { token } = body as { token: string }
    sessions.delete(token)
    return { code: 0, data: null, message: '已退出' }
  }
  if (url === '/api/auth/userinfo' && method === 'GET') {
    const entries = [...sessions.entries()]
    if (entries.length > 0) return { code: 0, data: sanitizeUser(entries[0][1]), message: 'ok' }
    return { code: 401, data: null, message: '未登录' }
  }

  // ==================== Dashboard ====================
  if (url === '/api/dashboard/stats' && method === 'GET') {
    return { code: 0, data: dashboardData, message: 'ok' }
  }

  // ==================== Menu ====================
  if (url === '/api/system/menu/tree' && method === 'GET') {
    return { code: 0, data: buildMenuTree(), message: 'ok' }
  }
  if (url === '/api/system/menu/list' && method === 'GET') {
    return { code: 0, data: [...sysMenus], message: 'ok' }
  }
  if (url === '/api/system/menu' && method === 'POST') {
    const input = body as Partial<SysMenu>
    const menu: SysMenu = {
      id: _menuIdSeq++, parentId: input.parentId ?? null, name: input.name || '',
      path: input.path || '', component: input.component || '', icon: input.icon || '',
      type: input.type || 'menu', permission: input.permission || '', sort: input.sort || 0,
      status: input.status || 'enabled', createdAt: now(), updatedAt: now(),
    }
    sysMenus.push(menu)
    return { code: 0, data: menu, message: '创建成功' }
  }
  if (url.match(/^\/api\/system\/menu\/\d+$/) && method === 'PUT') {
    return updateById(sysMenus, url, body as Partial<SysMenu>, '菜单')
  }
  if (url.match(/^\/api\/system\/menu\/\d+$/) && method === 'DELETE') {
    return deleteById(sysMenus, url, '菜单', (item) => {
      // 删除子菜单
      const children = sysMenus.filter((m) => m.parentId === item.id)
      for (const c of children) {
        const idx = sysMenus.indexOf(c)
        if (idx !== -1) sysMenus.splice(idx, 1)
      }
    })
  }

  // ==================== Dict Type ====================
  if (url === '/api/system/dict/type/list' && method === 'GET') {
    return { code: 0, data: [...sysDictTypes], message: 'ok' }
  }
  if (url === '/api/system/dict/type' && method === 'POST') {
    const input = body as Partial<SysDictType>
    const item: SysDictType = {
      id: _dictTypeIdSeq++, dictName: input.dictName || '', dictCode: input.dictCode || '',
      status: input.status || 'enabled', remark: input.remark || '', createdAt: now(), updatedAt: now(),
    }
    sysDictTypes.push(item)
    return { code: 0, data: item, message: '创建成功' }
  }
  if (url.match(/^\/api\/system\/dict\/type\/\d+$/) && method === 'PUT') {
    return updateById(sysDictTypes, url, body as Partial<SysDictType>, '字典类型')
  }
  if (url.match(/^\/api\/system\/dict\/type\/\d+$/) && method === 'DELETE') {
    return deleteById(sysDictTypes, url, '字典类型', (item) => {
      // 同时删除该字典下的所有字典项
      for (let i = sysDictItems.length - 1; i >= 0; i--) {
        if (sysDictItems[i].dictCode === item.dictCode) sysDictItems.splice(i, 1)
      }
    })
  }

  // ==================== Dict Item ====================
  if (url.match(/^\/api\/system\/dict\/items\/(.+)$/) && method === 'GET') {
    const dictCode = url.split('/').pop()!
    const items = sysDictItems.filter((d) => d.dictCode === dictCode).sort((a, b) => a.sort - b.sort)
    return { code: 0, data: items, message: 'ok' }
  }
  if (url === '/api/system/dict/item' && method === 'POST') {
    const input = body as Partial<SysDictItem>
    const item: SysDictItem = {
      id: _dictItemIdSeq++, dictCode: input.dictCode || '', label: input.label || '',
      value: input.value || '', sort: input.sort || 0, status: input.status || 'enabled',
      remark: input.remark || '', createdAt: now(), updatedAt: now(),
    }
    sysDictItems.push(item)
    return { code: 0, data: item, message: '创建成功' }
  }
  if (url.match(/^\/api\/system\/dict\/item\/\d+$/) && method === 'PUT') {
    return updateById(sysDictItems, url, body as Partial<SysDictItem>, '字典项')
  }
  if (url.match(/^\/api\/system\/dict\/item\/\d+$/) && method === 'DELETE') {
    return deleteById(sysDictItems, url, '字典项')
  }

  // ==================== User ====================
  if (url === '/api/system/user/list' && method === 'GET') {
    let filtered = [...sysUsers]
    if (body && typeof body === 'object') {
      const params = body as Record<string, string>
      if (params.username) filtered = filtered.filter((u) => u.username.includes(params.username))
      if (params.nickname) filtered = filtered.filter((u) => u.nickname.includes(params.nickname))
      if (params.status) filtered = filtered.filter((u) => u.status === params.status)
    }
    const page = Number((body as any)?.page) || 1
    const pageSize = Number((body as any)?.pageSize) || 10
    const total = filtered.length
    const start = (page - 1) * pageSize
    return { code: 0, data: { items: filtered.slice(start, start + pageSize), total, page, pageSize }, message: 'ok' }
  }
  if (url === '/api/system/user' && method === 'POST') {
    const input = body as Partial<SysUser & { password: string }>
    const user: SysUser = {
      id: _userIdSeq++, username: input.username || '', nickname: input.nickname || '',
      email: input.email || '', phone: input.phone || '', avatar: '',
      roleId: input.roleId || 2, roleName: input.roleName || '普通用户',
      status: input.status || 'enabled', lastLoginTime: '',
      createdAt: now(), updatedAt: now(),
    }
    sysUsers.push(user)
    return { code: 0, data: user, message: '创建成功' }
  }
  if (url.match(/^\/api\/system\/user\/\d+$/) && method === 'PUT') {
    return updateById(sysUsers, url, body as Partial<SysUser>, '用户')
  }
  if (url.match(/^\/api\/system\/user\/\d+$/) && method === 'DELETE') {
    return deleteById(sysUsers, url, '用户')
  }

  // ==================== Role ====================
  if (url === '/api/system/role/list' && method === 'GET') {
    return { code: 0, data: [...sysRoles], message: 'ok' }
  }
  if (url === '/api/system/role' && method === 'POST') {
    const input = body as Partial<SysRole>
    const role: SysRole = {
      id: _roleIdSeq++, roleName: input.roleName || '', roleCode: input.roleCode || '',
      description: input.description || '', status: input.status || 'enabled',
      menuIds: input.menuIds || [], createdAt: now(), updatedAt: now(),
    }
    sysRoles.push(role)
    return { code: 0, data: role, message: '创建成功' }
  }
  if (url.match(/^\/api\/system\/role\/\d+$/) && method === 'PUT') {
    return updateById(sysRoles, url, body as Partial<SysRole>, '角色')
  }
  if (url.match(/^\/api\/system\/role\/\d+$/) && method === 'DELETE') {
    return deleteById(sysRoles, url, '角色')
  }

  // ==================== Log ====================
  if (url === '/api/system/log/list' && method === 'GET') {
    let filtered = [...sysLogs].sort((a, b) => b.id - a.id)
    if (body && typeof body === 'object') {
      const params = body as Record<string, string>
      if (params.username) filtered = filtered.filter((l) => l.username.includes(params.username))
      if (params.module) filtered = filtered.filter((l) => l.module.includes(params.module))
      if (params.action) filtered = filtered.filter((l) => l.action === params.action)
      if (params.status) filtered = filtered.filter((l) => l.status === params.status)
    }
    const page = Number((body as any)?.page) || 1
    const pageSize = Number((body as any)?.pageSize) || 10
    const total = filtered.length
    const start = (page - 1) * pageSize
    return { code: 0, data: { items: filtered.slice(start, start + pageSize), total, page, pageSize }, message: 'ok' }
  }
  if (url.match(/^\/api\/system\/log\/\d+$/) && method === 'GET') {
    const id = Number(url.split('/').pop())
    const item = sysLogs.find((l) => l.id === id)
    if (item) return { code: 0, data: item, message: 'ok' }
    return { code: 404, data: null, message: '日志不存在' }
  }
  if (url === '/api/system/log/clear' && method === 'DELETE') {
    sysLogs.length = 0
    _logIdSeq = 1
    return { code: 0, data: null, message: '日志已清空' }
  }

  return { code: 404, data: null, message: `未找到接口: ${method} ${url}` }
}

// ==================== 工具函数 ====================

function sanitizeUser(user: MockUser) {
  const { password: _pw, ...rest } = user
  return rest
}

function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function buildMenuTree(): SysMenu[] {
  const map = new Map<number, SysMenu>()
  const roots: SysMenu[] = []
  for (const m of sysMenus) {
    map.set(m.id, { ...m, children: [] })
  }
  for (const m of map.values()) {
    if (m.parentId && map.has(m.parentId)) {
      map.get(m.parentId)!.children!.push(m)
    } else {
      roots.push(m)
    }
  }
  // 排序
  const sortFn = (a: SysMenu, b: SysMenu) => a.sort - b.sort
  roots.sort(sortFn)
  for (const [, m] of map) {
    if (m.children) m.children.sort(sortFn)
  }
  return roots
}

function findById<T extends { id: number }>(arr: T[], url: string): { item: T; idx: number } | null {
  const id = Number(url.split('/').pop())
  const idx = arr.findIndex((m: T) => m.id === id)
  if (idx !== -1) return { item: arr[idx], idx }
  return null
}

function updateById<T extends { id: number; updatedAt: string }>(
  arr: T[], url: string, body: Partial<T>, name: string,
): ApiResult<T> {
  const found = findById(arr, url)
  if (found) {
    arr[found.idx] = { ...found.item, ...body, id: found.item.id, updatedAt: now() }
    return { code: 0, data: arr[found.idx], message: `${name}更新成功` }
  }
  return { code: 404, data: null as unknown as T, message: `${name}不存在` }
}

function deleteById<T extends { id: number }>(
  arr: T[], url: string, name: string, onDelete?: (item: T) => void,
): ApiResult<null> {
  const found = findById(arr, url)
  if (found) {
    if (onDelete) onDelete(found.item)
    arr.splice(found.idx, 1)
    return { code: 0, data: null, message: `${name}删除成功` }
  }
  return { code: 404, data: null, message: `${name}不存在` }
}

function addLog(log: Partial<SysLog>) {
  sysLogs.push({
    id: _logIdSeq++,
    userId: log.userId || 0, username: log.username || '',
    module: log.module || '', action: log.action || 'query',
    description: log.description || '', method: log.method || 'GET',
    requestUrl: log.requestUrl || '', requestParams: log.requestParams || '{}',
    ip: log.ip || '127.0.0.1', duration: log.duration || 0,
    status: log.status || 'success', errorMsg: log.errorMsg || '',
    createdAt: now(),
  })
}
