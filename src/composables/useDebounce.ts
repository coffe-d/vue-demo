// ============================================================
// 组合式函数 (Composable) — useDebounce
// 知识点：ref / watch / 泛型 / 函数重载
// ============================================================

import { ref, watch, type Ref } from 'vue'

/**
 * 防抖组合式函数
 *
 * 知识点：
 * 1. 泛型函数 — <T> 让函数适用于任意类型
 * 2. Ref<T> — Vue 的响应式引用类型
 * 3. watch — 监听响应式值的变化
 */

export function useDebounce<T>(source: Ref<T>, delay: number = 300): Ref<T> {
  // 创建新的 ref 来存储防抖后的值
  const debounced = ref<T>(source.value) as Ref<T>

  let timer: ReturnType<typeof setTimeout> | null = null

  // watch 监听源值变化，延迟更新目标值
  watch(
    () => source.value,
    (newVal) => {
      // 清除之前的定时器
      if (timer !== null) {
        clearTimeout(timer)
      }
      // 设置新的定时器
      timer = setTimeout(() => {
        debounced.value = newVal
        timer = null
      }, delay)
    },
  )

  return debounced
}

/**
 * 函数防抖版本 — 返回一个防抖后的函数
 * 适用于事件处理场景（如搜索输入）
 */
export function useDebouncedFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>): void => {
    if (timer !== null) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }
}
