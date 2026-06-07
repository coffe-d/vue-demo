<!--
  ProductPricePanel.vue — 产品价格详情面板
  选中产品后展示：进价分解 | 多级售价 | 产品信息
-->
<script setup lang="ts">
import { TagOutlined } from '@ant-design/icons-vue'
import type { ProductRecord } from '@/types'

defineProps<{
  product: ProductRecord
  categoryPath: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <transition name="pm-panel-slide">
    <div v-if="product" class="pm-price-panel" @click.stop>
      <div class="pm-price-panel--head">
        <div class="pm-price-panel--title">
          <TagOutlined />
          <span>{{ product.name }}</span>
          <span class="pm-price-panel--code">{{ product.code }}</span>
        </div>
        <a-button type="text" size="small" @click="emit('close')">✕</a-button>
      </div>

      <div class="pm-price-panel--body">
        <!-- 进价信息 -->
        <div class="pm-price-card">
          <div class="pm-price-card--title">进价信息</div>
          <div class="pm-price-card--rows">
            <div class="pm-price-row">
              <span class="pm-price-row--label">最后进价</span>
              <span class="pm-price-row--value">¥{{ product.lastPurchasePrice.toFixed(2) }}</span>
            </div>
            <div class="pm-price-row">
              <span class="pm-price-row--label">运费分摊</span>
              <span class="pm-price-row--value pm-freight">+ ¥{{ product.freightAllocation.toFixed(2) }}</span>
            </div>
            <div class="pm-price-row pm-price-row--total">
              <span class="pm-price-row--label">含运费进价</span>
              <span class="pm-price-row--value pm-highlight">¥{{ product.purchasePriceWithFreight.toFixed(2) }}</span>
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

        <!-- 售价体系 -->
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

        <!-- 产品信息 -->
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
  font-family: 'SF Mono', 'JetBrains Mono', 'Consolas', monospace;
}
.pm-price-panel--body {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto;
}

.pm-price-card {
  flex: 1;
  min-width: 180px;
  background: #fafaf7;
  border-radius: 6px;
  padding: 14px 16px;
  border: 1px solid #e7e5e2;
}
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
.pm-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.pm-price-row--label { color: #a8a29e; }
.pm-price-row--value {
  font-weight: 500;
  color: #44403c;
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', 'JetBrains Mono', 'Consolas', monospace;
}
.pm-price-row--value.pm-highlight {
  color: #b45309;
  font-size: 15px;
  font-weight: 700;
}
.pm-price-row--value.pm-sell { color: #0d9488; font-weight: 600; }
.pm-price-row--value.pm-freight { color: #a8a29e; }
.pm-price-row--total {
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px dashed #e7e5e2;
}
.pm-price-row--empty { color: #a8a29e; }
.pm-price-card--hint {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #e7e5e2;
  font-size: 12px;
  color: #a8a29e;
}

/* 动画 */
.pm-panel-slide-enter-active { transition: all 0.25s ease; }
.pm-panel-slide-leave-active { transition: all 0.2s ease; }
.pm-panel-slide-enter-from { max-height: 0; opacity: 0; transform: translateY(-8px); }
.pm-panel-slide-leave-to { max-height: 0; opacity: 0; }
</style>
