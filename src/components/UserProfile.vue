<!--
  ============================================================
  UserProfile.vue — 用户登录/信息展示
  知识点：
  - Options Store 使用
  - store $subscribe — 订阅状态变化
  - v-if / v-else / v-else-if 条件链
  - watch 监听 store 状态
  - ref 操作 DOM
  - onMounted / onUnmounted
  ============================================================
-->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import type { UserRole } from '@/types'

const userStore = useUserStore()
const { currentUser, isLoggedIn, loginError } = storeToRefs(userStore)

// 登录表单
const username = ref('')
const password = ref('')
const loginLoading = ref(false)

// 登录处理
async function handleLogin(): Promise<void> {
  if (!username.value.trim()) return
  loginLoading.value = true
  await userStore.login(username.value, password.value)
  loginLoading.value = false

  if (userStore.isLoggedIn) {
    password.value = ''
  }
}

// 监听用户登录状态
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    console.log('[UserProfile] 用户已登录:', currentUser.value?.username)
  }
})

// 角色标签映射
function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin: '👑 管理员',
    user: '👤 普通用户',
    guest: '👻 访客',
  }
  return map[role] ?? role
}

// ---------- Store $subscribe ----------
// 订阅 Pinia store 的变化
let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = userStore.$subscribe((mutation, state) => {
    // mutation.type = 'direct' | 'patch object' | 'patch function'
    console.log(`[UserStore 变更] type: ${mutation.type}, loggedIn: ${state.isLoggedIn}`)
  })
})

onUnmounted(() => {
  // 清理订阅
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
})
</script>

<template>
  <div class="user-profile">
    <!-- v-if / v-else 条件渲染 -->
    <div v-if="isLoggedIn && currentUser" class="user-logged-in">
      <div class="user-header">
        <img :src="currentUser.avatar" :alt="currentUser.username" class="user-avatar" />
        <div class="user-info">
          <strong>{{ currentUser.username }}</strong>
          <span class="user-role">{{ roleLabel(currentUser.role) }}</span>
        </div>
      </div>

      <div class="user-details">
        <p>📧 {{ currentUser.email }}</p>
        <p>🌐 {{ currentUser.preferences.language === 'zh-CN' ? '中文' : 'English' }}</p>
      </div>

      <div class="user-actions">
        <button class="btn-sm" @click="userStore.toggleLanguage()">🌐 切换语言</button>
        <button class="btn-sm btn-sm--danger" @click="userStore.logout()">🚪 退出登录</button>
      </div>
    </div>

    <div v-else class="user-login">
      <h4>👤 用户登录</h4>

      <div class="form-group">
        <input
          v-model="username"
          type="text"
          placeholder="用户名（输入 admin 获得管理员权限）"
          @keyup.enter="handleLogin"
        />
      </div>

      <div class="form-group">
        <input
          v-model="password"
          type="password"
          placeholder="密码（任意 ≥3 位字符）"
          @keyup.enter="handleLogin"
        />
      </div>

      <!-- v-if 错误提示 -->
      <p v-if="loginError" class="error-msg">{{ loginError }}</p>

      <button
        class="btn btn-primary btn-block"
        :disabled="!username.trim() || loginLoading"
        @click="handleLogin"
      >
        {{ loginLoading ? '登录中...' : '🔑 登录' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.user-profile {
  background: var(--color-card, #fff);
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 12px;
  padding: 16px;
}

.user-logged-in {
  /* 已登录状态 */
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-bg, #f0f2f5);
}

.user-info strong {
  display: block;
  font-size: 15px;
  color: var(--color-text, #333);
}

.user-role {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
}

.user-details {
  margin-bottom: 12px;
}

.user-details p {
  font-size: 13px;
  color: var(--color-text-secondary, #666);
  margin: 4px 0;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.user-login {
  text-align: center;
}

.user-login h4 {
  margin: 0 0 12px 0;
  color: var(--color-text, #333);
}

.form-group {
  margin-bottom: 10px;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-card, #fff);
  color: var(--color-text, #333);
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #4a5cf7);
}

.error-msg {
  color: var(--color-danger, #ff4d4f);
  font-size: 13px;
  margin: 4px 0;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary, #4a5cf7);
  color: #fff;
}

.btn-block {
  width: 100%;
}

.btn-sm {
  padding: 4px 10px;
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text, #333);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-sm:hover {
  background: var(--color-primary, #4a5cf7);
  color: #fff;
  border-color: var(--color-primary, #4a5cf7);
}

.btn-sm--danger:hover {
  background: var(--color-danger, #ff4d4f);
  border-color: var(--color-danger, #ff4d4f);
}
</style>
