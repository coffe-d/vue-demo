// ============================================================
// TypeScript 类型定义 — 系统管理脚手架通用类型
// ============================================================

// ---------- 用户相关 ----------
export interface User {
  id: number
  username: string
  email: string
  avatar: string
  role: UserRole
  preferences: UserPreferences
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export interface UserPreferences {
  language: 'zh-CN' | 'en-US'
  pageSize: number
  showCompleted: boolean
}

// ---------- 主题相关 ----------
export type Theme = 'light' | 'dark'

// ---------- 通用 API 响应 ----------
export interface ApiResult<T = unknown> {
  code: number
  data: T
  message: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginatedList<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// ==================== 系统管理相关类型 ====================

// ---------- 系统菜单 ----------
export interface SysMenu {
  id: number
  parentId: number | null
  name: string                    // 菜单名称
  path: string                    // 路由路径
  component: string               // 组件路径
  icon: string                    // 图标名称
  type: 'menu' | 'button'        // 菜单 or 按钮
  permission: string              // 权限标识
  sort: number                    // 排序
  status: 'enabled' | 'disabled'
  children?: SysMenu[]
  createdAt: string
  updatedAt: string
}

// ---------- 系统字典 ----------
export interface SysDictType {
  id: number
  dictName: string                // 字典名称
  dictCode: string                // 字典编码（唯一标识）
  status: 'enabled' | 'disabled'
  remark: string
  createdAt: string
  updatedAt: string
}

export interface SysDictItem {
  id: number
  dictCode: string                // 所属字典编码
  label: string                   // 字典项标签
  value: string                   // 字典项值
  sort: number
  status: 'enabled' | 'disabled'
  remark: string
  createdAt: string
  updatedAt: string
}

// ---------- 系统用户 ----------
export interface SysUser {
  id: number
  username: string
  nickname: string
  email: string
  phone: string
  avatar: string
  roleId: number
  roleName: string
  status: 'enabled' | 'disabled'
  lastLoginTime: string
  createdAt: string
  updatedAt: string
}

// ---------- 系统角色 ----------
export interface SysRole {
  id: number
  roleName: string                // 角色名称
  roleCode: string                // 角色编码
  description: string
  status: 'enabled' | 'disabled'
  menuIds: number[]               // 拥有的菜单权限 ID 列表
  createdAt: string
  updatedAt: string
}

// ---------- 操作日志 ----------
export interface SysLog {
  id: number
  userId: number
  username: string
  module: string                  // 操作模块
  action: string                  // 操作类型（新增/修改/删除/查询/登录/导出）
  description: string             // 操作描述
  method: string                  // 请求方法
  requestUrl: string              // 请求 URL
  requestParams: string           // 请求参数（JSON 字符串）
  ip: string
  duration: number                // 耗时(ms)
  status: 'success' | 'fail'
  errorMsg: string                // 错误信息
  createdAt: string
}

// ---------- 日志查询参数 ----------
export interface LogQueryParams {
  username?: string
  module?: string
  action?: string
  status?: 'success' | 'fail'
  startTime?: string
  endTime?: string
  page?: number
  pageSize?: number
}
