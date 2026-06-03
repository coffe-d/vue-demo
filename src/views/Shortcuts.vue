<!--
  快捷键页面 —— 知识点：自定义 composable (useShortcuts)、键盘事件处理
  展示全局快捷键注册/展示 和 局部按键检测
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { useShortcuts, formatShortcutList, type ShortcutConfig } from '@/composables/useShortcuts'
import { useThemeStore } from '@/stores/themeStore'

const { t, locale } = useI18n()
const themeStore = useThemeStore()

// ============ 全局快捷键注册（Ctrl+Shift 避免浏览器冲突）============
const shortcutConfigs: ShortcutConfig[] = [
  {
    key: 'k',
    ctrl: true,
    shift: true,
    description: t('shortcuts.searchFile'),
    handler: () => message.info('Ctrl+Shift+K: 命令面板'),
  },
  {
    key: 't',
    ctrl: true,
    shift: true,
    description: t('shortcuts.toggleTheme'),
    handler: () => {
      themeStore.toggle()
      message.info('Ctrl+Shift+T: 切换主题')
    },
  },
  {
    key: 'l',
    ctrl: true,
    shift: true,
    description: t('shortcuts.toggleLang'),
    handler: () => {
      locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
      message.info('Ctrl+Shift+L: 切换语言')
    },
  },
  {
    key: 'f',
    ctrl: true,
    shift: true,
    description: t('shortcuts.focusSearch'),
    handler: () => searchInput.value?.focus(),
  },
  {
    key: 's',
    ctrl: true,
    shift: true,
    description: t('shortcuts.openSettings'),
    handler: () => message.info('Ctrl+Shift+S: 打开设置（模拟）'),
  },
]

// 使用全局快捷键 composable
const { lastPressed, lastDescription } = useShortcuts(shortcutConfigs, true)
const shortcutList = computed(() => formatShortcutList(shortcutConfigs))

// 搜索输入框 ref（供 Ctrl+F 聚焦）
const searchInput = ref<HTMLInputElement>()

// ============ 局部按键检测（在特定区域监听） ============
const localKey = ref('')
const localShortcutName = ref('')

function onLocalKeyDown(e: KeyboardEvent) {
  // 仅在聚焦区域内时才检测
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')
  if (e.key.length === 1) {
    parts.push(e.key.toUpperCase())
  } else {
    parts.push(e.key)
  }
  const combo = parts.join(' + ')

  // 查找匹配的快捷键
  const matched = shortcutConfigs.find((sc) => {
    const keyMatch = e.key.toLowerCase() === sc.key.toLowerCase()
    const ctrlMatch = !!sc.ctrl === (e.ctrlKey || e.metaKey)
    const shiftMatch = !!sc.shift === e.shiftKey
    return keyMatch && ctrlMatch && shiftMatch
  })

  localKey.value = combo
  localShortcutName.value = matched ? matched.description : t('shortcuts.noShortcut')
  e.preventDefault()
}
</script>

<template>
  <div class="shortcuts-page">
    <a-page-header :title="t('shortcuts.title')" />

    <a-row :gutter="16">
      <!-- 已注册快捷键列表 -->
      <a-col :xs="24" :lg="12">
        <a-card :title="t('shortcuts.registeredShortcuts')" class="section-card">
          <p style="color: #666; margin-bottom: 16px">{{ t('shortcuts.description') }}</p>
          <a-table
            :dataSource="shortcutList"
            :columns="[
              { title: '快捷键', dataIndex: 'key', key: 'key', width: 160 },
              { title: '功能', dataIndex: 'description', key: 'description' },
            ]"
            :pagination="false"
            size="small"
            row-key="key"
          >
            <template #bodyCell="{ column, text }">
              <template v-if="column.dataIndex === 'key'">
                <a-tag color="blue" style="font-family: monospace; font-size: 13px">{{
                  text
                }}</a-tag>
              </template>
            </template>
          </a-table>

          <!-- 最后触发的快捷键显示 -->
          <a-alert
            v-if="lastPressed"
            type="success"
            :message="`最后触发: ${lastPressed} — ${lastDescription}`"
            show-icon
            class="last-trigger"
          />
        </a-card>
      </a-col>

      <!-- 局部按键测试区域 -->
      <a-col :xs="24" :lg="12">
        <a-card :title="t('shortcuts.pressHere')" class="section-card">
          <div ref="searchInput" class="key-tester" tabindex="0" @keydown="onLocalKeyDown">
            <div class="key-display">
              <span class="key-hint">{{ t('shortcuts.pressHere') }}</span>
              <a-tag v-if="localKey" color="purple" size="large" class="detected-key">
                {{ localKey }}
              </a-tag>
              <p v-if="localKey" class="shortcut-name">
                {{ localShortcutName }}
              </p>
            </div>
          </div>

          <a-divider />

          <!-- 快捷操作按钮 -->
          <a-space direction="vertical" style="width: 100%">
            <a-alert
              type="info"
              message="提示：在页面任意位置按下 Ctrl+Shift+K/T/L/F/S 试试全局快捷键效果"
              show-icon
            />
            <a-space>
              <a-button @click="themeStore.toggle()">
                Ctrl+Shift+T — {{ t('shortcuts.toggleTheme') }}
              </a-button>
              <a-button @click="() => (locale = locale === 'zh-CN' ? 'en-US' : 'zh-CN')">
                Ctrl+Shift+L — {{ t('shortcuts.toggleLang') }}
              </a-button>
            </a-space>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.section-card {
  margin-bottom: 16px;
  height: calc(100% - 16px);
}
.last-trigger {
  margin-top: 16px;
}
.key-tester {
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
  outline: none;
}
.key-tester:focus {
  border-color: #1890ff;
  background: #e6f7ff;
}
.key-hint {
  color: #bbb;
  font-size: 16px;
}
.detected-key {
  margin-top: 16px;
  font-size: 20px;
  font-family: monospace;
  padding: 8px 16px;
}
.shortcut-name {
  color: #666;
  margin-top: 8px;
}
</style>
