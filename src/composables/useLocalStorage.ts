// ============================================================
// 组合式函数 (Composable) — useLocalStorage
// 知识点：泛型约束 / watchEffect / JSON 序列化 / 错误处理
// ============================================================

import { ref, watch, type Ref } from 'vue'

/**
 * 将响应式数据持久化到 localStorage
 *
 * 知识点：
 * 1. 泛型约束 — 确保类型安全
 * 2. watch — 深度监听对象变化
 * 3. JSON.stringify/parse — 序列化与反序列化
 * 4. try/catch — 处理 JSON 解析异常
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  // 尝试从 localStorage 读取并反序列化
  function read(): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        return JSON.parse(raw) as T
      }
    } catch (e) {
      console.warn(`[useLocalStorage] 读取 "${key}" 失败:`, e)
    }
    return defaultValue
  }

  // 序列化并写入 localStorage
  function write(value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn(`[useLocalStorage] 写入 "${key}" 失败:`, e)
    }
  }

  // 创建响应式数据，初始值从 localStorage 读取
  const data = ref<T>(read()) as Ref<T>

  // 深度监听变化并自动持久化
  watch(
    () => data.value,
    (newVal) => {
      write(newVal)
    },
    { deep: true }, // 深度监听 — 对象内部属性变化也会触发
  )

  return data
}
