// ============================================================
// Mock 初始数据 —— 模拟后端数据库中的初始数据
// ============================================================

import type { Todo, ProductRecord, ProductCategory, FreightRecord } from '@/types'
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

// ---------- 产品分类表 (最多三级) ----------
export const productCategories: ProductCategory[] = [
  // 一级分类
  { id: 1, name: '建筑材料', parentId: null, level: 1, sort: 1, productCount: 0 },
  { id: 8, name: '五金配件', parentId: null, level: 1, sort: 2, productCount: 0 },
  // 二级分类
  { id: 2, name: '地面材料', parentId: 1, level: 2, sort: 1, productCount: 0 },
  { id: 5, name: '墙面材料', parentId: 1, level: 2, sort: 2, productCount: 0 },
  { id: 9, name: '门窗五金', parentId: 8, level: 2, sort: 1, productCount: 0 },
  { id: 12, name: '卫浴五金', parentId: 8, level: 2, sort: 2, productCount: 0 },
  // 三级分类
  { id: 3, name: '瓷砖', parentId: 2, level: 3, sort: 1, productCount: 0 },
  { id: 4, name: '木地板', parentId: 2, level: 3, sort: 2, productCount: 0 },
  { id: 6, name: '涂料', parentId: 5, level: 3, sort: 1, productCount: 0 },
  { id: 7, name: '墙纸', parentId: 5, level: 3, sort: 2, productCount: 0 },
  { id: 10, name: '门锁', parentId: 9, level: 3, sort: 1, productCount: 0 },
  { id: 11, name: '合页', parentId: 9, level: 3, sort: 2, productCount: 0 },
  { id: 13, name: '水龙头', parentId: 12, level: 3, sort: 1, productCount: 0 },
  { id: 14, name: '花洒', parentId: 12, level: 3, sort: 2, productCount: 0 },
]

// 更新分类的产品数量（根据 products 数据动态计算）
function recalcCategoryCounts() {
  const counts: Record<number, number> = {}
  for (const p of products) {
    counts[p.categoryId] = (counts[p.categoryId] || 0) + 1
  }
  for (const c of productCategories) {
    c.productCount = counts[c.id] || 0
  }
}

// ---------- 产品档案表 ----------
export const products: ProductRecord[] = [
  {
    id: 1,
    code: 'CP-2024-001',
    name: '东鹏瓷砖 800×800mm',
    categoryId: 3,
    spec: '800×800×10mm',
    unit: '箱',
    lastPurchasePrice: 68.0,
    freightAllocation: 3.5,
    purchasePriceWithFreight: 71.5,
    costPrice: 71.5,
    prices: [
      { id: 1, name: '批发价1', price: 88.0 },
      { id: 2, name: '批发价2', price: 95.0 },
      { id: 3, name: '优惠价', price: 82.0 },
      { id: 4, name: '零售价', price: 128.0 },
    ],
    stock: 1250,
    status: 'active',
    sort: 1,
    remark: '',
    createdAt: '2026-01-15',
    updatedAt: '2026-06-01',
  },
  {
    id: 2,
    code: 'CP-2024-002',
    name: '马可波罗瓷砖 600×600mm',
    categoryId: 3,
    spec: '600×600×9mm',
    unit: '箱',
    lastPurchasePrice: 52.0,
    freightAllocation: 2.8,
    purchasePriceWithFreight: 54.8,
    costPrice: 54.8,
    prices: [
      { id: 5, name: '批发价1', price: 68.0 },
      { id: 6, name: '批发价2', price: 75.0 },
      { id: 7, name: '优惠价', price: 63.0 },
      { id: 8, name: '零售价', price: 98.0 },
    ],
    stock: 860,
    status: 'active',
    sort: 2,
    remark: '',
    createdAt: '2026-01-20',
    updatedAt: '2026-06-02',
  },
  {
    id: 3,
    code: 'CP-2024-003',
    name: '圣象强化复合地板 E0级',
    categoryId: 4,
    spec: '1215×195×12mm',
    unit: '㎡',
    lastPurchasePrice: 89.0,
    freightAllocation: 5.0,
    purchasePriceWithFreight: 94.0,
    costPrice: 94.0,
    prices: [
      { id: 9, name: '批发价1', price: 118.0 },
      { id: 10, name: '批发价2', price: 128.0 },
      { id: 11, name: '优惠价', price: 108.0 },
      { id: 12, name: '零售价', price: 168.0 },
    ],
    stock: 520,
    status: 'active',
    sort: 1,
    remark: '',
    createdAt: '2026-02-10',
    updatedAt: '2026-05-28',
  },
  {
    id: 4,
    code: 'CP-2024-004',
    name: '大自然实木地板 橡木',
    categoryId: 4,
    spec: '910×125×18mm',
    unit: '㎡',
    lastPurchasePrice: 285.0,
    freightAllocation: 12.0,
    purchasePriceWithFreight: 297.0,
    costPrice: 297.0,
    prices: [
      { id: 13, name: '批发价1', price: 358.0 },
      { id: 14, name: '批发价2', price: 388.0 },
      { id: 15, name: '优惠价', price: 338.0 },
    ],
    stock: 180,
    status: 'active',
    sort: 2,
    remark: '进口橡木，纹理清晰',
    createdAt: '2026-02-15',
    updatedAt: '2026-06-03',
  },
  {
    id: 5,
    code: 'CP-2024-005',
    name: '多乐士金装净味五合一 5L',
    categoryId: 6,
    spec: '5L/桶',
    unit: '桶',
    lastPurchasePrice: 238.0,
    freightAllocation: 8.0,
    purchasePriceWithFreight: 246.0,
    costPrice: 246.0,
    prices: [
      { id: 16, name: '批发价1', price: 298.0 },
      { id: 17, name: '批发价2', price: 320.0 },
      { id: 18, name: '优惠价', price: 278.0 },
      { id: 19, name: '零售价', price: 398.0 },
    ],
    stock: 340,
    status: 'active',
    sort: 1,
    remark: '',
    createdAt: '2026-03-05',
    updatedAt: '2026-05-30',
  },
  {
    id: 6,
    code: 'CP-2024-006',
    name: '立邦净味120 二合一 18L',
    categoryId: 6,
    spec: '18L/桶',
    unit: '桶',
    lastPurchasePrice: 480.0,
    freightAllocation: 15.0,
    purchasePriceWithFreight: 495.0,
    costPrice: 495.0,
    prices: [
      { id: 20, name: '批发价1', price: 580.0 },
      { id: 21, name: '批发价2', price: 620.0 },
      { id: 22, name: '优惠价', price: 550.0 },
    ],
    stock: 95,
    status: 'active',
    sort: 2,
    remark: '大桶装，工程专用',
    createdAt: '2026-03-08',
    updatedAt: '2026-06-02',
  },
  {
    id: 7,
    code: 'CP-2024-007',
    name: '欧雅无纺布墙纸 欧式',
    categoryId: 7,
    spec: '0.53×10m',
    unit: '卷',
    lastPurchasePrice: 168.0,
    freightAllocation: 6.0,
    purchasePriceWithFreight: 174.0,
    costPrice: 174.0,
    prices: [
      { id: 23, name: '批发价1', price: 218.0 },
      { id: 24, name: '批发价2', price: 238.0 },
      { id: 25, name: '优惠价', price: 198.0 },
    ],
    stock: 420,
    status: 'active',
    sort: 1,
    remark: '',
    createdAt: '2026-03-15',
    updatedAt: '2026-06-01',
  },
  {
    id: 8,
    code: 'CP-2024-008',
    name: '德国玛堡壁纸 现代简约',
    categoryId: 7,
    spec: '0.53×10.05m',
    unit: '卷',
    lastPurchasePrice: 320.0,
    freightAllocation: 10.0,
    purchasePriceWithFreight: 330.0,
    costPrice: 330.0,
    prices: [
      { id: 26, name: '批发价1', price: 398.0 },
      { id: 27, name: '批发价2', price: 428.0 },
      { id: 28, name: '优惠价', price: 368.0 },
      { id: 29, name: '零售价', price: 528.0 },
    ],
    stock: 65,
    status: 'inactive',
    sort: 2,
    remark: '进口壁纸，订货周期长',
    createdAt: '2026-04-01',
    updatedAt: '2026-05-15',
  },
  {
    id: 9,
    code: 'CP-2024-009',
    name: '三环铜锁芯防盗门锁',
    categoryId: 10,
    spec: '60mm铜锁芯',
    unit: '把',
    lastPurchasePrice: 128.0,
    freightAllocation: 4.0,
    purchasePriceWithFreight: 132.0,
    costPrice: 132.0,
    prices: [
      { id: 30, name: '批发价1', price: 168.0 },
      { id: 31, name: '批发价2', price: 185.0 },
      { id: 32, name: '优惠价', price: 155.0 },
    ],
    stock: 280,
    status: 'active',
    sort: 1,
    remark: '',
    createdAt: '2026-04-10',
    updatedAt: '2026-06-04',
  },
  {
    id: 10,
    code: 'CP-2024-010',
    name: '固力304不锈钢门锁',
    categoryId: 10,
    spec: '70mm不锈钢锁芯',
    unit: '把',
    lastPurchasePrice: 215.0,
    freightAllocation: 5.0,
    purchasePriceWithFreight: 220.0,
    costPrice: 220.0,
    prices: [
      { id: 33, name: '批发价1', price: 268.0 },
      { id: 34, name: '批发价2', price: 288.0 },
      { id: 35, name: '优惠价', price: 248.0 },
      { id: 36, name: '零售价', price: 358.0 },
    ],
    stock: 150,
    status: 'active',
    sort: 2,
    remark: '304不锈钢，防锈耐腐蚀',
    createdAt: '2026-04-12',
    updatedAt: '2026-06-01',
  },
  {
    id: 11,
    code: 'CP-2024-011',
    name: '不锈钢轴承合页 4寸',
    categoryId: 11,
    spec: '4×3×2.5mm',
    unit: '副',
    lastPurchasePrice: 15.0,
    freightAllocation: 0.8,
    purchasePriceWithFreight: 15.8,
    costPrice: 15.8,
    prices: [
      { id: 37, name: '批发价1', price: 22.0 },
      { id: 38, name: '批发价2', price: 25.0 },
      { id: 39, name: '优惠价', price: 19.0 },
    ],
    stock: 1800,
    status: 'active',
    sort: 1,
    remark: '',
    createdAt: '2026-04-20',
    updatedAt: '2026-06-05',
  },
  {
    id: 12,
    code: 'CP-2024-012',
    name: '纯铜轴承合页 3寸',
    categoryId: 11,
    spec: '3×2.5×2mm',
    unit: '副',
    lastPurchasePrice: 22.0,
    freightAllocation: 1.0,
    purchasePriceWithFreight: 23.0,
    costPrice: 23.0,
    prices: [
      { id: 40, name: '批发价1', price: 32.0 },
      { id: 41, name: '批发价2', price: 35.0 },
      { id: 42, name: '优惠价', price: 28.0 },
    ],
    stock: 950,
    status: 'active',
    sort: 2,
    remark: '铜质，古典风格',
    createdAt: '2026-04-22',
    updatedAt: '2026-05-28',
  },
  {
    id: 13,
    code: 'CP-2024-013',
    name: '九牧全铜冷热水龙头',
    categoryId: 13,
    spec: 'G1/2 标准接口',
    unit: '个',
    lastPurchasePrice: 168.0,
    freightAllocation: 5.0,
    purchasePriceWithFreight: 173.0,
    costPrice: 173.0,
    prices: [
      { id: 43, name: '批发价1', price: 218.0 },
      { id: 44, name: '批发价2', price: 238.0 },
      { id: 45, name: '优惠价', price: 198.0 },
      { id: 46, name: '零售价', price: 298.0 },
    ],
    stock: 310,
    status: 'active',
    sort: 1,
    remark: '',
    createdAt: '2026-05-05',
    updatedAt: '2026-06-06',
  },
  {
    id: 14,
    code: 'CP-2024-014',
    name: '摩恩三出水花洒套装',
    categoryId: 14,
    spec: '顶喷+手持+下出水',
    unit: '套',
    lastPurchasePrice: 680.0,
    freightAllocation: 20.0,
    purchasePriceWithFreight: 700.0,
    costPrice: 700.0,
    prices: [
      { id: 47, name: '批发价1', price: 880.0 },
      { id: 48, name: '批发价2', price: 950.0 },
      { id: 49, name: '优惠价', price: 820.0 },
    ],
    stock: 85,
    status: 'active',
    sort: 1,
    remark: '',
    createdAt: '2026-05-10',
    updatedAt: '2026-06-04',
  },
  {
    id: 15,
    code: 'CP-2024-015',
    name: '汉斯格雅恒温花洒套装',
    categoryId: 14,
    spec: '空气注入 3速',
    unit: '套',
    lastPurchasePrice: 980.0,
    freightAllocation: 25.0,
    purchasePriceWithFreight: 1005.0,
    costPrice: 1005.0,
    prices: [
      { id: 50, name: '批发价1', price: 1280.0 },
      { id: 51, name: '批发价2', price: 1380.0 },
      { id: 52, name: '优惠价', price: 1180.0 },
      { id: 53, name: '零售价', price: 1680.0 },
    ],
    stock: 32,
    status: 'active',
    sort: 2,
    remark: '德国进口，恒温控制',
    createdAt: '2026-05-15',
    updatedAt: '2026-06-02',
  },
]

// 初始化分类产品数量
recalcCategoryCounts()

// ---------- 运费单表 ----------
export const freightRecords: FreightRecord[] = [
  {
    id: 1,
    billNo: 'HY-2026-001',
    totalAmount: 850.0,
    productAllocations: [
      { productId: 1, amount: 280.0 },
      { productId: 2, amount: 220.0 },
      { productId: 3, amount: 200.0 },
      { productId: 5, amount: 150.0 },
    ],
    createdAt: '2026-06-01',
  },
  {
    id: 2,
    billNo: 'HY-2026-002',
    totalAmount: 620.0,
    productAllocations: [
      { productId: 4, amount: 180.0 },
      { productId: 6, amount: 160.0 },
      { productId: 7, amount: 120.0 },
      { productId: 8, amount: 160.0 },
    ],
    createdAt: '2026-06-03',
  },
]

// 自增 ID 计数器（由 handlers.ts 维护）
export const PRODUCT_INITIAL_ID = 16
export const PRICE_LEVEL_INITIAL_ID = 54
