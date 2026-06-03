<!--
  组合式函数演示页 —— 知识点：自定义 Composable、防抖、localStorage 持久化
  展示 useDebounce / useLocalStorage / useShortcuts 的组合使用
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDebounce, useDebouncedFn } from '@/composables/useDebounce'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useShortcuts } from '@/composables/useShortcuts'
import { message } from 'ant-design-vue'

const { t } = useI18n()

// ============ useDebounce 演示 ============
const rawInput = ref('')
// 将 rawInput 包装为防抖值，300ms 后才更新
const debouncedInput = useDebounce(rawInput, 300)

// 防抖函数演示
const clickCount = ref(0)
const debouncedClick = useDebouncedFn(() => {
  clickCount.value++
}, 500)

// ============ useLocalStorage 演示 ============
// 自动与 localStorage 同步的响应式 ref
const savedText = useLocalStorage('demo-saved-text', '这是一段会持久化保存的文字')

// ============ useShortcuts 页面内演示 ============
// 局部快捷键只在当前页面生效
const { lastPressed, lastDescription } = useShortcuts(
  [
    {
      key: 's',
      ctrl: true,
      shift: true,
      description: '保存当前内容',
      handler: () => message.success('Ctrl+Shift+S: 已保存'),
    },
    {
      key: 'r',
      ctrl: true,
      shift: true,
      description: '重置输入',
      handler: () => {
        rawInput.value = ''
        savedText.value = ''
      },
    },
  ],
  false,
)
</script>

<template>
  <div class="composable-demo">
    <a-page-header :title="t('composables.title')">
      <template #subTitle>Vue 3 Composition API 逻辑复用模式</template>
    </a-page-header>

    <a-row :gutter="16">
      <!-- useDebounce 演示 -->
      <a-col :xs="24" :lg="12">
        <a-card :title="t('composables.debounceDemo')" class="demo-card">
          <p style="color: #999; font-size: 12px; margin-bottom: 12px">
            {{ t('composables.typeHint') }}
          </p>
          <a-input v-model:value="rawInput" :placeholder="t('composables.typeHint')" size="large" />
          <a-divider />
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item :label="t('composables.realTimeValue')">
              <a-tag color="blue">{{ rawInput || '—' }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item :label="t('composables.debouncedValue')">
              <a-tag color="green">{{ debouncedInput || '—' }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />
          <p style="color: #999; font-size: 12px">
            防抖函数演示：快速点击按钮，计数器只会在最后一次点击 500ms 后 +1
          </p>
          <a-space>
            <a-button type="primary" @click="debouncedClick">快速点击我（防抖）</a-button>
            <a-tag>计数: {{ clickCount }}</a-tag>
          </a-space>
        </a-card>
      </a-col>

      <!-- useLocalStorage 演示 -->
      <a-col :xs="24" :lg="12">
        <a-card :title="t('composables.localStorageDemo')" class="demo-card">
          <p style="color: #999; font-size: 12px; margin-bottom: 12px">
            {{ t('composables.inputPersist') }}
          </p>
          <a-textarea
            v-model:value="savedText"
            :rows="4"
            :placeholder="t('composables.inputPersist')"
          />
          <a-divider />
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item :label="t('composables.savedValue')">
              <span v-if="savedText" style="white-space: pre-wrap">{{ savedText }}</span>
              <span v-else style="color: #ccc">—</span>
            </a-descriptions-item>
          </a-descriptions>
          <p style="color: #999; font-size: 12px; margin-top: 12px">
            提示：修改文本框内容后刷新页面，数据仍然保留在 localStorage 中。
          </p>
        </a-card>
      </a-col>
    </a-row>

    <!-- 快捷键提示 -->
    <a-card title="页面内快捷键" size="small" style="margin-top: 16px">
      <a-space>
        <a-tag color="blue" style="font-family: monospace">Ctrl+Shift+S</a-tag> 保存
        <a-tag color="blue" style="font-family: monospace">Ctrl+Shift+R</a-tag> 重置
      </a-space>
      <span v-if="lastPressed" style="margin-left: 16px; color: #52c41a">
        最后触发: {{ lastPressed }} — {{ lastDescription }}
      </span>
    </a-card>
  </div>
</template>

<style scoped>
.demo-card {
  margin-bottom: 16px;
}
</style>
