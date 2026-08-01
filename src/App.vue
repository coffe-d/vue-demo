<!--
  App.vue — 应用根组件，仅作为路由容器
  布局逻辑在各 layout 文件中独立管理
-->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/themeStore'
import { message } from 'ant-design-vue'

const { locale } = useI18n()
const themeStore = useThemeStore()

// 全局快捷键注册 — 使用 Ctrl+Shift 组合避免与浏览器快捷键冲突
function onGlobalKeydown(e: KeyboardEvent) {
  const isInput =
    (e.target as HTMLElement)?.tagName === 'INPUT' ||
    (e.target as HTMLElement)?.tagName === 'TEXTAREA'
  if (isInput && e.key !== 'Escape') return

  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return

  if (e.key.toLowerCase() === 't') {
    e.preventDefault()
    themeStore.toggle()
  }
  if (e.key.toLowerCase() === 'l') {
    e.preventDefault()
    locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  }
  if (e.key.toLowerCase() === 'k') {
    e.preventDefault()
    message.info('Ctrl+Shift+K: 命令面板')
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <router-view />
</template>
