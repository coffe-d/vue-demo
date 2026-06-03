import { onMounted, onUnmounted, ref } from 'vue'

// 快捷键配置项类型
export interface ShortcutConfig {
  key: string // KeyboardEvent.key 值，如 'k', 's'
  ctrl?: boolean // 是否需要 Ctrl
  shift?: boolean // 是否需要 Shift
  alt?: boolean // 是否需要 Alt
  meta?: boolean // 是否需要 Meta (Mac 的 Cmd)
  description: string // 快捷键描述
  handler: () => void // 触发时的回调
}

// 全局快捷键注册 composable —— 支持全局和局部两种模式
export function useShortcuts(shortcuts: ShortcutConfig[], isGlobal = false) {
  const lastPressed = ref('')
  const lastDescription = ref('')

  // 按下的键盘事件处理
  function onKeyDown(e: KeyboardEvent) {
    // 忽略在输入框中的按键（除非是 Escape 之类的特殊键）
    const target = e.target as HTMLElement
    const isInput =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    for (const sc of shortcuts) {
      const keyMatch = e.key.toLowerCase() === sc.key.toLowerCase()
      const ctrlMatch = !!sc.ctrl === (e.ctrlKey || e.metaKey)
      const shiftMatch = !!sc.shift === e.shiftKey
      const altMatch = !!sc.alt === e.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        // 全局模式下，跳过输入框中的普通快捷键
        if (isGlobal && isInput && !['Escape'].includes(e.key)) {
          continue
        }
        e.preventDefault()
        lastPressed.value = formatShortcut(sc)
        lastDescription.value = sc.description
        sc.handler()
        return
      }
    }
  }

  // 格式化快捷键为可读字符串
  function formatShortcut(sc: ShortcutConfig): string {
    const parts: string[] = []
    if (sc.ctrl) parts.push('Ctrl')
    if (sc.shift) parts.push('Shift')
    if (sc.alt) parts.push('Alt')
    parts.push(sc.key.toUpperCase())
    return parts.join(' + ')
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

  return { lastPressed, lastDescription }
}

// 将快捷键列表格式化为展示用的表格数据
export function formatShortcutList(
  shortcuts: ShortcutConfig[],
): { key: string; description: string }[] {
  return shortcuts.map((sc) => ({
    key: formatShortcutListEntry(sc),
    description: sc.description,
  }))
}

function formatShortcutListEntry(sc: ShortcutConfig): string {
  const parts: string[] = []
  if (sc.ctrl) parts.push('Ctrl')
  if (sc.shift) parts.push('Shift')
  if (sc.alt) parts.push('Alt')
  parts.push(sc.key.toUpperCase())
  return parts.join(' + ')
}
