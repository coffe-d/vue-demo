<!--
  ProductFormModal.vue — 产品新增/编辑弹窗
  基本信息 | 进价&运费(自动计算含运费进价) | 多级售价 | 备注
-->
<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { ProductRecord, ProductCategory, ProductPriceLevel } from '@/types'

// ===== Props =====
const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  product: ProductRecord | null
  categoryTree: any[]
}>()

// ===== Emits =====
const emit = defineEmits<{
  submit: [data: Partial<ProductRecord>]
  cancel: []
}>()

// ===== 表单内部状态 =====
const submitting = ref(false)

const form = reactive({
  code: '',
  name: '',
  categoryId: 1,
  spec: '',
  unit: '',
  lastPurchasePrice: 0,
  freightAllocation: 0,
  costPrice: 0,
  prices: [] as ProductPriceLevel[],
  stock: 0,
  status: 'active' as 'active' | 'inactive',
  remark: '',
})

const purchasePriceWithFreight = computed(() =>
  form.lastPurchasePrice + form.freightAllocation,
)

// 监听 product 变化，同步到表单
watch(
  () => [props.visible, props.product, props.mode] as const,
  ([visible, product, mode]) => {
    if (!visible) return
    if (mode === 'edit' && product) {
      form.code = product.code
      form.name = product.name
      form.categoryId = product.categoryId
      form.spec = product.spec
      form.unit = product.unit
      form.lastPurchasePrice = product.lastPurchasePrice
      form.freightAllocation = product.freightAllocation
      form.costPrice = product.costPrice
      form.prices = product.prices.map((p) => ({ ...p }))
      form.stock = product.stock
      form.status = product.status
      form.remark = product.remark
    } else {
      form.code = ''
      form.name = ''
      form.categoryId = 1
      form.spec = ''
      form.unit = ''
      form.lastPurchasePrice = 0
      form.freightAllocation = 0
      form.costPrice = 0
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
  // 父组件负责实际 API 调用后关闭弹窗
}

function handleCancel() {
  emit('cancel')
}

// 暴露给父组件调用：外部关闭弹窗 + 重置 submitting
function done() {
  submitting.value = false
}

defineExpose({ done })

function addPriceLevel() {
  form.prices.push({ id: 0, name: `价格${form.prices.length + 1}`, price: 0 })
}

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
      <!-- 基本信息 -->
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

      <!-- 进价信息 -->
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
              <a-input-number
                :value="purchasePriceWithFreight" disabled style="width: 100%" prefix="¥"
                class="pm-input--highlight"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="成本价 (¥)">
              <a-input-number
                v-model:value="form.costPrice" :min="0" :precision="2" style="width: 100%" prefix="¥"
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

      <!-- 多级售价 -->
      <div class="pm-form--section">
        <div class="pm-form--section-title">
          多级售价
          <a-button size="small" type="link" @click="addPriceLevel">
            <PlusOutlined /> 添加价格
          </a-button>
        </div>
        <div class="pm-price-list">
          <div v-for="(p, i) in form.prices" :key="i" class="pm-price-item">
            <a-input v-model:value="p.name" placeholder="价格名称" style="width: 120px" />
            <a-input-number
              v-model:value="p.price" :min="0" :precision="2" placeholder="金额" style="flex: 1" prefix="¥"
            />
            <a-button type="text" danger size="small" @click="removePriceLevel(i)">
              <DeleteOutlined />
            </a-button>
          </div>
        </div>
      </div>

      <!-- 备注 -->
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
