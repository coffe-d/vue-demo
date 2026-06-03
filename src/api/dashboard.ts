// ============================================================
// 仪表盘 API — 获取统计数据
// ============================================================

import { api } from './index'

export interface DashboardStats {
  totalUsers: number
  totalOrders: number
  revenue: number
  pendingTasks: number
  weeklyStats: { day: string; orders: number; revenue: number }[]
  recentOrders: { id: string; customer: string; amount: number; status: string; time: string }[]
  monitors: { label: string; percent: number }[]
}

// 获取仪表盘统计
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>('/api/dashboard/stats')
  if (res.code === 0) return res.data
  throw new Error(res.message)
}
