// ============================================================
// main.ts — 应用入口
// 初始化顺序：Mock 服务 → Vue 应用 → Pinia → Router → I18n → Ant Design
// ============================================================

import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'
import './styles/main.css'

// 1. 启动 Mock 服务（开发环境拦截 fetch 模拟后端 API）
import './mock'

// 2. 创建 Vue 应用
const app = createApp(App)

// 3. Pinia 状态管理
const pinia = createPinia()
app.use(pinia)

// 4. Vue Router
app.use(router)

// 5. Vue I18n 国际化
const savedLang = localStorage.getItem('app-lang') || 'zh-CN'
const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN, 'en-US': enUS },
})
app.use(i18n)

// 语言切换时同步到 localStorage
watch(
  () => i18n.global.locale.value,
  (val) => {
    localStorage.setItem('app-lang', val)
  },
)

// 6. Ant Design Vue
app.use(Antd)

// 7. 挂载
app.mount('#app')

console.log('🚀 Vue3 后台管理系统已启动！')
console.log('📡 Mock API 已就绪，拦截 /api/* 请求')
console.log('🔑 可用账号: admin/123456, editor/123456, guest/123456')
