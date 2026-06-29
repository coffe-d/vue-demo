// ============================================================
// Mock 初始数据 — 系统管理脚手架模拟数据
// ============================================================

import type { SysMenu, SysDictType, SysDictItem, SysUser, SysRole, SysLog } from '@/types'
import { UserRole } from '@/types'

// ---------- 用户表（登录用）----------
export interface MockUser {
  id: number
  username: string
  password: string
  email: string
  avatar: string
  role: UserRole
  preferences: { language: string; pageSize: number; showCompleted: boolean }
}

export const users: MockUser[] = [
  {
    id: 1,
    username: 'admin',
    password: '123456',
    email: 'admin@demo.com',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=admin',
    role: UserRole.ADMIN,
    preferences: { language: 'zh-CN', pageSize: 10, showCompleted: true },
  },
  {
    id: 2,
    username: 'editor',
    password: '123456',
    email: 'editor@demo.com',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=editor',
    role: UserRole.USER,
    preferences: { language: 'zh-CN', pageSize: 10, showCompleted: false },
  },
  {
    id: 3,
    username: 'guest',
    password: '123456',
    email: 'guest@demo.com',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=guest',
    role: UserRole.GUEST,
    preferences: { language: 'en-US', pageSize: 5, showCompleted: true },
  },
]

// ---------- 系统菜单数据 ----------
let menuIdCounter = 100
export const sysMenus: SysMenu[] = [
  { id: 1, parentId: null, name: '主页', path: '/dashboard', component: 'Dashboard.vue', icon: 'HomeOutlined', type: 'menu', permission: 'dashboard', sort: 1, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 2, parentId: null, name: '系统管理', path: '/system', component: '', icon: 'SettingOutlined', type: 'menu', permission: 'system', sort: 2, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 3, parentId: 2, name: '菜单管理', path: '/system/menu', component: 'views/system/MenuManage.vue', icon: 'MenuOutlined', type: 'menu', permission: 'system:menu', sort: 1, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 4, parentId: 2, name: '字典管理', path: '/system/dict', component: 'views/system/DictManage.vue', icon: 'BookOutlined', type: 'menu', permission: 'system:dict', sort: 2, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 5, parentId: 2, name: '用户管理', path: '/system/user', component: 'views/system/UserManage.vue', icon: 'UserOutlined', type: 'menu', permission: 'system:user', sort: 3, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 6, parentId: 2, name: '角色管理', path: '/system/role', component: 'views/system/RoleManage.vue', icon: 'TeamOutlined', type: 'menu', permission: 'system:role', sort: 4, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 7, parentId: 2, name: '日志管理', path: '/system/log', component: 'views/system/LogManage.vue', icon: 'FileTextOutlined', type: 'menu', permission: 'system:log', sort: 5, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  // 按钮级权限
  { id: 8, parentId: 3, name: '新增菜单', path: '', component: '', icon: '', type: 'button', permission: 'system:menu:add', sort: 1, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 9, parentId: 3, name: '编辑菜单', path: '', component: '', icon: '', type: 'button', permission: 'system:menu:edit', sort: 2, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 10, parentId: 3, name: '删除菜单', path: '', component: '', icon: '', type: 'button', permission: 'system:menu:delete', sort: 3, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 11, parentId: 5, name: '新增用户', path: '', component: '', icon: '', type: 'button', permission: 'system:user:add', sort: 1, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 12, parentId: 5, name: '编辑用户', path: '', component: '', icon: '', type: 'button', permission: 'system:user:edit', sort: 2, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 13, parentId: 5, name: '删除用户', path: '', component: '', icon: '', type: 'button', permission: 'system:user:delete', sort: 3, status: 'enabled', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]

// ---------- 字典类型 ----------
export const sysDictTypes: SysDictType[] = [
  { id: 1, dictName: '用户状态', dictCode: 'user_status', status: 'enabled', remark: '系统用户状态', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 2, dictName: '操作类型', dictCode: 'log_action', status: 'enabled', remark: '日志操作类型枚举', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 3, dictName: '性别', dictCode: 'gender', status: 'enabled', remark: '用户性别', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]

// ---------- 字典项 ----------
export const sysDictItems: SysDictItem[] = [
  { id: 1, dictCode: 'user_status', label: '启用', value: 'enabled', sort: 1, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 2, dictCode: 'user_status', label: '禁用', value: 'disabled', sort: 2, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 3, dictCode: 'log_action', label: '新增', value: 'create', sort: 1, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 4, dictCode: 'log_action', label: '修改', value: 'update', sort: 2, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 5, dictCode: 'log_action', label: '删除', value: 'delete', sort: 3, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 6, dictCode: 'log_action', label: '查询', value: 'query', sort: 4, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 7, dictCode: 'log_action', label: '登录', value: 'login', sort: 5, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 8, dictCode: 'gender', label: '男', value: 'male', sort: 1, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 9, dictCode: 'gender', label: '女', value: 'female', sort: 2, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 10, dictCode: 'gender', label: '保密', value: 'unknown', sort: 3, status: 'enabled', remark: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]

// ---------- 系统用户 ----------
export const sysUsers: SysUser[] = [
  { id: 1, username: 'admin', nickname: '超级管理员', email: 'admin@example.com', phone: '13800000001', avatar: '', roleId: 1, roleName: '超级管理员', status: 'enabled', lastLoginTime: '2026-06-28 09:30:00', createdAt: '2026-01-01', updatedAt: '2026-06-28' },
  { id: 2, username: 'zhangsan', nickname: '张三', email: 'zhangsan@example.com', phone: '13800000002', avatar: '', roleId: 2, roleName: '普通用户', status: 'enabled', lastLoginTime: '2026-06-27 14:20:00', createdAt: '2026-02-15', updatedAt: '2026-06-20' },
  { id: 3, username: 'lisi', nickname: '李四', email: 'lisi@example.com', phone: '13800000003', avatar: '', roleId: 3, roleName: '编辑', status: 'enabled', lastLoginTime: '2026-06-26 11:10:00', createdAt: '2026-03-10', updatedAt: '2026-05-15' },
  { id: 4, username: 'wangwu', nickname: '王五', email: 'wangwu@example.com', phone: '13800000004', avatar: '', roleId: 2, roleName: '普通用户', status: 'disabled', lastLoginTime: '2026-05-01 08:00:00', createdAt: '2026-03-20', updatedAt: '2026-06-01' },
  { id: 5, username: 'zhaoliu', nickname: '赵六', email: 'zhaoliu@example.com', phone: '13800000005', avatar: '', roleId: 3, roleName: '编辑', status: 'enabled', lastLoginTime: '2026-06-25 16:45:00', createdAt: '2026-04-01', updatedAt: '2026-06-15' },
]

// ---------- 系统角色 ----------
export const sysRoles: SysRole[] = [
  { id: 1, roleName: '超级管理员', roleCode: 'admin', description: '拥有系统全部权限', status: 'enabled', menuIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 2, roleName: '普通用户', roleCode: 'user', description: '只读权限，可查看主页和系统管理', status: 'enabled', menuIds: [1, 2, 3, 4, 5, 6, 7], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 3, roleName: '编辑', roleCode: 'editor', description: '可增删改但不能管理菜单和角色', status: 'enabled', menuIds: [1, 2, 4, 5, 7], createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]

// ---------- 操作日志 ----------
export const sysLogs: SysLog[] = [
  { id: 1, userId: 1, username: 'admin', module: '用户管理', action: 'create', description: '新增用户：张三', method: 'POST', requestUrl: '/api/system/user', requestParams: '{"username":"zhangsan"}', ip: '192.168.1.100', duration: 45, status: 'success', errorMsg: '', createdAt: '2026-06-28 09:30:00' },
  { id: 2, userId: 2, username: 'zhangsan', module: '系统管理', action: 'login', description: '用户登录', method: 'POST', requestUrl: '/api/auth/login', requestParams: '{"username":"zhangsan"}', ip: '192.168.1.101', duration: 120, status: 'success', errorMsg: '', createdAt: '2026-06-28 09:25:00' },
  { id: 3, userId: 1, username: 'admin', module: '角色管理', action: 'update', description: '修改角色：普通用户', method: 'PUT', requestUrl: '/api/system/role/2', requestParams: '{"roleName":"普通用户"}', ip: '192.168.1.100', duration: 35, status: 'success', errorMsg: '', createdAt: '2026-06-28 09:20:00' },
  { id: 4, userId: 1, username: 'admin', module: '菜单管理', action: 'update', description: '修改菜单：系统管理', method: 'PUT', requestUrl: '/api/system/menu/2', requestParams: '{"name":"系统管理"}', ip: '192.168.1.100', duration: 28, status: 'success', errorMsg: '', createdAt: '2026-06-28 09:15:00' },
  { id: 5, userId: 3, username: 'lisi', module: '字典管理', action: 'query', description: '查询字典类型列表', method: 'GET', requestUrl: '/api/system/dict/type/list', requestParams: '{}', ip: '192.168.1.102', duration: 15, status: 'success', errorMsg: '', createdAt: '2026-06-28 09:10:00' },
  { id: 6, userId: 1, username: 'admin', module: '用户管理', action: 'delete', description: '删除用户：test_user', method: 'DELETE', requestUrl: '/api/system/user/99', requestParams: '{}', ip: '192.168.1.100', duration: 50, status: 'fail', errorMsg: '用户不存在', createdAt: '2026-06-28 09:05:00' },
  { id: 7, userId: 2, username: 'zhangsan', module: '用户管理', action: 'update', description: '修改个人信息', method: 'PUT', requestUrl: '/api/system/user/2', requestParams: '{"nickname":"张三"}', ip: '192.168.1.101', duration: 30, status: 'success', errorMsg: '', createdAt: '2026-06-27 18:00:00' },
  { id: 8, userId: 1, username: 'admin', module: '角色管理', action: 'create', description: '新增角色：测试角色', method: 'POST', requestUrl: '/api/system/role', requestParams: '{"roleName":"测试角色"}', ip: '192.168.1.100', duration: 22, status: 'success', errorMsg: '', createdAt: '2026-06-27 16:30:00' },
  { id: 9, userId: 3, username: 'lisi', module: '用户管理', action: 'query', description: '查询用户列表', method: 'GET', requestUrl: '/api/system/user/list', requestParams: '{"page":1}', ip: '192.168.1.102', duration: 18, status: 'success', errorMsg: '', createdAt: '2026-06-27 15:00:00' },
  { id: 10, userId: 1, username: 'admin', module: '菜单管理', action: 'create', description: '新增菜单：日志管理', method: 'POST', requestUrl: '/api/system/menu', requestParams: '{"name":"日志管理"}', ip: '192.168.1.100', duration: 25, status: 'success', errorMsg: '', createdAt: '2026-06-27 14:00:00' },
  { id: 11, userId: 1, username: 'admin', module: '系统管理', action: 'export', description: '导出日志数据', method: 'GET', requestUrl: '/api/system/log/export', requestParams: '{"startTime":"2026-06-01"}', ip: '192.168.1.100', duration: 350, status: 'success', errorMsg: '', createdAt: '2026-06-27 10:00:00' },
  { id: 12, userId: 2, username: 'zhangsan', module: '系统管理', action: 'login', description: '用户登录', method: 'POST', requestUrl: '/api/auth/login', requestParams: '{"username":"zhangsan"}', ip: '192.168.1.101', duration: 140, status: 'fail', errorMsg: '密码错误', createdAt: '2026-06-27 09:50:00' },
]

// ---------- 仪表盘数据 ----------
export const dashboardData = {
  totalUsers: 12846,
  totalOrders: 3842,
  revenue: 56800,
  pendingTasks: 3,
  weeklyStats: [
    { day: 'Mon', orders: 120, revenue: 12000 },
    { day: 'Tue', orders: 180, revenue: 16000 },
    { day: 'Wed', orders: 150, revenue: 14000 },
    { day: 'Thu', orders: 200, revenue: 22000 },
    { day: 'Fri', orders: 240, revenue: 25000 },
    { day: 'Sat', orders: 100, revenue: 9000 },
    { day: 'Sun', orders: 80, revenue: 7000 },
  ],
  recentOrders: [
    { id: 'ORD-001', customer: '张三', amount: 1299, status: 'completed', time: '2026-06-02 10:30' },
    { id: 'ORD-002', customer: '李四', amount: 599, status: 'processing', time: '2026-06-02 09:15' },
    { id: 'ORD-003', customer: '王五', amount: 2399, status: 'pending', time: '2026-06-01 16:45' },
    { id: 'ORD-004', customer: '赵六', amount: 899, status: 'completed', time: '2026-06-01 14:20' },
    { id: 'ORD-005', customer: 'Alice', amount: 1899, status: 'processing', time: '2026-06-01 11:00' },
  ],
  monitors: [
    { label: 'CPU 使用率', percent: 45 },
    { label: '内存使用率', percent: 72 },
    { label: '磁盘空间', percent: 38 },
    { label: '网络带宽', percent: 15 },
  ],
}

// ID 计数器
export let menuIdSeq = 14
export let dictTypeIdSeq = 4
export let dictItemIdSeq = 11
export let userIdSeq = 6
export let roleIdSeq = 4
export let logIdSeq = 13
