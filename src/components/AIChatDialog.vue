<!--
  AIChatDialog.vue — AI 聊天弹窗（主交互组件）
  ============================================================
  功能：
  1. 消息列表展示     — 用户消息（蓝色气泡，右对齐）+ AI 回复（灰色气泡，左对齐）
  2. 流式输出         — AI 回复逐字追加，末尾闪烁光标 ▊
  3. 设置面板         — API Key / Base URL / Model 配置，持久化保存
  4. 快捷提问         — 空状态时提供 3 个预设问题，点击即发送
  5. 对话管理         — 重新生成 / 清空对话 / 停止生成
  6. 键盘交互         — Enter 发送，Shift+Enter 换行

  交互流程：
  ┌─────────────┐    点击悬浮球     ┌──────────────┐
  │  FloatingBall │ ───────────────→ │  AIChatDialog │
  └─────────────┘    store.toggle()  └──────────────┘
                                           │
                                    用户输入消息
                                           │
                                    store.send(text)
                                           │
                                    chatStream(SSE)
                                           │
                                    UI 逐字更新

  Vue3 知识点：
  - storeToRefs 解构响应式状态（保持响应性）
  - watch 监听消息变化自动滚动到底部
  - nextTick 等待 DOM 更新后执行滚动
  - Transition 组件实现弹窗的淡入/滑入动画
  - 消息气泡布局（flex + flex-direction: row-reverse 实现左右分布）
-->
<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { storeToRefs } from 'pinia'
import {
  SendOutlined,
  CloseOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  RobotOutlined,
  UserOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const store = useChatStore()
// storeToRefs 解构保持响应性（直接解构会丢失响应性）
const { messages, loading, visible, error, config } = storeToRefs(store)

// ===== 输入状态 =====
const inputText = ref('')

/** 聊天消息区 DOM 引用（用于 scrollToBottom） */
const chatBodyRef = ref<HTMLElement | null>(null)

// ===== 设置面板 =====
const showSettings = ref(false)

/**
 * 设置表单（内部状态，确认后才保存到 store）
 * 初始值从 store 的 config 同步
 */
const settingForm = ref({
  apiKey: config.value.apiKey,
  baseURL: config.value.baseURL,
  model: config.value.model,
})

/** 保存设置到 store（同时持久化到 localStorage） */
function saveSettings() {
  store.updateConfig(settingForm.value)
  showSettings.value = false
  message.success('AI 配置已保存')
}

// ===== 发送消息 =====

async function handleSend() {
  if (!inputText.value.trim() || loading.value) return
  const text = inputText.value
  inputText.value = ''
  await store.send(text)
  scrollToBottom()
}

/**
 * 键盘事件处理
 * Enter → 发送
 * Shift+Enter → 换行（不做处理，让 textarea 默认行为生效）
 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// ===== 自动滚动到底部 =====

function scrollToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

// 新消息到达时滚动
watch(
  () => messages.value.length,
  () => scrollToBottom(),
)

// 流式内容更新时也滚动（确保打字机效果不溢出可视区）
watch(
  () => {
    const last = messages.value[messages.value.length - 1]
    return last?.content
  },
  () => scrollToBottom(),
)

// 弹窗首次打开时滚动
onMounted(() => {
  if (visible.value) scrollToBottom()
})
</script>

<template>
  <!-- ===== 遮罩层：点击关闭对话框 ===== -->
  <Transition name="dialog-fade">
    <div v-if="visible" class="chat-overlay" @click="store.close" />
  </Transition>

  <!-- ===== 对话框主体 ===== -->
  <Transition name="dialog-slide">
    <div v-if="visible" class="chat-dialog" @click.stop>
      <!-- 头部：标题 + 操作按钮 -->
      <div class="chat-header">
        <div class="chat-header-left">
          <RobotOutlined class="chat-icon" />
          <span class="chat-title">AI 助手</span>
          <!-- 思考中状态标签 -->
          <a-tag v-if="loading" color="processing" size="small">思考中...</a-tag>
        </div>
        <div class="chat-header-right">
          <!-- 重新生成：禁用条件 → 无历史或正在加载 -->
          <a-tooltip title="重新生成">
            <a-button
              type="text"
              size="small"
              :disabled="loading || messages.length < 2"
              @click="store.regenerate()"
            >
              <ReloadOutlined />
            </a-button>
          </a-tooltip>
          <a-tooltip title="清空对话">
            <a-button type="text" size="small" @click="store.clear()">
              <DeleteOutlined />
            </a-button>
          </a-tooltip>
          <a-tooltip title="设置">
            <a-button type="text" size="small" @click="showSettings = !showSettings">
              <SettingOutlined />
            </a-button>
          </a-tooltip>
          <a-tooltip title="关闭">
            <a-button type="text" size="small" @click="store.close">
              <CloseOutlined />
            </a-button>
          </a-tooltip>
        </div>
      </div>

      <!-- 设置面板（可折叠） -->
      <Transition name="settings-collapse">
        <div v-if="showSettings" class="chat-settings">
          <a-input
            v-model:value="settingForm.apiKey"
            placeholder="API Key（sk-...）"
            type="password"
            size="small"
            style="margin-bottom: 8px"
          />
          <a-input
            v-model:value="settingForm.baseURL"
            placeholder="Base URL，默认 OpenAI"
            size="small"
            style="margin-bottom: 8px"
          />
          <a-input
            v-model:value="settingForm.model"
            placeholder="模型名称"
            size="small"
            style="margin-bottom: 8px"
          />
          <a-button type="primary" size="small" block @click="saveSettings">
            保存配置
          </a-button>
        </div>
      </Transition>

      <!-- 消息列表 -->
      <div ref="chatBodyRef" class="chat-body">
        <!-- 空状态：欢迎语 + 快捷提问标签 -->
        <div v-if="messages.length === 0" class="chat-empty">
          <RobotOutlined
            style="font-size: 48px; color: var(--color-border, #e8e8e8); margin-bottom: 12px"
          />
          <p>你好！我是 AI 助手，有什么可以帮你的？</p>
          <div class="quick-prompts">
            <a-tag
              v-for="prompt in [
                '帮我解释 Vue3 组合式 API',
                '写一个防抖函数',
                '什么是 Pinia？',
              ]"
              :key="prompt"
              color="blue"
              class="prompt-tag"
              @click="
                inputText = prompt;
                handleSend();
              "
            >
              {{ prompt }}
            </a-tag>
          </div>
        </div>

        <!-- 消息列表渲染 -->
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="chat-message"
          :class="`msg-${msg.role}`"
        >
          <!-- 头像 -->
          <div class="msg-avatar">
            <RobotOutlined v-if="msg.role === 'assistant'" />
            <UserOutlined v-else />
          </div>

          <!-- 气泡 -->
          <div class="msg-bubble">
            <!-- 消息正文（v-text 避免 XSS） -->
            <div class="msg-content" v-text="msg.content" />
            <!-- 流式生成中的闪烁光标 -->
            <span v-if="msg.streaming" class="typing-dot">▊</span>
            <!-- 时间戳 -->
            <div class="msg-time">
              {{ new Date(msg.timestamp).toLocaleTimeString() }}
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="chat-error">
          <a-alert :message="error" type="error" closable @close="error = ''" />
        </div>
      </div>

      <!-- 输入区 -->
      <div class="chat-footer">
        <a-textarea
          v-model:value="inputText"
          :auto-size="{ minRows: 1, maxRows: 4 }"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          :disabled="loading"
          @keydown="handleKeydown"
        />
        <!-- 加载中：显示停止按钮（红色） -->
        <a-button v-if="loading" type="primary" danger @click="store.stop()">
          <PauseCircleOutlined />
        </a-button>
        <!-- 空闲：发送按钮（蓝色，输入为空时禁用） -->
        <a-button v-else type="primary" :disabled="!inputText.trim()" @click="handleSend">
          <SendOutlined />
        </a-button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ========== 遮罩层 ========== */
.chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9998;
}

/* ========== 对话框 ========== */
.chat-dialog {
  position: fixed;
  right: 24px;
  bottom: 100px; /* 给悬浮球留空间 */
  width: 420px;
  height: 560px;
  display: flex;
  flex-direction: column;
  background: var(--color-card, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
}

/* ========== 头部 ========== */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #f0f0f0);
  background: var(--color-card, #fff);
  flex-shrink: 0;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-icon {
  font-size: 20px;
  color: var(--color-primary, #1890ff);
}

.chat-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text, #333);
}

.chat-header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ========== 设置面板 ========== */
.chat-settings {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #f0f0f0);
  background: var(--color-bg, #fafafa);
  flex-shrink: 0;
}

/* ========== 消息区域（flex:1 填满剩余空间，overflow-y:auto 独立滚动） ========== */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 空状态 */
.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary, #999);
  font-size: 14px;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}

/* 快捷提问标签：可点击，hover 微放大 */
.prompt-tag {
  cursor: pointer;
  transition: transform 0.15s;
}
.prompt-tag:hover {
  transform: scale(1.04);
}

/* ========== 单条消息 ========== */
.chat-message {
  display: flex;
  gap: 10px;
  max-width: 100%;
}

/* 用户消息：头像在右边（flex-direction: row-reverse） */
.msg-user {
  flex-direction: row-reverse;
}

/* 头像 */
.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-bg, #f0f2f5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  color: var(--color-text-secondary, #999);
}

/* 用户头像用品牌色背景 */
.msg-user .msg-avatar {
  background: var(--color-primary, #1890ff);
  color: #fff;
}

/* 气泡区域 */
.msg-bubble {
  max-width: 78%;
}

/* 用户气泡右对齐 */
.msg-user .msg-bubble {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* 消息正文 */
.msg-content {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  /* white-space: pre-wrap 保留换行 */
  white-space: pre-wrap;
}

/* AI 气泡：灰色底，左下角直角 */
.msg-assistant .msg-content {
  background: var(--color-bg, #f0f2f5);
  color: var(--color-text, #333);
  border-bottom-left-radius: 4px;
}

/* 用户气泡：品牌色底，白色字，右下角直角 */
.msg-user .msg-content {
  background: var(--color-primary, #1890ff);
  color: #fff;
  border-bottom-right-radius: 4px;
}

/* 流式生成光标闪烁 */
.typing-dot {
  display: inline-block;
  color: var(--color-primary, #1890ff);
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 时间戳 */
.msg-time {
  font-size: 11px;
  color: var(--color-text-secondary, #bbb);
  margin-top: 4px;
  padding: 0 4px;
}

/* ========== 底部输入区 ========== */
.chat-footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border, #f0f0f0);
  background: var(--color-card, #fff);
  flex-shrink: 0;
  align-items: flex-end;
}

.chat-footer :deep(.ant-input) {
  border-radius: 10px;
}

.chat-error {
  padding: 0;
}

/* ========== 过渡动画 ========== */

/* 遮罩淡入/淡出 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

/* 对话框滑入（从右下角弹出+缩放） */
.dialog-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.dialog-slide-leave-active {
  transition: all 0.2s ease-in;
}
.dialog-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.dialog-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}

/* 设置面板折叠动画 */
.settings-collapse-enter-active,
.settings-collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.settings-collapse-enter-from,
.settings-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* ========== 深色主题适配 ========== */
[data-theme='dark'] .chat-dialog {
  background: #1f1f1f;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
}
[data-theme='dark'] .chat-header {
  background: #1f1f1f;
  border-color: #303030;
}
[data-theme='dark'] .chat-footer {
  background: #1f1f1f;
  border-color: #303030;
}
[data-theme='dark'] .chat-settings {
  background: #262626;
  border-color: #303030;
}
[data-theme='dark'] .msg-assistant .msg-content {
  background: #262626;
}
[data-theme='dark'] .msg-avatar {
  background: #262626;
}
[data-theme='dark'] .chat-overlay {
  background: rgba(0, 0, 0, 0.6);
}

/* ========== 响应式：小屏幕全宽 ========== */
@media (max-width: 500px) {
  .chat-dialog {
    right: 8px;
    left: 8px;
    bottom: 80px;
    width: auto;
    height: 65vh;
    border-radius: 12px 12px 0 0;
  }
}
</style>
