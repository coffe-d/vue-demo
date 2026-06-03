<!--
  登录页面 —— API 驱动的登录流程
  数据流: Login Form → authStore.login() → api/auth.login() → Mock Handler
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: true,
})

const rules: Record<string, Rule[]> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
    loading.value = true
    const ok = await authStore.login(loginForm.username, loginForm.password)
    if (ok) {
      message.success(t('login.success'))
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.replace(redirect)
    } else {
      message.error(authStore.loginError || '登录失败')
    }
  } catch {
    // 表单校验失败
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-icon"><span class="brand-logo">V3</span></div>
        <h1 class="brand-title">{{ t('header.title') }}</h1>
        <p class="brand-desc">Vue3 + TypeScript + Pinia + Ant Design Vue</p>
        <div class="brand-tags">
          <span class="brand-tag">Mock API</span>
          <span class="brand-tag">Vue Router</span>
          <span class="brand-tag">i18n 国际化</span>
          <span class="brand-tag">Pinia</span>
        </div>
      </div>

      <div class="login-form-section">
        <h2 class="login-title">{{ t('login.title') }}</h2>
        <p class="login-subtitle">{{ t('login.subtitle') }}</p>

        <a-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          size="large"
          @keyup.enter="handleLogin"
        >
          <a-form-item name="username">
            <a-input
              v-model:value="loginForm.username"
              :placeholder="'用户名 (admin/editor/guest)'"
              autocomplete="username"
            >
              <template #prefix><UserOutlined /></template>
            </a-input>
          </a-form-item>
          <a-form-item name="password">
            <a-input-password
              v-model:value="loginForm.password"
              placeholder="密码 (123456)"
              autocomplete="current-password"
            >
              <template #prefix><LockOutlined /></template>
            </a-input-password>
          </a-form-item>
          <a-form-item>
            <a-checkbox v-model:checked="loginForm.remember">记住账号</a-checkbox>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" block :loading="loading" @click="handleLogin">
              {{ loading ? t('login.submitting') : t('login.submit') }}
            </a-button>
          </a-form-item>
        </a-form>

        <p class="login-hint">{{ t('login.hint') }}</p>
      </div>
    </div>
    <p class="login-footer">© 2026 Vue3 Admin Demo — Mock API 驱动</p>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.login-card {
  display: flex;
  width: 860px;
  max-width: 100%;
  min-height: 500px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
.login-brand {
  flex: 1;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}
.brand-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.brand-logo {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 2px;
}
.brand-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}
.brand-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
}
.brand-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.brand-tag {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}
.login-form-section {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.login-form-section :deep(.ant-form) {
  max-width: 320px;
}
.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}
.login-subtitle {
  font-size: 13px;
  color: #999;
  margin-bottom: 32px;
}
.login-hint {
  font-size: 12px;
  color: #bbb;
  margin-top: 16px;
  line-height: 1.6;
}
.login-hint code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  color: #764ba2;
}
.login-footer {
  margin-top: 24px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
  }
  .login-brand {
    padding: 24px 20px;
  }
  .login-form-section {
    padding: 24px 20px;
  }
}
</style>
