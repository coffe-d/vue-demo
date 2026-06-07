// ============================================================
// 产品管理 API 层 —— 产品 CRUD、分类、运费单
// ============================================================

import { api } from './index'
import type {
  ProductRecord,
  ProductCategory,
  ProductQueryParams,
  ProductListResult,
  FreightRecord,
} from '@/types'

export const productApi = {
  /** 获取产品分页列表 */
  getList(params?: ProductQueryParams) {
    const query = new URLSearchParams()
    if (params?.categoryId) query.set('categoryId', String(params.categoryId))
    if (params?.keyword) query.set('keyword', params.keyword)
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    if (params?.status) query.set('status', params.status)
    const qs = query.toString()
    return api.get<ProductListResult>(`/api/products${qs ? '?' + qs : ''}`)
  },

  /** 创建产品 */
  create(data: Partial<ProductRecord>) {
    return api.post<ProductRecord>('/api/products', data)
  },

  /** 更新产品 */
  update(id: number, data: Partial<ProductRecord>) {
    return api.put<ProductRecord>(`/api/products/${id}`, data)
  },

  /** 删除产品 */
  delete(id: number) {
    return api.delete(`/api/products/${id}`)
  },

  /** 批量删除 */
  batchDelete(ids: number[]) {
    return api.post('/api/products/batch-delete', { ids })
  },

  /** 更新产品排序 */
  updateSort(id: number, sort: number) {
    return api.put<ProductRecord>(`/api/products/${id}/sort`, { sort })
  },

  /** 转移产品到其他分类 */
  moveCategory(id: number, categoryId: number) {
    return api.put<ProductRecord>(`/api/products/${id}/category`, { categoryId })
  },

  /** 获取分类树 */
  getCategories() {
    return api.get<ProductCategory[]>('/api/categories')
  },

  /** 创建分类 */
  createCategory(data: Partial<ProductCategory>) {
    return api.post<ProductCategory>('/api/categories', data)
  },

  /** 更新分类 */
  updateCategory(id: number, data: Partial<ProductCategory>) {
    return api.put<ProductCategory>(`/api/categories/${id}`, data)
  },

  /** 删除分类 */
  deleteCategory(id: number) {
    return api.delete(`/api/categories/${id}`)
  },

  /** 获取运费单列表 */
  getFreightRecords() {
    return api.get<FreightRecord[]>('/api/freight-records')
  },
}
