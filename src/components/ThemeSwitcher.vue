<!--
  ============================================================
  ThemeSwitcher.vue — 主题切换
  知识点：
  - Teleport — 渲染到指定 DOM 节点
  - storeToRefs — 解构 store 保持响应式
  - Transition — 过渡动画
  ============================================================
-->
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
</script>

<template>
  <!--
    Teleport — 将组件内容渲染到 body 下的指定位置
    这在弹窗/通知/全局浮层场景非常有用
  -->
  <Teleport to="body">
    <div class="theme-switcher">
      <button
        class="theme-btn"
        :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
        @click="themeStore.toggle()"
      >
        <!-- 动态显示当前主题图标 -->
        <Transition name="rotate" mode="out-in">
          <span v-if="isDark" key="dark">🌙</span>
          <span v-else key="light">☀️</span>
        </Transition>
      </button>

      <span class="theme-label">{{ isDark ? '深色' : '浅色' }}</span>
    </div>
  </Teleport>
</template>

<style scoped>
.theme-switcher {
  position: fixed;
  top: 16px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1000;
}

.theme-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--color-border, #e8e8e8);
  background: var(--color-card, #fff);
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-label {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
}

/* Transition — 切换动画 */
.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.3s ease;
}

.rotate-enter-from {
  opacity: 0;
  transform: rotate(-180deg) scale(0.5);
}

.rotate-leave-to {
  opacity: 0;
  transform: rotate(180deg) scale(0.5);
}
</style>
