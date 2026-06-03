<!--
  ============================================================
  StatsPanel.vue — 统计面板
  知识点：
  - inject — 接收祖先组件 provide 的数据
  - computed — 数据聚合
  - v-for 对象遍历
  - 生命周期 onMounted
  - 条件渲染
  ============================================================
-->
<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { useTodoStore } from '@/stores/todoStore'
import { useThemeStore } from '@/stores/themeStore'
import type { ComponentProps } from '@/types'
import { Priority } from '@/types'

// ---------- Props ----------
const props = withDefaults(defineProps<ComponentProps.StatsPanel>(), {
  showChart: false,
})

// ---------- Store ----------
const todoStore = useTodoStore()
useThemeStore() // 主题 store（仅展示使用方式）

// ---------- inject — 注入祖先组件通过 provide 提供的数据 ----------
inject<Ref<number>>('totalCount')
const appName = inject<string>('appName', '默认应用名')

// ---------- Computed ----------
// 各优先级完成数量
const priorityStats = computed(() => {
  const stats: { label: string; total: number; done: number; rate: number }[] = []
  const groups = todoStore.groupedByPriority

  const labels: Record<Priority, string> = {
    [Priority.LOW]: '低优先级',
    [Priority.MEDIUM]: '中优先级',
    [Priority.HIGH]: '高优先级',
  }

  for (const p of [Priority.HIGH, Priority.MEDIUM, Priority.LOW] as Priority[]) {
    const todos = groups[p]
    const done = todos.filter((t) => t.status === 2).length // DONE = 2
    stats.push({
      label: labels[p] ?? p,
      total: todos.length,
      done,
      rate: todos.length > 0 ? Math.round((done / todos.length) * 100) : 0,
    })
  }
  return stats
})

// 完成率
const completionRate = computed(() => {
  if (todoStore.totalCount === 0) return 0
  return Math.round((todoStore.doneCount / todoStore.totalCount) * 100)
})

// 进度条颜色（根据完成率变化）
const progressColor = computed(() => {
  if (completionRate.value >= 80) return 'var(--color-success, #52c41a)'
  if (completionRate.value >= 40) return 'var(--color-warning, #faad14)'
  return 'var(--color-primary, #4a5cf7)'
})
</script>

<template>
  <div class="stats-panel">
    <h4>{{ props.title }}</h4>
    <p class="app-name">应用：{{ appName }}（注入自顶层）</p>

    <!-- 总体统计 -->
    <div class="stats-cards">
      <div class="stat-card">
        <span class="stat-value">{{ todoStore.totalCount }}</span>
        <span class="stat-label">总计</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ todoStore.undoneCount }}</span>
        <span class="stat-label">待完成</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ todoStore.doneCount }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ completionRate }}%</span>
        <span class="stat-label">完成率</span>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar-container">
      <div
        class="progress-bar-fill"
        :style="{
          width: completionRate + '%',
          backgroundColor: progressColor,
        }"
      ></div>
    </div>

    <!-- 按优先级统计 — v-if 条件渲染 -->
    <div v-if="props.showChart" class="priority-stats">
      <h5>按优先级统计</h5>
      <div v-for="stat in priorityStats" :key="stat.label" class="priority-row">
        <span class="priority-label">{{ stat.label }}</span>
        <div class="priority-bar-bg">
          <div class="priority-bar-fill" :style="{ width: stat.rate + '%' }"></div>
        </div>
        <span class="priority-num">{{ stat.done }}/{{ stat.total }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  background: var(--color-card, #fff);
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.stats-panel h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: var(--color-text, #333);
}

.app-name {
  font-size: 11px;
  color: var(--color-text-secondary, #999);
  margin: 0 0 12px 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: var(--color-bg, #f0f2f5);
  border-radius: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary, #4a5cf7);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
  margin-top: 2px;
}

/* 进度条 */
.progress-bar-container {
  height: 8px;
  background: var(--color-bg, #f0f2f5);
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* 优先级统计 */
.priority-stats h5 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: var(--color-text-secondary, #666);
}

.priority-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.priority-label {
  font-size: 12px;
  color: var(--color-text, #333);
  min-width: 70px;
}

.priority-bar-bg {
  flex: 1;
  height: 6px;
  background: var(--color-bg, #f0f2f5);
  border-radius: 3px;
  overflow: hidden;
}

.priority-bar-fill {
  height: 100%;
  background: var(--color-primary, #4a5cf7);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.priority-num {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
  min-width: 40px;
  text-align: right;
}
</style>
