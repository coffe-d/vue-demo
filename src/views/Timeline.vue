<!--
  时间线 & 步骤表单页面 —— 知识点：Ant Timeline 时间线组件、Steps 步骤条
  演示审批流程可视化和分步表单
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'

const { t } = useI18n()

// ============ 审批流程时间线数据 ============
// 模拟一个审批流程的各阶段状态
const timelineItems = reactive([
  {
    label: '张三 提交申请',
    time: '2026-06-02 09:00:00',
    color: 'green',
    icon: CheckCircleOutlined,
  },
  {
    label: '李四 部门审批',
    time: '2026-06-02 10:30:00',
    color: 'green',
    icon: CheckCircleOutlined,
  },
  { label: '王五 经理审批', time: '2026-06-02 14:00:00', color: 'blue', icon: ClockCircleOutlined },
  { label: '财务 最终确认', time: '待处理', color: 'gray', icon: ClockCircleOutlined },
])

// ============ 步骤表单 ============
const currentStep = ref(0)
const stepLoading = ref(false)

// 步骤状态 —— 分为三个独立 reactive 对象，模拟分步表单
const step1Data = reactive({
  name: '',
  department: '',
  date: undefined as string | undefined,
})
const step2Data = reactive({
  description: '',
  budget: undefined as number | undefined,
  priority: 'medium' as string,
})
const step3Data = reactive({
  confirm: false,
})

// 步骤项配置
const steps = [
  { title: t('timeline.step1'), icon: UserOutlined },
  { title: t('timeline.step2'), icon: SolutionOutlined },
  { title: t('timeline.step3'), icon: SmileOutlined },
]

// 下一步
function handleNext() {
  if (currentStep.value === 0 && !step1Data.name) {
    message.warning('请填写姓名')
    return
  }
  if (currentStep.value === 1 && !step2Data.description) {
    message.warning('请填写描述')
    return
  }
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

// 上一步
function handlePrev() {
  if (currentStep.value > 0) currentStep.value--
}

// 提交步骤表单
async function handleStepSubmit() {
  if (!step3Data.confirm) {
    message.warning('请勾选确认')
    return
  }
  stepLoading.value = true
  // 模拟异步提交
  await new Promise((r) => setTimeout(r, 1500))
  stepLoading.value = false
  message.success(t('timeline.stepFormSubmit'))
  // 重置
  currentStep.value = 0
  step1Data.name = ''
  step1Data.department = ''
  step1Data.date = undefined
  step2Data.description = ''
  step2Data.budget = undefined
  step2Data.priority = 'medium'
  step3Data.confirm = false
}

// 新增审批节点
function addTimelineNode() {
  timelineItems.push({
    label: `新审批节点 ${timelineItems.length + 1}`,
    time: new Date().toLocaleString(),
    color: 'green',
    icon: CheckCircleOutlined,
  })
  message.success('已添加新节点')
}
</script>

<template>
  <div class="timeline-page">
    <a-page-header :title="t('timeline.title')" />

    <a-row :gutter="16">
      <!-- 左侧：审批流程时间线 -->
      <a-col :xs="24" :lg="12">
        <a-card :title="t('timeline.approvalFlow')" class="section-card">
          <a-timeline>
            <a-timeline-item v-for="(item, idx) in timelineItems" :key="idx" :color="item.color">
              <template #dot>
                <component :is="item.icon" :style="{ fontSize: '16px' }" />
              </template>
              <strong>{{ item.label }}</strong>
              <br />
              <span style="color: #999; font-size: 12px">{{ item.time }}</span>
            </a-timeline-item>
          </a-timeline>
          <a-button type="dashed" block style="margin-top: 16px" @click="addTimelineNode">
            + 添加审批节点
          </a-button>
        </a-card>
      </a-col>

      <!-- 右侧：步骤表单 -->
      <a-col :xs="24" :lg="12">
        <a-card :title="t('timeline.stepForm')" class="section-card">
          <!-- 步骤指示器 -->
          <a-steps :current="currentStep" size="small" class="steps-bar">
            <a-step v-for="s in steps" :key="s.title" :title="s.title">
              <template #icon><component :is="s.icon" /></template>
            </a-step>
          </a-steps>

          <!-- 步骤 1：基本信息 -->
          <div v-show="currentStep === 0" class="step-content">
            <a-form layout="vertical">
              <a-form-item label="姓名" required>
                <a-input v-model:value="step1Data.name" placeholder="请输入姓名" />
              </a-form-item>
              <a-form-item label="部门">
                <a-select v-model:value="step1Data.department" placeholder="请选择部门">
                  <a-select-option value="tech">技术部</a-select-option>
                  <a-select-option value="product">产品部</a-select-option>
                  <a-select-option value="design">设计部</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="日期">
                <a-date-picker v-model:value="step1Data.date" style="width: 100%" />
              </a-form-item>
            </a-form>
          </div>

          <!-- 步骤 2：详细资料 -->
          <div v-show="currentStep === 1" class="step-content">
            <a-form layout="vertical">
              <a-form-item label="描述" required>
                <a-textarea
                  v-model:value="step2Data.description"
                  :rows="3"
                  placeholder="请输入描述"
                />
              </a-form-item>
              <a-form-item label="预算">
                <a-input-number
                  v-model:value="step2Data.budget"
                  :min="0"
                  style="width: 100%"
                  placeholder="请输入预算金额"
                />
              </a-form-item>
              <a-form-item label="优先级">
                <a-radio-group v-model:value="step2Data.priority">
                  <a-radio value="low">低</a-radio>
                  <a-radio value="medium">中</a-radio>
                  <a-radio value="high">高</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-form>
          </div>

          <!-- 步骤 3：确认 -->
          <div v-show="currentStep === 2" class="step-content">
            <a-form layout="vertical">
              <a-form-item label="确认信息">
                <a-descriptions size="small" bordered :column="1">
                  <a-descriptions-item label="姓名">{{
                    step1Data.name || '—'
                  }}</a-descriptions-item>
                  <a-descriptions-item label="部门">{{
                    step1Data.department || '—'
                  }}</a-descriptions-item>
                  <a-descriptions-item label="描述">{{
                    step2Data.description || '—'
                  }}</a-descriptions-item>
                  <a-descriptions-item label="优先级">{{ step2Data.priority }}</a-descriptions-item>
                </a-descriptions>
              </a-form-item>
              <a-form-item>
                <a-checkbox v-model:checked="step3Data.confirm">我已确认以上信息无误</a-checkbox>
              </a-form-item>
            </a-form>
          </div>

          <!-- 步骤导航按钮 -->
          <div class="step-actions">
            <a-button v-if="currentStep > 0" style="margin-right: 8px" @click="handlePrev">
              {{ t('timeline.previous') }}
            </a-button>
            <a-button v-if="currentStep < 2" type="primary" @click="handleNext">
              {{ t('timeline.next') }}
            </a-button>
            <a-button
              v-if="currentStep === 2"
              type="primary"
              :loading="stepLoading"
              @click="handleStepSubmit"
            >
              {{ t('common.submit') }}
            </a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.section-card {
  margin-bottom: 16px;
  height: calc(100% - 16px);
}
.steps-bar {
  margin-bottom: 24px;
}
.step-content {
  min-height: 200px;
}
.step-actions {
  margin-top: 16px;
  text-align: right;
}
</style>
