// ============================================================
// API 请求层 —— 封装 fetch 请求，统一错误处理
// 知识点：统一的请求封装、类型安全的响应、错误处理
// ============================================================

import type { ApiResult } from '@/types'
import { message } from 'ant-design-vue'

// 基础请求 URL（可为空，mock 拦截 /api/ 开头的请求）
const BASE_URL = ''

// Token 管理
let token: string | null = localStorage.getItem('app_token')

export function getToken(): string | null {
  return token
}

export function setToken(t: string | null): void {
  token = t
  if (t) {
    localStorage.setItem('app_token', t)
  } else {
    localStorage.removeItem('app_token')
  }
}

// 统一请求方法
export async function request<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // 附加 token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    })

    const result: ApiResult<T> = await res.json()

    // Token 过期或无效 → 清除登录状态并跳转登录页
    if (result.code === 401) {
      setToken(null)
      localStorage.removeItem('demo_user')
      localStorage.removeItem('app-tabs')
      // 避免在登录页本身触发 401 时死循环
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login')
      }
      return result
    }

    // 统一错误提示（排除静默处理的场景）
    if (result.code !== 0 && !(options as any).__silent) {
      message.error(result.message || '请求失败')
    }

    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : '网络错误'
    if (!(options as any).__silent) {
      message.error(msg)
    }
    return { code: -1, data: null as unknown as T, message: msg }
  }
}

// 便捷方法
export const api = {
  get<T>(url: string, opts?: RequestInit) {
    return request<T>(url, { ...opts, method: 'GET' })
  },
  post<T>(url: string, data?: unknown, opts?: RequestInit) {
    return request<T>(url, { ...opts, method: 'POST', body: JSON.stringify(data) })
  },
  put<T>(url: string, data?: unknown, opts?: RequestInit) {
    return request<T>(url, { ...opts, method: 'PUT', body: JSON.stringify(data) })
  },
  delete<T>(url: string, opts?: RequestInit) {
    return request<T>(url, { ...opts, method: 'DELETE' })
  },
}
