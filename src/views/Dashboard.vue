<!--
  仪表盘 —— 数据通过 API 获取
  数据流: onMounted → dashboardApi.getStats() → Mock → 渲染
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  AlertOutlined,
} from '@ant-design/icons-vue'
import { getDashboardStats, type DashboardStats } from '@/api/dashboard'

const { t } = useI18n()

const stats = ref<DashboardStats | null>(null)
const loading = ref(false)

// 卡片配置
const statCards = [
  {
    key: 'totalUsers',
    title: 'dashboard.totalUsers',
    icon: UserOutlined,
    color: '#1890ff',
    prefix: '',
    suffix: '',
    trend: 12.5,
  },
  {
    key: 'totalOrders',
    title: 'dashboard.totalOrders',
    icon: ShoppingCartOutlined,
    color: '#52c41a',
    prefix: '',
    suffix: '',
    trend: -3.2,
  },
  {
    key: 'revenue',
    title: 'dashboard.revenue',
    icon: DollarOutlined,
    color: '#faad14',
    prefix: '¥',
    suffix: '',
    trend: 8.1,
  },
  {
    key: 'pendingTasks',
    title: 'dashboard.tasks',
    icon: AlertOutlined,
    color: '#ff4d4f',
    prefix: '',
    suffix: '',
    trend: 0,
  },
]

const statusColorMap: Record<string, string> = {
  completed: 'green',
  processing: 'blue',
  pending: 'orange',
}

onMounted(async () => {
  loading.value = true
  stats.value = await getDashboardStats()
  loading.value = false
})
</script>

<template>
  <a-spin :spinning="loading">
    <div class="dashboard">
      <a-page-header :title="t('dashboard.title')" :sub-title="t('dashboard.welcome')" />

      <!-- 统计卡片 -->
      <a-row :gutter="16" class="stats-row">
        <a-col v-for="card in statCards" :key="card.key" :xs="24" :sm="12" :lg="6">
          <a-card class="stat-card" hoverable>
            <a-statistic
              :title="t(card.title)"
              :value="(stats as any)?.[card.key] ?? 0"
              :prefix="card.prefix || ''"
              :suffix="card.suffix"
              :value-style="{ color: card.color }"
            >
              <template #prefix>
                <component :is="card.icon" :style="{ color: card.color, fontSize: '24px' }" />
              </template>
            </a-statistic>
            <div class="stat-trend">
              <template v-if="card.trend > 0">
                <span class="trend-up"><ArrowUpOutlined /> {{ card.trend }}%</span>
              </template>
              <template v-else-if="card.trend < 0">
                <span class="trend-down"><ArrowDownOutlined /> {{ Math.abs(card.trend) }}%</span>
              </template>
              <span v-else class="trend-flat">—</span>
              <span class="trend-label">vs 上周</span>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <!-- 系统状态 -->
        <a-col :xs="24" :lg="12">
          <a-card :title="t('dashboard.systemStatus')" class="section-card">
            <div v-for="m in stats?.monitors ?? []" :key="m.label" class="monitor-item">
              <span class="monitor-label">{{ m.label }}</span>
              <a-progress
                :percent="m.percent"
                :status="m.percent > 80 ? 'exception' : 'active'"
                :stroke-width="12"
                style="flex: 1; margin: 0 16px"
              />
              <span :style="{ color: m.percent > 80 ? '#ff4d4f' : '#52c41a' }"
                >{{ m.percent }}%</span
              >
            </div>
          </a-card>
        </a-col>

        <!-- 近期订单 -->
        <a-col :xs="24" :lg="12">
          <a-card :title="t('dashboard.recentOrders')" class="section-card">
            <a-table
              :dataSource="stats?.recentOrders ?? []"
              :pagination="false"
              size="small"
              rowKey="id"
            >
              <a-table-column title="ID" dataIndex="id">
                <template #default="{ text }"
                  ><a-tag color="blue">{{ text }}</a-tag></template
                >
              </a-table-column>
              <a-table-column title="客户" dataIndex="customer" />
              <a-table-column title="金额" dataIndex="amount">
                <template #default="{ text }">¥{{ text }}</template>
              </a-table-column>
              <a-table-column title="状态" dataIndex="status">
                <template #default="{ text }"
                  ><a-tag :color="statusColorMap[text]">{{ text }}</a-tag></template
                >
              </a-table-column>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </a-spin>
</template>

<style scoped>
.stats-row {
  margin-bottom: 16px;
}
.stat-card {
  margin-bottom: 16px;
}
.stat-trend {
  margin-top: 8px;
  font-size: 13px;
}
.trend-up {
  color: #52c41a;
}
.trend-down {
  color: #ff4d4f;
}
.trend-flat {
  color: #999;
}
.trend-label {
  color: #999;
  margin-left: 4px;
}
.section-card {
  margin-bottom: 16px;
}
.monitor-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}
.monitor-label {
  width: 100px;
  flex-shrink: 0;
  font-size: 13px;
  color: #666;
}
</style>
