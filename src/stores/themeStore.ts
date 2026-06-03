// ============================================================
// Pinia Setup Store — 主题管理
// 知识点：storeToRefs / $subscribe / $onAction / $patch
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Theme } from '@/types'

const THEME_KEY = 'demo_theme'

function getSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* ignore */
  }
  // 跟随系统偏好
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme)
}

export const useThemeStore = defineStore('theme', () => {
  // ==================== State ====================
  const current = ref<Theme>(getSavedTheme())
  const systemPreference = ref<Theme>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )

  // ==================== Getters ====================
  const isDark = computed(() => current.value === 'dark')
  const isLight = computed(() => current.value === 'light')

  // 主题相关的 CSS 变量（通过 computed 返回）
  const themeColors = computed(() => ({
    bg: isDark.value ? '#1a1a2e' : '#f0f2f5',
    card: isDark.value ? '#16213e' : '#ffffff',
    text: isDark.value ? '#e0e0e0' : '#333333',
    textSecondary: isDark.value ? '#a0a0a0' : '#666666',
    primary: isDark.value ? '#7c83ff' : '#4a5cf7',
    success: isDark.value ? '#4ecca3' : '#52c41a',
    warning: isDark.value ? '#ffc069' : '#faad14',
    danger: isDark.value ? '#ff6b6b' : '#ff4d4f',
    border: isDark.value ? '#2a2a4a' : '#e8e8e8',
  }))

  // ==================== Actions ====================
  function toggle(): void {
    current.value = isDark.value ? 'light' : 'dark'
    saveTheme(current.value)
    applyTheme()
  }

  function setTheme(theme: Theme): void {
    current.value = theme
    saveTheme(theme)
    applyTheme()
  }

  function useSystemPreference(): void {
    current.value = systemPreference.value
    saveTheme(current.value)
    applyTheme()
  }

  // 应用主题到 DOM — 设置 data-theme 属性
  function applyTheme(): void {
    document.documentElement.setAttribute('data-theme', current.value)
    // 设置 CSS 自定义属性
    const colors = themeColors.value
    const root = document.documentElement
    for (const [key, val] of Object.entries(colors)) {
      root.style.setProperty(`--color-${key}`, val)
    }
  }

  // ==================== 初始化 ====================
  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      systemPreference.value = e.matches ? 'dark' : 'light'
    })
  }

  // 初始化时应用主题
  applyTheme()

  return {
    // state
    current,
    systemPreference,
    // getters
    isDark,
    isLight,
    themeColors,
    // actions
    toggle,
    setTheme,
    useSystemPreference,
    applyTheme,
  }
})
