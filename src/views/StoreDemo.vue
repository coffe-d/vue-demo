<!--
  状态管理演示 —— 使用 authStore + todoStore
  展示 Setup Store / Options Store 的 API 交互
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { useTodoStore } from '@/stores/todoStore'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Priority, TodoStatus } from '@/types'

const { t } = useI18n()
const todoStore = useTodoStore()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const { totalCount, doneCount, undoneCount, loading } = storeToRefs(todoStore)
const { isLoggedIn, userName, userRole } = storeToRefs(authStore)
const { isDark } = storeToRefs(themeStore)

const subscribeLogs = ref<string[]>([])
let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await todoStore.fetchTodos()
  unsubscribe = authStore.$subscribe((_mutation, state) => {
    subscribeLogs.value.push(
      `[${new Date().toLocaleTimeString()}] authStore 变化 — 用户: ${state.user?.username ?? '无'}`,
    )
  })
})

onUnmounted(() => unsubscribe?.())

async function demoAddTodo() {
  try {
    await todoStore.addTodo({
      title: `API 测试 Todo ${Date.now() % 1000}`,
      priority: Priority.MEDIUM,
      status: TodoStatus.TODO,
      tags: [],
    })
    message.success('通过 API 创建成功！')
  } catch {
    message.error('创建失败')
  }
}

async function demoLogin() {
  const ok = await authStore.login('admin', '123456')
  message[ok ? 'success' : 'error'](ok ? '登录成功' : (authStore.loginError ?? '登录失败'))
}

function demoLogout() {
  authStore.logout()
  message.success('已退出')
}
function demoToggleTheme() {
  themeStore.toggle()
}
</script>

<template>
  <div class="store-demo">
    <a-page-header :title="t('storeDemo.title')">
      <template #subTitle>Pinia Store → API → Mock 数据流</template>
    </a-page-header>

    <a-row :gutter="16">
      <!-- Setup Store: todoStore -->
      <a-col :xs="24" :lg="8">
        <a-card :title="t('storeDemo.setupStore')" class="demo-card">
          <a-tag color="blue">Composition API 风格 — 调用 API</a-tag>
          <a-divider />
          <a-statistic :title="t('storeDemo.todoCount')" :value="totalCount" />
          <a-space style="margin-top: 12px">
            <a-tag>总计: {{ totalCount }}</a-tag>
            <a-tag color="green">完成: {{ doneCount }}</a-tag>
            <a-tag color="orange">未完成: {{ undoneCount }}</a-tag>
          </a-space>
          <a-button
            type="primary"
            :loading="loading"
            style="margin-top: 12px"
            block
            @click="demoAddTodo"
            >通过 API 添加 Todo</a-button
          >
          <a-divider />
          <p style="color: #999; font-size: 12px">
            todoStore 的 action 调用 api/todo.ts → Mock 拦截 fetch → 模拟延迟 200-500ms → 返回数据
          </p>
        </a-card>
      </a-col>

      <!-- Options Store: authStore -->
      <a-col :xs="24" :lg="8">
        <a-card :title="t('storeDemo.optionsStore')" class="demo-card">
          <a-tag color="purple">Options API 风格 — 调用 API</a-tag>
          <a-divider />
          <p>
            状态:
            <a-tag :color="isLoggedIn ? 'green' : 'red'">{{
              isLoggedIn ? '已登录' : '未登录'
            }}</a-tag>
          </p>
          <p v-if="isLoggedIn">用户: {{ userName }} ({{ userRole }})</p>
          <a-space style="margin-top: 12px">
            <a-button type="primary" size="small" :disabled="isLoggedIn" @click="demoLogin"
              >模拟登录 (API)</a-button
            >
            <a-button danger size="small" :disabled="!isLoggedIn" @click="demoLogout"
              >退出</a-button
            >
          </a-space>
          <a-divider />
          <p style="color: #999; font-size: 12px">
            authStore 调用 api/auth.ts → Mock 验证用户名密码 → 返回 token + user
          </p>
        </a-card>
      </a-col>

      <!-- Theme Store -->
      <a-col :xs="24" :lg="8">
        <a-card :title="t('storeDemo.themeStore')" class="demo-card">
          <a-tag color="orange">Setup Store — 纯本地</a-tag>
          <a-divider />
          <p>
            {{ t('storeDemo.currentTheme') }}:
            <a-tag :color="isDark ? '#000' : '#faad14'">{{ themeStore.current }}</a-tag>
          </p>
          <a-button block style="margin-top: 12px" @click="demoToggleTheme">切换主题</a-button>
        </a-card>
      </a-col>
    </a-row>

    <!-- $subscribe 监听 -->
    <a-card :title="t('storeDemo.subscribe')" style="margin-top: 16px">
      <a-empty v-if="subscribeLogs.length === 0" description="等待 authStore 变化..." />
      <div v-else class="log-list">
        <div v-for="(log, idx) in subscribeLogs" :key="idx" class="log-item">
          <a-tag color="geekblue" size="small">{{ idx + 1 }}</a-tag>
          <code>{{ log }}</code>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.demo-card {
  margin-bottom: 16px;
}
.log-list {
  max-height: 200px;
  overflow-y: auto;
  font-size: 13px;
}
.log-item {
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}
.log-item code {
  font-size: 12px;
  color: #666;
}
</style>
