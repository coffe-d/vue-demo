<!--
  AdminLayout.vue — 后台管理通用布局
  菜单由 router 配置动态生成（单一数据源），支持嵌套子菜单
-->
<script setup lang="ts">
import { ref, computed, h, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { protectedRoutes } from '@/router'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { message } from 'ant-design-vue'
import type { MenuProps } from 'ant-design-vue'
import type { RouteRecordRaw } from 'vue-router'
import {
  HomeOutlined,
  SettingOutlined,
  MenuOutlined,
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TranslationOutlined,
  BulbOutlined,
  BulbFilled,
  LogoutOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const { isDark } = storeToRefs(themeStore)
const { userName } = storeToRefs(authStore)

const collapsed = ref(false)

// ===== 标签页管理 =====
interface TabItem { path: string; title: string }
const tabs = useLocalStorage<TabItem[]>('app-tabs', [{ path: '/dashboard', title: t('menu.dashboard') }])
const activeTab = useLocalStorage<string>('app-active-tab', '/dashboard')

// 从所有路由（含嵌套）中递归查找标题
function findRouteTitle(path: string): string {
  function search(routes: readonly RouteRecordRaw[], basePath = ''): string | null {
    for (const r of routes) {
      const fullPath = basePath + '/' + r.path
      if (fullPath === path || (r.redirect && fullPath === path)) {
        return r.meta?.title ?? null
      }
      if (r.children) {
        const found = search(r.children, fullPath)
        if (found) return found
      }
    }
    return null
  }
  const titleKey = search(protectedRoutes, '')
  return titleKey ? t(titleKey) : path
}

function getTitle(p: string): string {
  return findRouteTitle(p)
}

function openTab(path: string) {
  const exist = tabs.value.find((t) => t.path === path)
  if (!exist) {
    tabs.value.push({ path, title: getTitle(path) })
  }
  activeTab.value = path
  router.push(path)
}

function handleTabEdit(targetKey: string | MouseEvent) {
  const path = targetKey as string
  if (path === '/dashboard') return
  const idx = tabs.value.findIndex((t) => t.path === path)
  if (idx === -1) return
  tabs.value.splice(idx, 1)
  if (activeTab.value === path) {
    const next = tabs.value[Math.min(idx, tabs.value.length - 1)]
    if (next) { activeTab.value = next.path; router.push(next.path) }
  }
}

function handleTabChange(key: string) { router.push(key) }
function handleMenuClick({ key }: { key: string }) { openTab(key) }

watch(
  () => route.path,
  (p) => {
    activeTab.value = p
    if (!tabs.value.find((t) => t.path === p)) {
      tabs.value.push({ path: p, title: getTitle(p) })
    }
  },
)

// ===== 图标映射表 =====
const iconMap: Record<string, unknown> = {
  HomeOutlined, SettingOutlined, MenuOutlined, BookOutlined,
  UserOutlined, TeamOutlined, FileTextOutlined,
}

// ===== 递归构建菜单项 =====
function buildMenuItems(routes: readonly RouteRecordRaw[], parentPath = ''): MenuProps['items'] {
  const items: MenuProps['items'] = []
  const visibleRoutes = routes
    .filter((r) => !r.meta?.hidden)
    .sort((a, b) => (a.meta?.order ?? 99) - (b.meta?.order ?? 99))

  for (const r of visibleRoutes) {
    const fullPath = parentPath + '/' + r.path
    const icon = r.meta?.icon ? h(iconMap[r.meta.icon] as any) : undefined
    const label = t(r.meta?.title ?? '')

    if (r.children && r.children.length > 0) {
      // 有子路由 → 渲染 SubMenu
      const children = buildMenuItems(r.children, fullPath)
      if (children && children.length > 0) {
        items.push({
          key: fullPath,
          icon,
          label,
          children,
        })
      }
    } else {
      // 叶子路由 → 渲染 MenuItem
      items.push({
        key: fullPath.replace(/\/+/g, '/'), // 去重斜杠
        icon,
        label,
      })
    }
  }
  return items
}

const menuItems = computed<MenuProps['items']>(() => buildMenuItems(protectedRoutes))

// 当前选中的菜单 key
const selectedKeys = computed(() => {
  // 需要精确匹配当前路径
  const path = route.path
  // 递归查找匹配的叶子菜单 key
  function findKeys(items: any[]): string | null {
    for (const item of items || []) {
      if (item.key === path) return item.key
      if (item.children) {
        const found = findKeys(item.children)
        if (found) return found
      }
    }
    return null
  }
  const key = findKeys(menuItems.value || [])
  return key ? [key] : ['/dashboard']
})

// 自动展开的父菜单
const openKeys = computed(() => {
  const pathParts = route.path.split('/').filter(Boolean)
  // 如 /system/menu → 应展开 /system
  if (pathParts.length >= 2) {
    return ['/' + pathParts[0]]
  }
  return []
})

function toggleLang() {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  message.info(locale.value === 'zh-CN' ? '已切换为中文' : 'Switched to English')
}

function toggleTheme() { themeStore.toggle() }

async function handleLogout() {
  await authStore.logout()
  message.success('已退出登录')
}
</script>

<template>
  <a-layout class="admin-layout" :data-theme="themeStore.current">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      :theme="isDark ? 'dark' : 'light'"
      class="admin-sider"
    >
      <div class="logo">
        <span v-if="!collapsed" class="logo-text">{{ t('header.title') }}</span>
        <span v-else class="logo-text-collapsed">V3</span>
      </div>
      <a-menu
        :selectedKeys="selectedKeys"
        :openKeys="openKeys"
        :items="menuItems"
        mode="inline"
        :theme="isDark ? 'dark' : 'light'"
        @click="handleMenuClick"
      />
    </a-layout-sider>

    <!-- 右侧主体 -->
    <a-layout>
      <a-layout-header class="admin-header">
        <div class="header-left">
          <a-button type="text" class="collapse-btn" @click="collapsed = !collapsed">
            <MenuUnfoldOutlined v-if="collapsed" />
            <MenuFoldOutlined v-else />
          </a-button>
          <a-breadcrumb style="margin-left: 16px">
            <a-breadcrumb-item>
              <router-link to="/dashboard">{{ t('menu.dashboard') }}</router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="route.path !== '/dashboard'">
              {{ t(route.meta?.title ?? '') }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>

        <div class="header-right">
          <a-tag color="blue" style="margin-right: 8px"> <UserOutlined /> {{ userName }} </a-tag>

          <a-tooltip :title="t('header.switchLang')">
            <a-button type="text" class="header-btn" @click="toggleLang">
              <TranslationOutlined />
              {{ t('header.switchLang') }}
            </a-button>
          </a-tooltip>

          <a-tooltip :title="t('header.switchTheme')">
            <a-button type="text" class="header-btn" @click="toggleTheme">
              <BulbFilled v-if="isDark" style="color: #faad14" />
              <BulbOutlined v-else />
            </a-button>
          </a-tooltip>

          <a-tooltip title="退出登录">
            <a-button type="text" class="header-btn" @click="handleLogout">
              <LogoutOutlined />
            </a-button>
          </a-tooltip>
        </div>
      </a-layout-header>

      <!-- 标签页栏 -->
      <a-tabs
        v-if="tabs.length > 0"
        v-model:activeKey="activeTab"
        type="editable-card"
        size="small"
        :hideAdd="true"
        class="tab-bar"
        @edit="handleTabEdit"
        @change="handleTabChange"
      >
        <a-tab-pane
          v-for="tab in tabs"
          :key="tab.path"
          :tab="tab.title"
          :closable="tab.path !== '/dashboard'"
        />
      </a-tabs>

      <a-layout-content class="admin-content">
        <router-view />
      </a-layout-content>

      <a-layout-footer class="admin-footer">
        Vue3 + TypeScript + Pinia + Ant Design Vue — 后台管理系统脚手架
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.admin-layout { min-height: 100vh; }
.admin-sider { box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06); z-index: 10; }

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-border, #f0f0f0);
  overflow: hidden;
  white-space: nowrap;
}
.logo-text { font-size: 18px; font-weight: 700; color: var(--color-primary, #1890ff); }
.logo-text-collapsed { font-size: 20px; font-weight: 700; color: var(--color-primary, #1890ff); }

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--color-card, #fff);
  border-bottom: 1px solid var(--color-border, #f0f0f0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  height: 64px;
  line-height: 64px;
}
.header-left, .header-right { display: flex; align-items: center; gap: 4px; }
.collapse-btn { font-size: 18px; }
.header-btn { font-size: 14px; }

.tab-bar { margin: 0 24px; padding-top: 8px; }
.tab-bar :deep(.ant-tabs-nav) { margin-bottom: 0; }

.admin-content {
  margin: 24px;
  padding: 24px;
  background: var(--color-card, #fff);
  border-radius: 8px;
  min-height: calc(100vh - 64px - 69px - 48px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.admin-footer { text-align: center; font-size: 12px; color: var(--color-text-secondary, #999); padding: 16px; }

@media (max-width: 768px) {
  .admin-content { margin: 12px; padding: 12px; }
  .admin-header { padding: 0 12px; }
}
</style>
