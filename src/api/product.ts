// ============================================================
// 产品管理 API 层 — 产品 CRUD、分类管理、运费单
// ============================================================
// 知识点：
// - 业务 API 的模块化组织（按领域拆分为 productApi 命名空间）
// - 基于统一 request 封装，统一返回 ApiResult<T> 结构
// - URL 参数序列化（URLSearchParams 构建 query string）
// ============================================================

import { api } from './index'
import type {
  ProductRecord,
  ProductCategory,
  ProductQueryParams,
  ProductListResult,
  CategoriesResult,
  FreightRecord,
} from '@/types'

/**
 * 产品管理 API 命名空间
 * 所有产品相关接口集中管理，便于调用和维护
 */
export const productApi = {
  // ==================== 产品 CRUD ====================

  /**
   * 获取产品分页列表
   * @param params - 查询参数：分类ID / 关键字 / 页码 / 每页条数 / 状态
   * @returns 分页结果（含 list + total + page + pageSize）
   */
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

  /** 删除单个产品 */
  delete(id: number) {
    return api.delete(`/api/products/${id}`)
  },

  /** 批量删除产品 */
  batchDelete(ids: number[]) {
    return api.post('/api/products/batch-delete', { ids })
  },

  /**
   * 更新产品排序序号
   * 拖拽排序后调用，将当前列表位置持久化
   */
  updateSort(id: number, sort: number) {
    return api.put<ProductRecord>(`/api/products/${id}/sort`, { sort })
  },

  /**
   * 转移产品到其他分类
   * 支持拖拽到分类节点 或 右键菜单操作
   */
  moveCategory(id: number, categoryId: number) {
    return api.put<ProductRecord>(`/api/products/${id}/category`, { categoryId })
  },

  // ==================== 分类管理 ====================

  /** 获取分类树 + 全量产品总数 + 各分类递归产品数 */
  getCategories() {
    return api.get<CategoriesResult>('/api/categories')
  },

  /** 创建分类 */
  createCategory(data: Partial<ProductCategory>) {
    return api.post<ProductCategory>('/api/categories', data)
  },

  /** 更新分类 */
  updateCategory(id: number, data: Partial<ProductCategory>) {
    return api.put<ProductCategory>(`/api/categories/${id}`, data)
  },

  /**
   * 删除分类（Mock 中会级联删除子分类，
   * 并将子分类下的产品移到父分类）
   */
  deleteCategory(id: number) {
    return api.delete(`/api/categories/${id}`)
  },

  // ==================== 运费单 ====================

  /** 获取运费单列表 */
  getFreightRecords() {
    return api.get<FreightRecord[]>('/api/freight-records')
  },
}
