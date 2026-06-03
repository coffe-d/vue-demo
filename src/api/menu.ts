// ============================================================
// 菜单 API — 获取侧边栏菜单
// ============================================================

import { api } from './index'

export interface MenuItem {
  path: string
  name: string
  meta: { title: string; icon: string }
}

// 获取菜单列表
export async function getMenuList(): Promise<MenuItem[]> {
  const res = await api.get<MenuItem[]>('/api/menu/list')
  if (res.code === 0) return res.data
  return []
}
