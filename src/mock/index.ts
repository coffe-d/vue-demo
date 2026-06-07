// ============================================================
// Mock 服务入口 —— 拦截 fetch 请求，转发到 mock handlers
// 知识点：模拟后端 API 的基础设施，真实项目替换为 axios + 真实后端
// ============================================================

import { handleRequest } from './handlers'

// 原始 fetch 引用
const originalFetch = window.fetch

// 重写 window.fetch：拦截以 /api/ 开头的请求
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

  // 非 /api/ 请求走真实 fetch（如静态资源）
  if (!url.includes('/api/')) {
    return originalFetch(input, init)
  }

  // 解析请求体
  let body: unknown = null
  if (init?.body) {
    try {
      body = JSON.parse(init.body as string)
    } catch {
      body = init.body
    }
  }

  // 去掉 origin 部分，只保留路径
  const fullUrl = url.replace(location.origin, '')
  const [pathname, queryString] = fullUrl.split('?')

  // 对于 GET 请求，将 query 参数合并到 body
  if (!body && queryString) {
    const params: Record<string, string> = {}
    for (const [k, v] of new URLSearchParams(queryString)) {
      params[k] = v
    }
    body = params
  }

  const result = await handleRequest(pathname, init?.method || 'GET', body)

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

console.log('[Mock] 模拟 API 服务已启动（fetch 拦截模式）')
console.log('[Mock] 拦截路径: /api/*')
console.log('[Mock] 可用账号: admin/123456, editor/123456, guest/123456')
