// ============================================================
// 表格数据 API — CRUD 操作
// ============================================================

import { api } from './index'

export interface TableRecord {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  created: string
}

interface ListResult {
  items: TableRecord[]
  total: number
}

// 获取列表
export async function getTableList(): Promise<ListResult> {
  const res = await api.get<ListResult>('/api/table/list')
  if (res.code === 0) return res.data
  return { items: [], total: 0 }
}

// 创建记录
export async function createRecord(data: Omit<TableRecord, 'id'>): Promise<TableRecord> {
  const res = await api.post<TableRecord>('/api/table/create', data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

// 更新记录
export async function updateRecord(id: number, data: Partial<TableRecord>): Promise<TableRecord> {
  const res = await api.put<TableRecord>(`/api/table/${id}`, data)
  if (res.code === 0) return res.data
  throw new Error(res.message)
}

// 删除记录
export async function deleteRecord(id: number): Promise<void> {
  await api.delete(`/api/table/${id}`)
}

// 批量删除
export async function batchDeleteRecords(ids: number[]): Promise<void> {
  await api.post('/api/table/batch-delete', { ids })
}
