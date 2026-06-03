<!--
  复杂表单页面 —— 知识点：动态表单、联动校验、自定义校验规则、嵌套表单
  覆盖 v-for 渲染表单、watch 联动、Ant Form 的 validateTrigger 等
-->
<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()
const formRef = ref<FormInstance>()

// 省份-城市级联数据（模拟）
const regionData: Record<string, string[]> = {
  广东省: ['广州市', '深圳市', '东莞市', '佛山市'],
  浙江省: ['杭州市', '宁波市', '温州市'],
  江苏省: ['南京市', '苏州市', '无锡市'],
}

// 表单数据 —— 使用 reactive 管理整个表单状态
const formState = reactive({
  username: '',
  email: '',
  phone: '',
  age: undefined as number | undefined,
  province: undefined as string | undefined,
  city: undefined as string | undefined,
  bio: '',
  gender: undefined as string | undefined,
  skills: [] as string[],
  // 嵌套表单：地址对象
  address: {
    street: '',
    zipCode: '',
  },
})

// 动态字段列表
interface DynamicField {
  id: number
  label: string
  value: string
}
let dynamicId = 0
const dynamicFields = reactive<DynamicField[]>([])

// 根据省份计算可选城市列表 —— 表单联动核心逻辑
const cityOptions = computed(() => {
  if (!formState.province) return []
  return regionData[formState.province] || []
})

// 省份变化时清空城市选择
watch(
  () => formState.province,
  () => {
    formState.city = undefined
  },
)

// 添加动态字段
function addDynamicField() {
  dynamicFields.push({ id: ++dynamicId, label: '', value: '' })
}

// 移除动态字段
function removeDynamicField(id: number) {
  const idx = dynamicFields.findIndex((f) => f.id === id)
  if (idx > -1) dynamicFields.splice(idx, 1)
}

// 自定义校验规则 —— 异步校验用户名是否已存在
function checkUsername(_rule: Rule, value: string) {
  if (!value) return Promise.resolve()
  // 模拟异步校验：用户名 'admin' 已被占用
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (value === 'admin') {
        reject(new Error(t('form.formRules.usernameRequired')))
      } else {
        resolve()
      }
    }, 500)
  })
}

// 表单校验规则
const formRules: Record<string, Rule[]> = {
  username: [
    { required: true, message: t('form.formRules.usernameRequired'), trigger: 'blur' },
    { min: 3, message: t('form.formRules.usernameMin'), trigger: 'blur' },
    { validator: checkUsername, trigger: 'blur' },
  ],
  email: [
    { required: true, message: t('form.formRules.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('form.formRules.emailInvalid'), trigger: 'blur' },
  ],
  phone: [
    { required: true, message: t('form.formRules.phoneRequired'), trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: t('form.formRules.phoneInvalid'), trigger: 'blur' },
  ],
  age: [
    { type: 'number', min: 1, max: 150, message: t('form.formRules.ageRange'), trigger: 'change' },
  ],
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate()
    console.log('表单数据:', { ...formState, dynamicFields: [...dynamicFields] })
    message.success(t('form.submitSuccess'))
  } catch {
    message.error(t('common.error'))
  }
}

// 重置
function handleReset() {
  formRef.value?.resetFields()
  dynamicFields.splice(0)
}
</script>

<template>
  <div class="complex-form">
    <a-page-header :title="t('form.title')" />

    <a-card :title="t('form.basicInfo')" class="form-card">
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        layout="vertical"
        style="max-width: 600px"
      >
        <!-- 基础字段 -->
        <a-form-item :label="t('form.username')" name="username">
          <a-input v-model:value="formState.username" :placeholder="t('form.username')" />
        </a-form-item>

        <a-form-item :label="t('form.email')" name="email">
          <a-input v-model:value="formState.email" :placeholder="t('form.email')" />
        </a-form-item>

        <a-form-item :label="t('form.phone')" name="phone">
          <a-input v-model:value="formState.phone" :placeholder="t('form.phone')" />
        </a-form-item>

        <a-form-item :label="t('form.age')" name="age">
          <a-input-number v-model:value="formState.age" :min="1" :max="150" style="width: 100%" />
        </a-form-item>

        <a-form-item :label="t('form.gender')" name="gender">
          <a-radio-group v-model:value="formState.gender">
            <a-radio value="male">男</a-radio>
            <a-radio value="female">女</a-radio>
            <a-radio value="other">其他</a-radio>
          </a-radio-group>
        </a-form-item>

        <!-- 级联选择：省 → 市 -->
        <a-form-item :label="t('form.cascaderDemo')">
          <a-space>
            <a-select
              v-model:value="formState.province"
              :placeholder="t('form.province')"
              style="width: 160px"
              allowClear
            >
              <a-select-option v-for="p in Object.keys(regionData)" :key="p" :value="p">
                {{ p }}
              </a-select-option>
            </a-select>
            <a-select
              v-model:value="formState.city"
              :placeholder="t('form.city')"
              style="width: 160px"
              :disabled="!formState.province"
              allowClear
            >
              <a-select-option v-for="c in cityOptions" :key="c" :value="c">
                {{ c }}
              </a-select-option>
            </a-select>
          </a-space>
        </a-form-item>

        <!-- 嵌套表单：地址子对象 -->
        <a-card type="inner" :title="t('form.nestedForm')" size="small" class="nested-card">
          <a-form-item label="Street" name="address.street">
            <a-input v-model:value="formState.address.street" placeholder="街道地址" />
          </a-form-item>
          <a-form-item label="Zip Code" name="address.zipCode">
            <a-input v-model:value="formState.address.zipCode" placeholder="邮编" />
          </a-form-item>
        </a-card>
      </a-form>
    </a-card>

    <!-- 动态字段区域 -->
    <a-card :title="t('form.dynamicFields')" class="form-card">
      <div v-for="field in dynamicFields" :key="field.id" class="dynamic-row">
        <a-input
          v-model:value="field.label"
          :placeholder="t('form.fieldLabel')"
          style="width: 200px"
        />
        <a-input
          v-model:value="field.value"
          :placeholder="t('form.fieldValue')"
          style="width: 200px"
        />
        <a-button type="text" danger @click="removeDynamicField(field.id)">
          <MinusCircleOutlined /> {{ t('form.removeField') }}
        </a-button>
      </div>
      <a-button type="dashed" block class="add-dynamic-btn" @click="addDynamicField">
        <PlusOutlined /> {{ t('form.addField') }}
      </a-button>
    </a-card>

    <!-- 提交按钮 -->
    <div class="form-actions">
      <a-button type="primary" size="large" @click="handleSubmit">{{
        t('common.submit')
      }}</a-button>
      <a-button size="large" style="margin-left: 12px" @click="handleReset">{{
        t('common.reset')
      }}</a-button>
    </div>
  </div>
</template>

<style scoped>
.complex-form {
  max-width: 800px;
}
.form-card {
  margin-bottom: 16px;
}
.nested-card {
  margin-bottom: 0;
  background: #fafafa;
}
.dynamic-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}
.add-dynamic-btn {
  margin-top: 8px;
}
.form-actions {
  margin-top: 24px;
}
</style>
