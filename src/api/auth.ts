// ============================================================
// 认证 API — 登录/登出/获取用户信息
// ============================================================

import { api, setToken } from './index'
import type { User } from '@/types'

interface LoginParams {
  username: string
  password: string
}

interface LoginResult {
  token: string
  user: Omit<User, 'password'>
}

// 登录
export async function login(
  params: LoginParams,
): Promise<{ token: string; user: Omit<User, 'password'> }> {
  const res = await api.post<LoginResult>('/api/auth/login', params)
  if (res.code === 0) {
    setToken(res.data.token)
    return res.data
  }
  throw new Error(res.message)
}

// 登出
export async function logout(): Promise<void> {
  await api.post('/api/auth/logout', { token: localStorage.getItem('app_token') })
  setToken(null)
}

// 获取当前用户信息
export async function getUserInfo(): Promise<Omit<User, 'password'>> {
  const res = await api.get<Omit<User, 'password'>>('/api/auth/userinfo')
  if (res.code === 0) return res.data
  throw new Error(res.message)
}
