// ============================================================
// 系统管理 API — 菜单/字典/用户/角色/日志 CRUD
// ============================================================

import { api } from './index'
import type {
  SysMenu,
  SysDictType,
  SysDictItem,
  SysUser,
  SysRole,
  SysLog,
  LogQueryParams,
  PaginatedList,
} from '@/types'

// ==================== 菜单管理 ====================

export async function getMenuTree(): Promise<SysMenu[]> {
  const res = await api.get<SysMenu[]>('/api/system/menu/tree')
  if (res.code === 0) return res.data
  return []
}

export async function getMenuList(): Promise<SysMenu[]> {
  const res = await api.get<SysMenu[]>('/api/system/menu/list')
  if (res.code === 0) return res.data
  return []
}

export async function createMenu(data: Partial<SysMenu>): Promise<SysMenu> {
  const res = await api.post<SysMenu>('/api/system/menu', data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function updateMenu(id: number, data: Partial<SysMenu>): Promise<SysMenu> {
  const res = await api.put<SysMenu>(`/api/system/menu/${id}`, data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function deleteMenu(id: number): Promise<void> {
  const res = await api.delete(`/api/system/menu/${id}`)
  if (res.code !== 0) throw new Error(res.message)
}

// ==================== 字典管理 ====================

export async function getDictTypeList(): Promise<SysDictType[]> {
  const res = await api.get<SysDictType[]>('/api/system/dict/type/list')
  if (res.code === 0) return res.data
  return []
}

export async function createDictType(data: Partial<SysDictType>): Promise<SysDictType> {
  const res = await api.post<SysDictType>('/api/system/dict/type', data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function updateDictType(id: number, data: Partial<SysDictType>): Promise<SysDictType> {
  const res = await api.put<SysDictType>(`/api/system/dict/type/${id}`, data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function deleteDictType(id: number): Promise<void> {
  const res = await api.delete(`/api/system/dict/type/${id}`)
  if (res.code !== 0) throw new Error(res.message)
}

export async function getDictItems(dictCode: string): Promise<SysDictItem[]> {
  const res = await api.get<SysDictItem[]>(`/api/system/dict/items/${dictCode}`)
  if (res.code === 0) return res.data
  return []
}

export async function createDictItem(data: Partial<SysDictItem>): Promise<SysDictItem> {
  const res = await api.post<SysDictItem>('/api/system/dict/item', data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function updateDictItem(id: number, data: Partial<SysDictItem>): Promise<SysDictItem> {
  const res = await api.put<SysDictItem>(`/api/system/dict/item/${id}`, data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function deleteDictItem(id: number): Promise<void> {
  const res = await api.delete(`/api/system/dict/item/${id}`)
  if (res.code !== 0) throw new Error(res.message)
}

// ==================== 用户管理 ====================

export async function getUserList(params?: Record<string, unknown>): Promise<PaginatedList<SysUser>> {
  const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
  const res = await api.get<PaginatedList<SysUser>>('/api/system/user/list' + query)
  if (res.code === 0) return res.data
  return { items: [], total: 0, page: 1, pageSize: 10 }
}

export async function createUser(data: Partial<SysUser & { password: string }>): Promise<SysUser> {
  const res = await api.post<SysUser>('/api/system/user', data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function updateUser(id: number, data: Partial<SysUser>): Promise<SysUser> {
  const res = await api.put<SysUser>(`/api/system/user/${id}`, data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function deleteUser(id: number): Promise<void> {
  const res = await api.delete(`/api/system/user/${id}`)
  if (res.code !== 0) throw new Error(res.message)
}

// ==================== 角色管理 ====================

export async function getRoleList(): Promise<SysRole[]> {
  const res = await api.get<SysRole[]>('/api/system/role/list')
  if (res.code === 0) return res.data
  return []
}

export async function createRole(data: Partial<SysRole>): Promise<SysRole> {
  const res = await api.post<SysRole>('/api/system/role', data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function updateRole(id: number, data: Partial<SysRole>): Promise<SysRole> {
  const res = await api.put<SysRole>(`/api/system/role/${id}`, data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function deleteRole(id: number): Promise<void> {
  const res = await api.delete(`/api/system/role/${id}`)
  if (res.code !== 0) throw new Error(res.message)
}

// ==================== 日志管理 ====================

export async function getLogList(params?: LogQueryParams): Promise<PaginatedList<SysLog>> {
  const query = params ? '?' + new URLSearchParams(params as unknown as Record<string, string>).toString() : ''
  const res = await api.get<PaginatedList<SysLog>>('/api/system/log/list' + query)
  if (res.code === 0) return res.data
  return { items: [], total: 0, page: 1, pageSize: 10 }
}

export async function getLogDetail(id: number): Promise<SysLog> {
  const res = await api.get<SysLog>(`/api/system/log/${id}`)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

export async function clearLogs(): Promise<void> {
  const res = await api.delete('/api/system/log/clear')
  if (res.code !== 0) throw new Error(res.message)
}
