// ============================================================
// TypeScript 知识点演示 — 类型定义文件
// 涵盖：interface / type / enum / generics / utility types / discriminated union
// ============================================================

// ---------- 1. 枚举 (Enum) ----------
// 字符串枚举 — 有实际字符串值的枚举，便于调试和序列化
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// 数字枚举 — 值从 0 开始自动递增
export enum TodoStatus {
  TODO = 0, // 待办
  IN_PROGRESS = 1, // 进行中
  DONE = 2, // 已完成
}

// ---------- 2. interface — 定义对象结构 ----------
// 可扩展、可被类实现。适合描述"实体"
export interface Todo {
  id: number
  title: string
  description?: string // 可选属性
  priority: Priority
  status: TodoStatus
  createdAt: Date
  updatedAt: Date
  tags: string[]
}

// ---------- 3. type — 类型别名 ----------
// 更灵活，支持联合类型、交叉类型、映射类型
// 下面演示一个 可辨识联合 (Discriminated Union)
export type TodoFilter =
  | { type: 'all' } // 显示全部
  | { type: 'byStatus'; status: TodoStatus } // 按状态筛选
  | { type: 'byPriority'; priority: Priority } // 按优先级筛选
  | { type: 'byKeyword'; keyword: string } // 按关键字搜索

// ---------- 4. 泛型接口 (Generic Interface) ----------
// 可复用的通用结构
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

// ---------- 5. Utility Types 演示 ----------
// Partial<T> — 所有属性变为可选（常用于更新操作）
export type TodoUpdate = Partial<
  Pick<Todo, 'title' | 'description' | 'priority' | 'status' | 'tags'>
>

// Pick<T, K> — 从 T 中选取指定属性
export type TodoSummary = Pick<Todo, 'id' | 'title' | 'status'>

// Omit<T, K> — 从 T 中排除指定属性
export type CreateTodoInput = Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>

// Readonly<T> — 所有属性变为只读
export type ReadonlyTodo = Readonly<Todo>

// Record<K, V> — 构造 key 为 K、value 为 V 的对象类型
export type TodoStatsMap = Record<Priority, number>

// ---------- 6. 交叉类型 (Intersection Type) ----------
// 合并多个类型
export type TodoWithMeta = Todo & {
  isOverdue: boolean
  daysSinceCreation: number
}

// ---------- 7. 函数类型 & 泛型约束 ----------
// 泛型函数 — 接受任意类型数组，返回相同类型
export function getFirst<T>(arr: T[]): T | undefined {
  return arr[0]
}

// 泛型约束 — T 必须包含 id 属性
export function findById<T extends { id: number }>(list: T[], id: number): T | undefined {
  return list.find((item) => item.id === id)
}

// ---------- 8. 条件类型 (Conditional Type) ----------
// 根据条件返回不同类型
export type IsString<T> = T extends string ? 'yes' : 'no'

// ---------- 9. 映射类型 + keyof ----------
// 将 Todo 的所有属性变为 boolean 标记
export type TodoFlags = {
  [K in keyof Todo]: boolean
}

// ---------- 10. 用户相关类型 ----------
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

// ---------- 11. 主题相关 ----------
export type Theme = 'light' | 'dark'

// ---------- 12. 组件 Props 类型示例 ----------
// 使用命名空间组织关联类型
export namespace ComponentProps {
  export interface TodoItem {
    todo: Todo
    index: number
    showIndex?: boolean
  }

  export interface TodoForm {
    loading?: boolean
  }

  export interface StatsPanel {
    title: string
    showChart?: boolean
  }
}
