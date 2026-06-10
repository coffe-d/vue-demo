<!--
  ProductPricePanel.vue — 产品价格详情面板（展示型子组件）
  ============================================================
  架构角色：纯展示组件
  - 接收选中的产品数据，以卡片形式展示价格相关信息
  - 点击关闭按钮通知父组件取消选中

  展示内容：
  1. 进价信息卡 — 最后进价 → 运费分摊 → 含运费进价 → 毛利空间
  2. 售价体系卡 — 多级售价列表（批发价1/零售价/...）
  3. 产品信息卡 — 分类路径、规格、单位、库存、创建日期

  Vue3 知识点：
  - 条件渲染 v-show（选中产品时才渲染面板）
  - Transition 过渡动画（面板滑入/滑出）
  - 计算属性在父组件完成（categoryPath 通过 prop 传入）
-->
<script setup lang="ts">
import { TagOutlined } from '@ant-design/icons-vue'
import type { ProductRecord } from '@/types'

// ===== Props =====
defineProps<{
  /** 当前选中的产品（展示用） */
  product: ProductRecord
  /** 产品所属分类的完整路径（如 "建材 > 瓷砖 > 抛光砖"） */
  categoryPath: string
}>()

// ===== Emits =====
const emit = defineEmits<{
  /** 关闭面板 */
  close: []
}>()
</script>

<template>
  <transition name="pm-panel-slide">
    <div v-show="product" class="pm-price-panel" @click.stop>
      <!-- 面板头部：产品名称 + 编码 + 关闭按钮 -->
      <div class="pm-price-panel--head">
        <div class="pm-price-panel--title">
          <TagOutlined />
          <span>{{ product.name }}</span>
          <span class="pm-price-panel--code">{{ product.code }}</span>
        </div>
        <a-button type="text" size="small" @click="emit('close')">✕</a-button>
      </div>

      <div class="pm-price-panel--body">
        <!-- 卡片1：进价信息 + 毛利空间估算 -->
        <div class="pm-price-card">
          <div class="pm-price-card--title">进价信息</div>
          <div class="pm-price-card--rows">
            <div class="pm-price-row">
              <span class="pm-price-row--label">最后进价</span>
              <span class="pm-price-row--value">¥{{ product.lastPurchasePrice.toFixed(2) }}</span>
            </div>
            <div class="pm-price-row">
              <span class="pm-price-row--label">运费分摊</span>
              <span class="pm-price-row--value pm-freight">
                + ¥{{ product.freightAllocation.toFixed(2) }}
              </span>
            </div>
            <!-- 含运费进价 = lastPurchasePrice + freightAllocation，高亮展示 -->
            <div class="pm-price-row pm-price-row--total">
              <span class="pm-price-row--label">含运费进价</span>
              <span class="pm-price-row--value pm-highlight">
                ¥{{ product.purchasePriceWithFreight.toFixed(2) }}
              </span>
            </div>
          </div>
          <div class="pm-price-card--hint">
            毛利空间：¥{{
              (product.prices[0]?.price || 0) - product.purchasePriceWithFreight > 0
                ? ((product.prices[0]?.price || 0) - product.purchasePriceWithFreight).toFixed(2)
                : '—'
            }}
          </div>
        </div>

        <!-- 卡片2：多级售价体系 -->
        <div class="pm-price-card">
          <div class="pm-price-card--title">售价体系</div>
          <div class="pm-price-card--rows">
            <div v-for="p in product.prices" :key="p.id" class="pm-price-row">
              <span class="pm-price-row--label">{{ p.name }}</span>
              <span class="pm-price-row--value pm-sell">¥{{ p.price.toFixed(2) }}</span>
            </div>
            <div v-if="!product.prices?.length" class="pm-price-row pm-price-row--empty">
              <span class="pm-price-row--label">暂无售价</span>
            </div>
          </div>
        </div>

        <!-- 卡片3：产品基本信息 -->
        <div class="pm-price-card pm-price-card--info">
          <div class="pm-price-card--title">产品信息</div>
          <div class="pm-price-card--rows">
            <div class="pm-price-row">
              <span class="pm-price-row--label">所属分类</span>
              <span class="pm-price-row--value">
                <a-tag color="teal" size="small">{{ categoryPath }}</a-tag>
              </span>
            </div>
            <div class="pm-price-row">
              <span class="pm-price-row--label">规格</span>
              <span class="pm-price-row--value">{{ product.spec || '—' }}</span>
            </div>
            <div class="pm-price-row">
              <span class="pm-price-row--label">单位</span>
              <span class="pm-price-row--value">{{ product.unit || '—' }}</span>
            </div>
            <div class="pm-price-row">
              <span class="pm-price-row--label">库存</span>
              <span class="pm-price-row--value">{{ product.stock }}</span>
            </div>
            <div class="pm-price-row">
              <span class="pm-price-row--label">创建日期</span>
              <span class="pm-price-row--value">{{ product.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* ========== 面板容器 ========== */
.pm-price-panel {
  background: #fff;
  border-top: 1px solid #e7e5e2;
}

.pm-price-panel--head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e7e5e2;
  background: #fafaf7;
}

.pm-price-panel--title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #44403c;
}

.pm-price-panel--code {
  font-size: 12px;
  color: #a8a29e;
  font-weight: 400;
  /* 等宽字体使编码对齐更整齐 */
  font-family: 'SF Mono', 'JetBrains Mono', 'Consolas', monospace;
}

.pm-price-panel--body {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto; /* 小屏幕下横向滚动 */
}

/* ========== 信息卡片 ========== */
.pm-price-card {
  flex: 1;
  min-width: 180px;
  background: #fafaf7;
  border-radius: 6px;
  padding: 14px 16px;
  border: 1px solid #e7e5e2;
}

/* 卡片标题：大写小字 + 宽松字间距 */
.pm-price-card--title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #a8a29e;
  margin-bottom: 12px;
}

.pm-price-card--rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ========== 价格行 ========== */
.pm-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.pm-price-row--label {
  color: #a8a29e;
}

.pm-price-row--value {
  font-weight: 500;
  color: #44403c;
  /* 等宽数字：避免价格跳动 */
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', 'JetBrains Mono', 'Consolas', monospace;
}

/* 含运费进价高亮（核心数据） */
.pm-price-row--value.pm-highlight {
  color: #b45309;
  font-size: 15px;
  font-weight: 700;
}

/* 售价用绿色突出 */
.pm-price-row--value.pm-sell {
  color: #0d9488;
  font-weight: 600;
}

/* 运费用灰色弱化 */
.pm-price-row--value.pm-freight {
  color: #a8a29e;
}

/* 虚线分割（进价合计上方） */
.pm-price-row--total {
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px dashed #e7e5e2;
}

.pm-price-row--empty {
  color: #a8a29e;
}

.pm-price-card--hint {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #e7e5e2;
  font-size: 12px;
  color: #a8a29e;
}

/* ========== 过渡动画 ========== */
.pm-panel-slide-enter-active { transition: all 0.25s ease; }
.pm-panel-slide-leave-active { transition: all 0.2s ease; }
.pm-panel-slide-enter-from { max-height: 0; opacity: 0; transform: translateY(-8px); }
.pm-panel-slide-leave-to { max-height: 0; opacity: 0; }
</style>
