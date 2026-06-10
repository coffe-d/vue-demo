// ============================================================
// AI API 客户端 — 基于 OpenAI 兼容接口的聊天 API 封装
// ============================================================
// 功能：
// 1. 配置管理      — API Key / Base URL / Model 的本地持久化存取
// 2. 非流式聊天    — 一次性返回完整回复（chat 函数）
// 3. 流式聊天(SSE) — 通过 ReadableStream 逐 token 输出（chatStream）
//                    实现打字机效果，提升交互体验
//
// 兼容性：任何实现了 OpenAI /v1/chat/completions 接口的服务均可使用
//   - OpenAI 官方 API
//   - Azure OpenAI
//   - 本地部署的 Ollama / vLLM / LocalAI
//   - 兼容的中转服务
//
// 知识点：
// - fetch API 的使用（含 AbortSignal 支持取消请求）
// - SSE (Server-Sent Events) 协议的手动解析
// - ReadableStream / TextDecoder 流式读取
// - localStorage 作为客户端配置存储
// ============================================================

/**
 * AI 服务配置
 * 存储在 localStorage 中，通过设置面板可修改
 */
export interface AIConfig {
  /** API 基础地址，如 https://api.openai.com/v1 */
  baseURL: string
  /** API 密钥（Bearer Token） */
  apiKey: string
  /** 模型名称，如 gpt-4o-mini / deepseek-chat */
  model: string
}

/**
 * 单条聊天消息
 * 符合 OpenAI Chat Completion API 的 messages 格式
 */
export interface ChatMessage {
  /** 角色：system(系统提示) / user(用户) / assistant(AI回复) */
  role: 'system' | 'user' | 'assistant'
  /** 消息正文 */
  content: string
}

// ---------- 配置的本地持久化 ----------

/** localStorage 存储键名 */
const STORAGE_KEY = 'ai_chat_config'

/**
 * 从 localStorage 加载配置
 * 解析失败时返回默认值（API Key 为空，需用户配置）
 */
function loadConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // JSON 解析失败 → 使用默认配置
  }
  return {
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
  }
}

/** 持久化配置到 localStorage */
function saveConfig(config: AIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/** 模块级单例配置（运行时修改，刷新后重新从 localStorage 加载） */
let aiConfig = loadConfig()

/** 获取当前配置的快照（返回副本，避免外部直接修改内部状态） */
export function getAIConfig(): AIConfig {
  return { ...aiConfig }
}

/**
 * 更新配置（支持部分更新）
 * 会同时更新内存中的配置和 localStorage 持久化
 */
export function setAIConfig(config: Partial<AIConfig>): void {
  aiConfig = { ...aiConfig, ...config }
  saveConfig(aiConfig)
}

// ---------- API 调用 ----------

/**
 * 非流式聊天请求
 * 发送完整消息列表，等待服务端返回完整回复后一次性返回
 *
 * @param messages - 对话历史（含 system / user / assistant）
 * @param signal   - 可选 AbortSignal，用于取消请求
 * @returns AI 回复的文本内容
 * @throws 请求失败时抛出 Error（含 HTTP 状态码或服务端错误信息）
 */
export async function chat(
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const { baseURL, apiKey, model } = aiConfig
  const url = `${baseURL}/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false, // 非流式模式
    }),
    signal,
  })

  // 非 2xx 响应 → 尝试解析服务端错误信息
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(err.error?.message ?? `HTTP ${res.status}`)
  }

  const data = await res.json()
  // OpenAI 响应格式：choices[0].message.content
  return data.choices?.[0]?.message?.content ?? ''
}

/**
 * 流式聊天请求（SSE — Server-Sent Events）
 * 通过 ReadableStream 逐块读取服务端返回的 token，
 * 每接收到一个 token 就通过 onToken 回调实时输出
 *
 * 协议格式（OpenAI SSE）：
 *   data: {"choices":[{"delta":{"content":"你"}}]}
 *   data: {"choices":[{"delta":{"content":"好"}}]}
 *   data: [DONE]
 *
 * @param messages - 对话历史
 * @param onToken  - 每收到一个 token 的回调（用于实时更新 UI）
 * @param signal   - 可选 AbortSignal，用于取消生成
 * @returns 完整的回复文本
 * @throws 请求失败或流读取异常时抛出 Error
 */
export async function chatStream(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const { baseURL, apiKey, model } = aiConfig
  const url = `${baseURL}/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true, // 启用流式模式
    }),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(err.error?.message ?? `HTTP ${res.status}`)
  }

  // 获取 ReadableStream 的 reader
  const reader = res.body?.getReader()
  if (!reader) throw new Error('不支持流式读取')

  const decoder = new TextDecoder()
  let full = '' // 累积完整回复

  // 循环读取流数据块
  while (true) {
    const { done, value } = await reader.read()
    if (done) break // 流结束

    // 解码二进制 chunk → 文本
    const chunk = decoder.decode(value, { stream: true })
    // 按行分割，只保留 "data: " 开头的 SSE 事件行
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

    for (const line of lines) {
      const data = line.slice(6).trim() // 去掉 "data: " 前缀
      if (data === '[DONE]') continue   // 流结束标记

      try {
        const json = JSON.parse(data)
        // 提取 delta.content（流式响应中增量内容字段）
        const token = json.choices?.[0]?.delta?.content ?? ''
        if (token) {
          full += token
          onToken(token) // 实时回调 → UI 逐字显示
        }
      } catch {
        // 忽略单行 JSON 解析错误（某些实现可能插入注释/空行）
      }
    }
  }

  return full
}
