// ============================================================
// Mock 初始数据 —— 模拟后端数据库中的初始数据
// ============================================================

import type { Todo } from '@/types'
import { Priority, TodoStatus, UserRole } from '@/types'

// ---------- 用户表 ----------
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

// ---------- Todo 表 ----------
export const todos: Todo[] = [
  {
    id: 1,
    title: '学习 Vue3 Composition API',
    description: '掌握 ref、reactive、computed、watch 等核心 API',
    priority: Priority.HIGH,
    status: TodoStatus.IN_PROGRESS,
    createdAt: new Date('2026-05-20'),
    updatedAt: new Date('2026-05-21'),
    tags: ['Vue', '前端'],
  },
  {
    id: 2,
    title: '学习 TypeScript 泛型',
    description: '理解泛型约束、条件类型、映射类型',
    priority: Priority.HIGH,
    status: TodoStatus.TODO,
    createdAt: new Date('2026-05-22'),
    updatedAt: new Date('2026-05-22'),
    tags: ['TypeScript'],
  },
  {
    id: 3,
    title: '学习 Pinia 状态管理',
    description: '掌握 Setup Store 和 Options Store 两种写法',
    priority: Priority.MEDIUM,
    status: TodoStatus.TODO,
    createdAt: new Date('2026-05-25'),
    updatedAt: new Date('2026-05-25'),
    tags: ['Pinia'],
  },
  {
    id: 4,
    title: '写一个综合 Demo 项目',
    description: '把 Vue3 + TS + Pinia 知识点串联起来',
    priority: Priority.LOW,
    status: TodoStatus.DONE,
    createdAt: new Date('2026-05-28'),
    updatedAt: new Date('2026-06-01'),
    tags: ['综合'],
  },
  {
    id: 5,
    title: '复习组合式函数 (Composables)',
    description: '自定义 use 开头的可复用逻辑',
    priority: Priority.MEDIUM,
    status: TodoStatus.TODO,
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    tags: ['Vue'],
  },
]

// ---------- 表格数据 ----------
export interface TableRecord {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  created: string
}

export const tableRecords: TableRecord[] = [
  {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    role: '管理员',
    status: 'active',
    created: '2026-05-20',
  },
  {
    id: 2,
    name: '李四',
    email: 'lisi@example.com',
    role: '编辑',
    status: 'active',
    created: '2026-05-22',
  },
  {
    id: 3,
    name: '王五',
    email: 'wangwu@example.com',
    role: '用户',
    status: 'inactive',
    created: '2026-05-25',
  },
  {
    id: 4,
    name: '赵六',
    email: 'zhaoliu@example.com',
    role: '编辑',
    status: 'active',
    created: '2026-05-28',
  },
  {
    id: 5,
    name: 'Alice',
    email: 'alice@example.com',
    role: '用户',
    status: 'active',
    created: '2026-05-30',
  },
  {
    id: 6,
    name: 'Bob',
    email: 'bob@example.com',
    role: '用户',
    status: 'inactive',
    created: '2026-06-01',
  },
  {
    id: 7,
    name: '陈七',
    email: 'chenqi@example.com',
    role: '管理员',
    status: 'active',
    created: '2026-06-02',
  },
  {
    id: 8,
    name: '周八',
    email: 'zhouba@example.com',
    role: '用户',
    status: 'inactive',
    created: '2026-06-02',
  },
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
    {
      id: 'ORD-001',
      customer: '张三',
      amount: 1299,
      status: 'completed',
      time: '2026-06-02 10:30',
    },
    {
      id: 'ORD-002',
      customer: '李四',
      amount: 599,
      status: 'processing',
      time: '2026-06-02 09:15',
    },
    { id: 'ORD-003', customer: '王五', amount: 2399, status: 'pending', time: '2026-06-01 16:45' },
    { id: 'ORD-004', customer: '赵六', amount: 899, status: 'completed', time: '2026-06-01 14:20' },
    {
      id: 'ORD-005',
      customer: 'Alice',
      amount: 1899,
      status: 'processing',
      time: '2026-06-01 11:00',
    },
  ],
  monitors: [
    { label: 'CPU 使用率', percent: 45 },
    { label: '内存使用率', percent: 72 },
    { label: '磁盘空间', percent: 38 },
    { label: '网络带宽', percent: 15 },
  ],
}
