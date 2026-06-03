<!--
  ============================================================
  TodoForm.vue — 添加待办表单
  知识点：
  - <script setup> 语法糖
  - defineEmits — 声明组件事件
  - defineProps — 声明组件属性
  - defineExpose — 暴露方法给父组件
  - ref / reactive — 响应式基础
  - v-model — 双向绑定
  - watchEffect — 自动追踪依赖的副作用
  - 条件渲染 v-if
  ============================================================
-->
<script setup lang="ts">
import { ref, reactive, watchEffect } from 'vue'
import type { ComponentProps } from '@/types'
import { Priority } from '@/types'

// ---------- defineProps — 声明 Props ----------
// 支持纯类型声明（TypeScript 类型字面量）
const props = withDefaults(defineProps<ComponentProps.TodoForm>(), {
  loading: false,
})

// ---------- defineEmits — 声明 Emits ----------
// 支持类型安全的 emit 声明
const emit = defineEmits<{
  // 事件名: [参数类型]
  (e: 'submit', payload: { title: string; description: string; priority: Priority }): void
}>()

// ---------- ref — 基础类型响应式 ----------
const title = ref('')
const description = ref('')

// ---------- reactive — 对象类型响应式 ----------
// reactive 不能重新赋值整个对象，适合固定结构的对象
const formState = reactive({
  priority: Priority.MEDIUM as Priority,
  isValid: false,
  touched: false,
})

// ---------- watchEffect — 自动追踪依赖 ----------
// 当 title/description 变化时自动重新执行
watchEffect(() => {
  formState.touched = title.value.length > 0 || description.value.length > 0
  formState.isValid = title.value.trim().length > 0
})

// ---------- 方法 ----------
function handleSubmit(): void {
  if (!formState.isValid) return

  emit('submit', {
    title: title.value.trim(),
    description: description.value.trim(),
    priority: formState.priority,
  })

  // 重置表单
  title.value = ''
  description.value = ''
  formState.priority = Priority.MEDIUM
}

// ---------- defineExpose — 暴露方法/属性给父组件 ----------
// 父组件通过 ref 可以调用这些
defineExpose({
  resetForm() {
    title.value = ''
    description.value = ''
    formState.priority = Priority.MEDIUM
  },
  formState,
})
</script>

<template>
  <!-- @submit.prevent — 事件修饰符阻止默认行为 -->
  <form class="todo-form" @submit.prevent="handleSubmit">
    <h3>📝 添加新待办</h3>

    <div class="form-group">
      <label for="title">标题 *</label>
      <!-- v-model 双向绑定 ref -->
      <!-- :class 动态绑定 class -->
      <input
        id="title"
        v-model="title"
        type="text"
        placeholder="输入待办事项..."
        :class="{ 'input-error': formState.touched && !formState.isValid }"
      />
    </div>

    <div class="form-group">
      <label for="desc">描述</label>
      <textarea id="desc" v-model="description" rows="2" placeholder="详细描述（可选）"></textarea>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="priority">优先级</label>
        <select id="priority" v-model="formState.priority">
          <!-- v-for 列表渲染 -->
          <option
            v-for="(label, key) in { low: '🟢 低', medium: '🟡 中', high: '🔴 高' }"
            :key="key"
            :value="key"
          >
            {{ label }}
          </option>
        </select>
      </div>

      <button type="submit" class="btn btn-primary" :disabled="!formState.isValid || props.loading">
        {{ props.loading ? '添加中...' : '➕ 添加' }}
      </button>
    </div>

    <!-- v-if 条件渲染提示 -->
    <p v-if="formState.touched && !formState.isValid" class="form-hint">⚠️ 标题不能为空</p>
  </form>
</template>

<style scoped>
/* scoped — 样式仅作用于当前组件 */
.todo-form {
  background: var(--color-card, #fff);
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.todo-form h3 {
  margin: 0 0 16px 0;
  color: var(--color-text, #333);
}

.form-group {
  margin-bottom: 12px;
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--color-text-secondary, #666);
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-card, #fff);
  color: var(--color-text, #333);
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary, #4a5cf7);
}

.input-error {
  border-color: var(--color-danger, #ff4d4f) !important;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary, #4a5cf7);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.form-hint {
  color: var(--color-danger, #ff4d4f);
  font-size: 13px;
  margin: 8px 0 0 0;
}
</style>
