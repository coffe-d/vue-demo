// ============================================================
// AI 聊天状态管理 — Pinia Setup Store
// ============================================================
// 职责：
// 1. 管理聊天消息列表（用户消息 + AI 回复）
// 2. 控制对话框的显示/隐藏
// 3. 驱动流式聊天的完整生命周期（发送 → 流式接收 → 完成/中断）
// 4. 管理 AI 服务配置（API Key / Base URL / Model）
//
// 设计决策：
// - 使用 Setup Store 风格（组合式 API），与 Vue 组件风格统一
// - 流式消息使用 streaming 标记，UI 据此显示闪烁光标动画
// - 错误状态独立管理（error ref），不影响已有消息的展示
// - 支持中断生成（AbortController）+ 重新生成
//
// 知识点：
// - defineStore + Setup 函数式写法
// - ref / computed 管理响应式状态
// - AbortController 实现请求取消
// - OpenAI Chat Completion API 的消息格式转换
// ============================================================

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { chatStream, getAIConfig, setAIConfig, type ChatMessage, type AIConfig } from '@/api/ai'

/**
 * 聊天界面显示的消息
 * 相比 API 层的 ChatMessage 多了 UI 需要的字段
 */
export interface DisplayMessage {
  /** 唯一标识（用于 v-for key 和动画） */
  id: string
  /** 角色类型 */
  role: 'user' | 'assistant' | 'system'
  /** 消息正文（流式生成中会持续追加） */
  content: string
  /** 创建时间戳 */
  timestamp: number
  /** 是否正在流式生成中（UI 据此显示闪烁光标 ▊） */
  streaming?: boolean
}

/**
 * 生成唯一 ID
 * 格式：时间戳(36进制) + 随机串
 * 例如："m2f3k8a1b2c3"
 */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useChatStore = defineStore('chat', () => {
  // ==================== 状态 ====================

  /** 消息列表（按时间顺序，最新在末尾） */
  const messages = ref<DisplayMessage[]>([])

  /** 是否正在等待 AI 回复 */
  const loading = ref(false)

  /** 对话框是否可见 */
  const visible = ref(false)

  /** 错误信息（非空时在消息区底部显示 Alert） */
  const error = ref('')

  /** 当前 AI 配置的快照 */
  const config = ref<AIConfig>(getAIConfig())

  /**
   * AbortController 实例
   * 用于取消正在进行的流式请求
   * 模块级变量（非响应式），不需要触发 UI 更新
   */
  let abortController: AbortController | null = null

  // ==================== 计算属性 ====================

  /** 是否有聊天记录 */
  const hasMessages = computed(() => messages.value.length > 0)

  /** 最后一条 AI 回复（用于外部快速引用） */
  const lastAssistantMessage = computed(() =>
    [...messages.value].reverse().find((m) => m.role === 'assistant'),
  )

  // ==================== UI 控制方法 ====================

  /** 切换对话框显示/隐藏 */
  function toggle() {
    visible.value = !visible.value
    error.value = ''
  }

  /** 打开对话框 */
  function open() {
    visible.value = true
    error.value = ''
  }

  /** 关闭对话框 */
  function close() {
    visible.value = false
    error.value = ''
  }

  /** 清空聊天历史 */
  function clear() {
    messages.value = []
    error.value = ''
  }

  // ==================== 核心方法 ====================

  /**
   * 发送用户消息并获取 AI 回复（流式）
   *
   * 流程：
   * 1. 校验输入（非空 + API Key 已配置）
   * 2. 添加用户消息到列表
   * 3. 添加空的 assistant 占位消息（streaming=true）
   * 4. 构建 API 消息格式（含 system prompt）
   * 5. 调用 chatStream 流式获取回复
   * 6. 每收到一个 token 追加到占位消息的 content
   * 7. 完成或出错后更新 streaming 状态
   *
   * @param content - 用户输入的文本
   */
  async function send(content: string) {
    // 空消息或正在加载中 → 忽略
    if (!content.trim() || loading.value) return

    // API Key 未配置 → 提示用户
    if (!config.value.apiKey) {
      error.value = '请先配置 AI API Key（点击设置图标）'
      return
    }

    // ① 添加用户消息
    const userMsg: DisplayMessage = {
      id: uid(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    }
    messages.value.push(userMsg)

    // ② 添加 AI 占位消息（content 初始为空，streaming=true）
    const assistantMsg: DisplayMessage = {
      id: uid(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    }
    messages.value.push(assistantMsg)

    loading.value = true
    error.value = ''

    // ③ 构建 API 格式的消息列表
    // 过滤掉 system 消息和正在流式生成中的消息
    const apiMessages: ChatMessage[] = messages.value
      .filter((m) => m.role !== 'system' && !m.streaming)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    // ④ 在消息列表头部插入系统提示词
    apiMessages.unshift({
      role: 'system',
      content: '你是一个有帮助的 AI 助手，嵌入在 Vue3 后台管理系统中。请用简洁清晰的语言回答问题。',
    })

    // ⑤ 创建 AbortController（用于停止生成）
    abortController = new AbortController()

    // ⑥ 帧缓冲：token 入缓冲，每帧 flush 一次，保证逐节输出
    let pendingBuffer = ''
    let rafId: number | null = null

    function flush() {
      if (pendingBuffer) {
        assistantMsg.content += pendingBuffer
        pendingBuffer = ''
      }
      rafId = null
    }

    function scheduleFlush() {
      if (rafId === null) {
        rafId = requestAnimationFrame(flush)
      }
    }

    try {
      // ⑦ 流式调用 AI API
      await chatStream(
        apiMessages,
        // token → 入缓冲，按帧吐出
        (token) => {
          pendingBuffer += token
          scheduleFlush()
        },
        abortController.signal,
      )
      // 最后一次 flush（确保缓冲区清空）
      if (rafId !== null) cancelAnimationFrame(rafId)
      flush()
      assistantMsg.streaming = false
    } catch (err: any) {
      if (rafId !== null) cancelAnimationFrame(rafId)
      flush() // 已收到的内容保留
      if (err.name === 'AbortError') {
        assistantMsg.content += '\n\n_（已停止生成）_'
      } else {
        error.value = err.message || '请求失败'
        if (!assistantMsg.content) {
          messages.value.pop()
        }
      }
      assistantMsg.streaming = false
    } finally {
      loading.value = false
      abortController = null
    }
  }

  /**
   * 停止当前正在生成的回复
   * 通过 AbortController.abort() 触发 chatStream 中的 AbortError
   */
  function stop() {
    abortController?.abort()
    loading.value = false
  }

  /**
   * 重新生成最后一条 AI 回复
   * 逻辑：移除最后一条 assistant 消息 → 用最后一条 user 消息重新调用 send
   */
  async function regenerate() {
    // 从后往前找最后一条用户消息
    const lastUserIdx = [...messages.value].reverse().findIndex((m) => m.role === 'user')
    if (lastUserIdx === -1) return

    // 计算原数组中的实际索引
    const realIdx = messages.value.length - 1 - lastUserIdx
    const userContent = messages.value[realIdx].content

    // 截断：移除该用户消息之后的所有消息
    messages.value = messages.value.slice(0, realIdx)

    // 重新发送
    await send(userContent)
  }

  /**
   * 更新 AI 配置
   * 同时更新 store 本地快照和 localStorage 持久化
   */
  function updateConfig(cfg: Partial<AIConfig>) {
    setAIConfig(cfg)
    config.value = getAIConfig()
  }

  // ==================== 导出 ====================

  return {
    // 状态
    messages,
    loading,
    visible,
    error,
    config,
    // 计算属性
    hasMessages,
    lastAssistantMessage,
    // 方法
    toggle,
    open,
    close,
    clear,
    send,
    stop,
    regenerate,
    updateConfig,
  }
})
