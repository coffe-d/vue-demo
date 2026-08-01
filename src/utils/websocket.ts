// ============================================================
// WebSocket 工具类 — 支持心跳检测、自动重连、事件回调
// 知识点：WebSocket 生命周期管理、心跳保活、指数退避重连
// ============================================================

export interface WsOptions {
  /** 心跳间隔（毫秒），默认 30000 */
  heartbeatInterval?: number
  /** 心跳消息内容，默认 'ping' */
  heartbeatMessage?: string
  /** 重连间隔基数（毫秒），默认 3000，实际延迟 = base * 2^attempt */
  reconnectBase?: number
  /** 最大重连次数，默认 5，设为 0 不重连 */
  maxReconnectAttempts?: number
  /** 收到消息时的回调 */
  onMessage?: (data: string) => void
  /** 连接成功时的回调 */
  onOpen?: (event: Event) => void
  /** 连接关闭时的回调 */
  onClose?: (event: CloseEvent) => void
  /** 连接出错时的回调 */
  onError?: (event: Event) => void
  /** 重连时的回调（attempt: 第几次重连） */
  onReconnect?: (attempt: number) => void
}

export type WsStatus = 'connecting' | 'open' | 'closing' | 'closed'

export class HeartbeatWebSocket {
  private url: string
  private ws: WebSocket | null = null
  private options: Required<Omit<WsOptions, 'onMessage' | 'onOpen' | 'onClose' | 'onError' | 'onReconnect'>> & Pick<WsOptions, 'onMessage' | 'onOpen' | 'onClose' | 'onError' | 'onReconnect'>
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private manualClose = false
  private status: WsStatus = 'closed'

  constructor(url: string, options: WsOptions = {}) {
    this.url = url
    this.options = {
      heartbeatInterval: 30000,
      heartbeatMessage: 'ping',
      reconnectBase: 3000,
      maxReconnectAttempts: 5,
      onMessage: options.onMessage,
      onOpen: options.onOpen,
      onClose: options.onClose,
      onError: options.onError,
      onReconnect: options.onReconnect,
    }
  }

  /** 建立 WebSocket 连接 */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.warn('[WebSocket] 已连接或正在连接中')
      return
    }

    this.manualClose = false
    this.status = 'connecting'

    try {
      this.ws = new WebSocket(this.url)
    } catch (err) {
      console.error('[WebSocket] 创建连接失败:', err)
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = (event: Event) => {
      this.status = 'open'
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.options.onOpen?.(event)
    }

    this.ws.onmessage = (event: MessageEvent) => {
      const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data)

      // 心跳响应（pong）不传递给业务层
      if (data === 'pong') return

      this.options.onMessage?.(data)
    }

    this.ws.onclose = (event: CloseEvent) => {
      this.status = 'closed'
      this.stopHeartbeat()
      this.options.onClose?.(event)

      if (!this.manualClose) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (event: Event) => {
      this.options.onError?.(event)
    }
  }

  /** 发送消息（支持字符串或对象） */
  send(data: string | Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] 连接未就绪，无法发送消息')
      return
    }

    const payload = typeof data === 'string' ? data : JSON.stringify(data)
    this.ws.send(payload)
  }

  /** 主动关闭连接（不会触发重连） */
  close(): void {
    this.manualClose = true
    this.stopHeartbeat()
    this.clearReconnect()
    this.reconnectAttempts = 0

    if (this.ws) {
      this.ws.close(1000, '客户端主动关闭')
      this.ws = null
    }

    this.status = 'closed'
  }

  /** 获取当前连接状态 */
  getStatus(): WsStatus {
    return this.status
  }

  // ==================== 私有方法 ====================

  /** 启动心跳定时器 */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send(this.options.heartbeatMessage)
    }, this.options.heartbeatInterval)
  }

  /** 停止心跳定时器 */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /** 调度重连（指数退避） */
  private scheduleReconnect(): void {
    if (this.options.maxReconnectAttempts === 0) return
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error(`[WebSocket] 已达最大重连次数 (${this.options.maxReconnectAttempts})，停止重连`)
      return
    }

    // 指数退避：base * 2^attempt，最大不超过 30 秒
    const delay = Math.min(
      this.options.reconnectBase * Math.pow(2, this.reconnectAttempts),
      30000,
    )

    this.reconnectAttempts++
    this.options.onReconnect?.(this.reconnectAttempts)

    console.log(`[WebSocket] 第 ${this.reconnectAttempts} 次重连，延迟 ${delay}ms`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  /** 清除重连定时器 */
  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

// ============================================================
// 便捷工厂函数
// ============================================================

/**
 * 快速创建一个已连接的 WebSocket
 *
 * @example
 * const ws = createWebSocket('ws://localhost:8080/ws', {
 *   onMessage: (data) => console.log('收到:', data),
 *   onReconnect: (n) => console.log(`重连第 ${n} 次`),
 * })
 */
export function createWebSocket(url: string, options: WsOptions = {}): HeartbeatWebSocket {
  const ws = new HeartbeatWebSocket(url, options)
  ws.connect()
  return ws
}
