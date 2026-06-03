// ============================================================
// Auth Store — 认证状态管理（Options API 风格）
// 管理登录/登出/用户信息/token
// 知识点：异步 action、与 API 层交互、localStorage token 持久化
// ============================================================

import { defineStore } from 'pinia'
import type { User } from '@/types'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { getToken, setToken } from '@/api/index'
import { router } from '@/router'

// 从 localStorage 恢复用户
function loadUser(): Omit<User, 'password'> | null {
  try {
    const raw = localStorage.getItem('demo_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: loadUser() as Omit<User, 'password'> | null,
    token: getToken(),
    loginError: null as string | null,
  }),

  getters: {
    isLoggedIn(state): boolean {
      return !!state.token && !!state.user
    },
    userName(state): string {
      return state.user?.username ?? '未登录'
    },
    userRole(state): string {
      return state.user?.role ?? ''
    },
    userAvatar(state): string {
      return state.user?.avatar ?? ''
    },
  },

  actions: {
    // 登录 —— 调用 API
    async login(username: string, password: string): Promise<boolean> {
      this.loginError = null
      try {
        const { token, user } = await loginApi({ username, password })
        this.token = token
        this.user = user as Omit<User, 'password'>
        localStorage.setItem('demo_user', JSON.stringify(user))
        return true
      } catch (e) {
        this.loginError = e instanceof Error ? e.message : '登录失败'
        return false
      }
    },

    // 登出
    async logout(): Promise<void> {
      try {
        await logoutApi()
      } finally {
        this.token = null
        this.user = null
        setToken(null)
        localStorage.removeItem('demo_user')
        router.replace('/login')
      }
    },

    // 更新用户偏好
    updatePreferences(prefs: Record<string, unknown>): void {
      if (this.user) {
        this.user.preferences = { ...this.user.preferences, ...prefs }
        localStorage.setItem('demo_user', JSON.stringify(this.user))
      }
    },
  },
})
