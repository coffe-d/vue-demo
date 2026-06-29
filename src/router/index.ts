// ============================================================
// Vue Router 配置 —— 路由即菜单的唯一配置源
// 支持嵌套子菜单：children 属性可定义子级菜单
// 新增页面只需在此添加路由即可，菜单自动生成
// ============================================================

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 扩展 RouteMeta — 声明自定义 meta 字段的类型
declare module 'vue-router' {
  interface RouteMeta {
    title: string                           // i18n key，用于菜单标题和页面标题
    icon?: string                           // 图标组件名（与 iconMap 中的 key 对应）
    noAuth?: boolean                        // 是否不需要登录
    hidden?: boolean                        // 是否在菜单中隐藏
    order?: number                          // 菜单排序权重（越小越靠前）
  }
}

export const protectedRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: 'menu.dashboard', icon: 'HomeOutlined', order: 1 },
  },
  {
    path: 'system',
    name: 'System',
    redirect: '/system/menu',
    meta: { title: 'menu.system', icon: 'SettingOutlined', order: 2 },
    children: [
      {
        path: 'menu',
        name: 'MenuManage',
        component: () => import('@/views/system/MenuManage.vue'),
        meta: { title: 'menu.menuManage', icon: 'MenuOutlined', order: 1 },
      },
      {
        path: 'dict',
        name: 'DictManage',
        component: () => import('@/views/system/DictManage.vue'),
        meta: { title: 'menu.dictManage', icon: 'BookOutlined', order: 2 },
      },
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/system/UserManage.vue'),
        meta: { title: 'menu.userManage', icon: 'UserOutlined', order: 3 },
      },
      {
        path: 'role',
        name: 'RoleManage',
        component: () => import('@/views/system/RoleManage.vue'),
        meta: { title: 'menu.roleManage', icon: 'TeamOutlined', order: 4 },
      },
      {
        path: 'log',
        name: 'LogManage',
        component: () => import('@/views/system/LogManage.vue'),
        meta: { title: 'menu.logManage', icon: 'FileTextOutlined', order: 5 },
      },
    ],
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
