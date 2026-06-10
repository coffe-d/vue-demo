<!--
  ProductFormModal.vue — 产品新增/编辑弹窗（表单子组件）
  ============================================================
  架构角色：受控表单组件（Controlled Form Component）
  - 接收父组件的 visible / mode / product 控制弹窗开关和数据初始化
  - 通过 submit / cancel 事件将表单数据交给父组件处理
  - 不自行调用 API，保持组件纯粹性

  表单分区：
  1. 基本信息   — 名称、编码、分类（TreeSelect）、规格、单位
  2. 进价&运费  — 最后进价 + 运费分摊 = 含运费进价（自动计算）
                  成本价、库存数量、启用/停用
  3. 多级售价   — 动态价格列表（名称 + 金额），可增删行
  4. 备注       — 自由文本

  Vue3 知识点：
  - reactive() 管理表单内部状态（多个关联字段）
  - computed 自动计算含运费进价
  - watch 监听 props 变化实现编辑/新增模式的数据回填
  - defineExpose() 暴露方法给父组件调用
  - v-model:value 双向绑定（ant-design-vue 4.x 语法）
-->
<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { ProductRecord, ProductCategory, ProductPriceLevel } from '@/types'

// ===== Props =====
const props = defineProps<{
  /** 弹窗是否可见 */
  visible: boolean
  /** 弹窗模式：创建 / 编辑 */
  mode: 'create' | 'edit'
  /** 编辑时传入的当前产品数据（create 模式下为 null） */
  product: ProductRecord | null
  /** 分类树数据（用于 TreeSelect 组件） */
  categoryTree: any[]
}>()

// ===== Emits =====
const emit = defineEmits<{
  /** 表单提交 — 父组件负责调用 API */
  submit: [data: Partial<ProductRecord>]
  /** 取消 — 父组件负责关闭弹窗 */
  cancel: []
}>()

// ===== 表单内部状态 =====
const submitting = ref(false)

/**
 * 表单数据模型
 * 使用 reactive 而非 ref，因为表单字段多且关联性强
 */
const form = reactive({
  code: '',
  name: '',
  categoryId: 1,
  spec: '',
  unit: '',
  lastPurchasePrice: 0,     // 最后进价
  freightAllocation: 0,     // 运费分摊
  costPrice: 0,             // 成本价
  prices: [] as ProductPriceLevel[], // 多级售价列表
  stock: 0,
  status: 'active' as 'active' | 'inactive',
  remark: '',
})

/**
 * 含运费进价（自动计算）
 * = 最后进价 + 运费分摊
 */
const purchasePriceWithFreight = computed(() =>
  form.lastPurchasePrice + form.freightAllocation,
)

// ===== 数据同步：props → form =====
//
// 监听 visible / product / mode 三个 prop 的变化
// 当弹窗打开时，根据模式初始化或回填表单数据
watch(
  () => [props.visible, props.product, props.mode] as const,
  ([visible, product, mode]) => {
    if (!visible) return // 弹窗关闭时不处理

    if (mode === 'edit' && product) {
      // 编辑模式：将产品数据回填到表单
      form.code = product.code
      form.name = product.name
      form.categoryId = product.categoryId
      form.spec = product.spec
      form.unit = product.unit
      form.lastPurchasePrice = product.lastPurchasePrice
      form.freightAllocation = product.freightAllocation
      form.costPrice = product.costPrice
      // 浅拷贝价格数组（避免引用污染）
      form.prices = product.prices.map((p) => ({ ...p }))
      form.stock = product.stock
      form.status = product.status
      form.remark = product.remark
    } else {
      // 创建模式：初始化为默认值
      form.code = ''
      form.name = ''
      form.categoryId = 1
      form.spec = ''
      form.unit = ''
      form.lastPurchasePrice = 0
      form.freightAllocation = 0
      form.costPrice = 0
      // 默认两条价格（批发价1 + 零售价）
      form.prices = [
        { id: 0, name: '批发价1', price: 0 },
        { id: 0, name: '零售价', price: 0 },
      ]
      form.stock = 0
      form.status = 'active'
      form.remark = ''
    }
  },
  { immediate: true },
)

// ===== 方法 =====

/** 确认提交 — 基础校验后 emit 给父组件 */
function handleOk() {
  if (!form.name.trim()) {
    message.warning('请输入产品名称')
    return
  }
  submitting.value = true
  emit('submit', {
    ...form,
    purchasePriceWithFreight: purchasePriceWithFreight.value,
  })
}

function handleCancel() {
  emit('cancel')
}

/**
 * 供父组件调用的方法 — 外部关闭弹窗后重置 submitting 状态
 * 通过 defineExpose 暴露
 */
function done() {
  submitting.value = false
}

defineExpose({ done })

/** 添加一行价格 */
function addPriceLevel() {
  form.prices.push({
    id: 0,
    name: `价格${form.prices.length + 1}`,
    price: 0,
  })
}

/** 移除指定行价格 */
function removePriceLevel(index: number) {
  form.prices.splice(index, 1)
}
</script>

<template>
  <a-modal
    :open="visible"
    :title="mode === 'create' ? '新增产品' : '编辑产品'"
    width="680px"
    :confirm-loading="submitting"
    :maskClosable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form layout="vertical" class="pm-form">
      <!-- ===== 第1区：基本信息 ===== -->
      <div class="pm-form--section">
        <div class="pm-form--section-title">基本信息</div>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="产品名称" required>
              <a-input v-model:value="form.name" placeholder="请输入产品名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="产品编码">
              <a-input v-model:value="form.code" placeholder="自动生成或手动输入" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属分类">
              <a-tree-select
                v-model:value="form.categoryId"
                :tree-data="categoryTree"
                :field-names="{ children: 'children', label: 'label', value: 'value' }"
                placeholder="请选择分类"
                style="width: 100%"
                tree-default-expand-all
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="规格">
              <a-input v-model:value="form.spec" placeholder="如 800×800mm" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="单位">
              <a-input v-model:value="form.unit" placeholder="如 箱/桶/个" />
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <!-- ===== 第2区：进价 & 运费 ===== -->
      <div class="pm-form--section">
        <div class="pm-form--section-title">进价 & 运费</div>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="最后进价 (¥)">
              <a-input-number
                v-model:value="form.lastPurchasePrice"
                :min="0" :precision="2" style="width: 100%" prefix="¥"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="运费分摊 (¥)">
              <a-input-number
                v-model:value="form.freightAllocation"
                :min="0" :precision="2" style="width: 100%" prefix="¥"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="含运费进价 (自动计算)">
              <!-- disabled: 自动计算，不允许手动修改 -->
              <a-input-number
                :value="purchasePriceWithFreight"
                disabled
                style="width: 100%"
                prefix="¥"
                class="pm-input--highlight"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="成本价 (¥)">
              <a-input-number
                v-model:value="form.costPrice"
                :min="0" :precision="2" style="width: 100%" prefix="¥"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="库存">
              <a-input-number v-model:value="form.stock" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态">
              <a-select v-model:value="form.status" style="width: 100%">
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="inactive">停用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <!-- ===== 第3区：多级售价 ===== -->
      <div class="pm-form--section">
        <div class="pm-form--section-title">
          多级售价
          <a-button size="small" type="link" @click="addPriceLevel">
            <PlusOutlined /> 添加价格
          </a-button>
        </div>
        <!-- 动态价格列表 — v-for 渲染，支持增删 -->
        <div class="pm-price-list">
          <div v-for="(p, i) in form.prices" :key="i" class="pm-price-item">
            <a-input v-model:value="p.name" placeholder="价格名称" style="width: 120px" />
            <a-input-number
              v-model:value="p.price"
              :min="0" :precision="2"
              placeholder="金额"
              style="flex: 1"
              prefix="¥"
            />
            <a-button type="text" danger size="small" @click="removePriceLevel(i)">
              <DeleteOutlined />
            </a-button>
          </div>
        </div>
      </div>

      <!-- ===== 第4区：备注 ===== -->
      <div class="pm-form--section">
        <div class="pm-form--section-title">备注</div>
        <a-textarea v-model:value="form.remark" placeholder="产品备注信息…" :rows="2" />
      </div>
    </a-form>
  </a-modal>
</template>

<style scoped>
.pm-form--section {
  margin-bottom: 20px;
}
.pm-form--section-title {
  font-size: 13px;
  font-weight: 600;
  color: #44403c;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e7e5e2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 含运费进价高亮样式（自动计算的只读字段） */
.pm-input--highlight :deep(.ant-input-number-disabled) {
  color: #b45309;
  font-weight: 700;
  background: #fffbf5;
  border-color: #fcd34d;
}

.pm-price-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pm-price-item {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
