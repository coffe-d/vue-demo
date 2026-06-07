// ============================================================
// Vue Router 配置 —— 路由即菜单的唯一配置源
// 知识点：嵌套路由、路由懒加载、meta 元信息、导航守卫
// 新增页面只需在此添加路由即可，菜单自动生成
// ============================================================

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 扩展 RouteMeta — 声明自定义 meta 字段的类型
declare module 'vue-router' {
  interface RouteMeta {
    title: string // i18n key，用于菜单标题和页面标题
    icon?: string // 图标组件名（与 iconMap 中的 key 对应）
    noAuth?: boolean // 是否不需要登录
    hidden?: boolean // 是否在菜单中隐藏（如详情页、嵌套子页）
    order?: number // 菜单排序权重（越小越靠前）
  }
}

export const protectedRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: 'menu.dashboard', icon: 'DashboardOutlined', order: 1 },
  },
  {
    path: 'todo',
    name: 'TodoDemo',
    component: () => import('@/views/TodoDemo.vue'),
    meta: { title: 'menu.todo', icon: 'CheckSquareOutlined', order: 2 },
  },
  {
    path: 'form',
    name: 'ComplexForm',
    component: () => import('@/views/ComplexForm.vue'),
    meta: { title: 'menu.form', icon: 'FormOutlined', order: 3 },
  },
  {
    path: 'table',
    name: 'DataTable',
    component: () => import('@/views/DataTable.vue'),
    meta: { title: 'menu.table', icon: 'TableOutlined', order: 4 },
  },
  {
    path: 'timeline',
    name: 'Timeline',
    component: () => import('@/views/Timeline.vue'),
    meta: { title: 'menu.timeline', icon: 'ClockCircleOutlined', order: 5 },
  },
  {
    path: 'shortcuts',
    name: 'Shortcuts',
    component: () => import('@/views/Shortcuts.vue'),
    meta: { title: 'menu.shortcuts', icon: 'ThunderboltOutlined', order: 6 },
  },
  {
    path: 'store-demo',
    name: 'StoreDemo',
    component: () => import('@/views/StoreDemo.vue'),
    meta: { title: 'menu.store', icon: 'DatabaseOutlined', order: 7 },
  },
  {
    path: 'composables',
    name: 'ComposableDemo',
    component: () => import('@/views/ComposableDemo.vue'),
    meta: { title: 'menu.composables', icon: 'ApiOutlined', order: 8 },
  },
  {
    path: 'product-manage',
    name: 'ProductManage',
    component: () => import('@/views/product-manage/index.vue'),
    meta: { title: 'menu.productManage', icon: 'AppstoreOutlined', order: 9 },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 公开路由
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '登录', noAuth: true, hidden: true },
    },
    // 受保护路由 — 嵌套在 AdminLayout 下
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      redirect: '/dashboard',
      children: protectedRoutes,
    },
  ],
})

// 导航守卫
router.beforeEach((to, _from, next) => {
  const hasToken = !!localStorage.getItem('app_token')

  if (to.meta.noAuth) {
    if (hasToken && to.path === '/login') {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    if (!hasToken) {
      next({ path: '/login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  }
})

export { router }
export default router
