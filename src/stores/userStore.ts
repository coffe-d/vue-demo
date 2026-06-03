// ============================================================
// Pinia Options Store (选项式风格)
// 知识点：Options Store / state / getters / actions / $subscribe
// ============================================================

import { defineStore } from 'pinia'
import type { User, UserPreferences } from '@/types'
import { UserRole } from '@/types'

// 辅助函数：从 localStorage 读取用户数据
function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('demo_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user: User): void {
  localStorage.setItem('demo_user', JSON.stringify(user))
}

export const useUserStore = defineStore('user', {
  // ==================== State ====================
  // 使用函数返回初始状态对象（与 Vue 2 Options API 的 data 类似）
  state: () => ({
    // 从 localStorage 恢复，如果没有则用默认值
    currentUser: loadUser(),
    isLoggedIn: false,
    loginError: null as string | null,
    lastLoginTime: null as Date | null,
  }),

  // ==================== Getters ====================
  getters: {
    // 基本 getter — 类似 computed
    userName(state): string {
      return state.currentUser?.username ?? '未登录'
    },

    // 使用 this 访问其他 getter
    userAvatar(state): string {
      return state.currentUser?.avatar ?? ''
    },

    // 使用 this 访问 state 和其他 getter
    greeting(): string {
      if (this.isLoggedIn && this.currentUser) {
        const roleLabel = this.currentUser.role === UserRole.ADMIN ? '管理员' : '用户'
        return `你好，${roleLabel} ${this.currentUser.username}！`
      }
      return '请先登录'
    },

    // getter 也可以是函数 — 接收参数
    hasPermission(state) {
      return (requiredRole: UserRole): boolean => {
        if (!state.currentUser) return false
        const roles = [UserRole.GUEST, UserRole.USER, UserRole.ADMIN]
        const userIdx = roles.indexOf(state.currentUser.role)
        const reqIdx = roles.indexOf(requiredRole)
        return userIdx >= reqIdx
      }
    },

    // 用户偏好设置（类型安全）
    preferences(state): UserPreferences | null {
      return state.currentUser?.preferences ?? null
    },
  },

  // ==================== Actions ====================
  actions: {
    // 异步登录
    async login(username: string, password: string): Promise<boolean> {
      this.loginError = null

      try {
        // 模拟 API 请求
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 简单验证（demo 用）
        if (password.length < 3) {
          throw new Error('密码长度不能少于 3 位')
        }

        const user: User = {
          id: Date.now(),
          username,
          email: `${username}@demo.com`,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
          role: username === 'admin' ? UserRole.ADMIN : UserRole.USER,
          preferences: {
            language: 'zh-CN',
            pageSize: 10,
            showCompleted: true,
          },
        }

        this.currentUser = user
        this.isLoggedIn = true
        this.lastLoginTime = new Date()
        saveUser(user)

        return true
      } catch (e) {
        this.loginError = e instanceof Error ? e.message : '登录失败'
        return false
      }
    },

    // 退出登录
    logout(): void {
      this.currentUser = null
      this.isLoggedIn = false
      this.lastLoginTime = null
      localStorage.removeItem('demo_user')
    },

    // 更新偏好设置 — 使用 $patch
    updatePreferences(prefs: Partial<UserPreferences>): void {
      if (this.currentUser) {
        // 方式1: 直接修改（Pinia 会自动追踪）
        this.currentUser.preferences = {
          ...this.currentUser.preferences,
          ...prefs,
        }
        saveUser(this.currentUser)
      }
    },

    // 切换语言
    toggleLanguage(): void {
      if (this.currentUser) {
        const current = this.currentUser.preferences.language
        this.updatePreferences({
          language: current === 'zh-CN' ? 'en-US' : 'zh-CN',
        })
      }
    },
  },

  // ==================== 插件级配置 ====================
  // $subscribe 在组件中通过 store.$subscribe() 调用
})
