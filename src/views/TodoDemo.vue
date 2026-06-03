<!--
  待办事项 —— store 驱动，store action 调用 API
  数据流: Component → todoStore.fetchTodos/addTodo/... → todoApi → Mock → 更新 state
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { useTodoStore } from '@/stores/todoStore'
import type { Priority, Todo } from '@/types'
import { Priority as PriorityEnum, TodoStatus } from '@/types'

const { t } = useI18n()
const todoStore = useTodoStore()
const { todos, totalCount, doneCount, undoneCount, loading } = storeToRefs(todoStore)

const title = ref('')
const description = ref('')
const priority = ref<Priority>(PriorityEnum.MEDIUM)
const editingTodo = ref<Todo | null>(null)
const editVisible = ref(false)

onMounted(() => {
  todoStore.fetchTodos()
})

async function handleAdd() {
  if (!title.value.trim()) return
  await todoStore.addTodo({
    title: title.value.trim(),
    description: description.value.trim(),
    priority: priority.value,
    status: TodoStatus.TODO,
    tags: [],
  })
  title.value = ''
  description.value = ''
  priority.value = PriorityEnum.MEDIUM
  message.success(t('common.success'))
}

async function handleToggle(id: number) {
  await todoStore.toggleStatus(id)
}
async function handleDelete(id: number) {
  await todoStore.removeTodo(id)
  message.success(t('common.success'))
}
function openEdit(todo: Todo) {
  editingTodo.value = { ...todo }
  editVisible.value = true
}

async function handleEditSave() {
  if (!editingTodo.value) return
  await todoStore.updateTodo(editingTodo.value.id, {
    title: editingTodo.value.title,
    description: editingTodo.value.description,
    priority: editingTodo.value.priority,
  })
  editVisible.value = false
  editingTodo.value = null
  message.success(t('common.success'))
}

async function handleClearCompleted() {
  await todoStore.clearCompleted()
  message.success(t('common.success'))
}

const priorityColors: Record<string, string> = {
  [PriorityEnum.LOW]: 'green',
  [PriorityEnum.MEDIUM]: 'blue',
  [PriorityEnum.HIGH]: 'red',
}

function statusLabel(status: number): string {
  if (status === 0) return t('todo.todo_status')
  if (status === 1) return t('todo.inProgress')
  return t('todo.done')
}
</script>

<template>
  <div class="todo-demo">
    <a-page-header :title="t('todo.title')">
      <template #tags>
        <a-tag color="blue">{{ t('todo.total') }}: {{ totalCount }}</a-tag>
        <a-tag color="orange">{{ t('todo.undone') }}: {{ undoneCount }}</a-tag>
        <a-tag color="green">{{ t('todo.done') }}: {{ doneCount }}</a-tag>
      </template>
    </a-page-header>

    <a-card :title="t('common.add')" size="small" class="add-card">
      <a-space direction="vertical" style="width: 100%">
        <a-input
          v-model:value="title"
          :placeholder="t('todo.addPlaceholder')"
          size="large"
          @keyup.enter="handleAdd"
        />
        <a-input v-model:value="description" :placeholder="t('todo.description')" />
        <a-space>
          <a-select v-model:value="priority" style="width: 120px">
            <a-select-option value="low">{{ t('todo.low') }}</a-select-option>
            <a-select-option value="medium">{{ t('todo.medium') }}</a-select-option>
            <a-select-option value="high">{{ t('todo.high') }}</a-select-option>
          </a-select>
          <a-button type="primary" :loading="loading" @click="handleAdd">{{
            t('common.add')
          }}</a-button>
        </a-space>
      </a-space>
    </a-card>

    <a-spin :spinning="loading">
      <a-empty v-if="todos.length === 0" :description="t('common.noData')" class="empty-state" />
      <a-list v-else :dataSource="todos" class="todo-list">
        <template #renderItem="{ item }">
          <a-list-item
            :class="{ 'todo-done': item.status === 2 }"
            :style="{ borderLeft: `3px solid var(--priority-${item.priority})` }"
          >
            <a-list-item-meta>
              <template #title>
                <span :class="{ 'line-through': item.status === 2 }">{{ item.title }}</span>
                <a-tag
                  :color="priorityColors[item.priority]"
                  size="small"
                  style="margin-left: 8px"
                  >{{ t(`todo.${item.priority}`) }}</a-tag
                >
                <a-tag :color="item.status === 2 ? 'green' : 'default'" size="small">{{
                  statusLabel(item.status)
                }}</a-tag>
              </template>
              <template #description>{{ item.description || '—' }}</template>
            </a-list-item-meta>
            <template #actions>
              <a-button type="link" size="small" @click="handleToggle(item.id)">{{
                item.status === 2 ? t('todo.todo_status') : t('todo.done')
              }}</a-button>
              <a-button type="link" size="small" @click="openEdit(item)">{{
                t('common.edit')
              }}</a-button>
              <a-popconfirm
                :title="t('table.deleteConfirm')"
                :ok-text="t('common.yes')"
                :cancel-text="t('common.no')"
                @confirm="handleDelete(item.id)"
              >
                <a-button type="link" size="small" danger>{{ t('common.delete') }}</a-button>
              </a-popconfirm>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-spin>

    <div v-if="doneCount > 0" class="footer-bar">
      <a-button danger size="small" @click="handleClearCompleted"
        >{{ t('todo.clearCompleted') }} ({{ doneCount }})</a-button
      >
    </div>

    <a-modal
      v-model:open="editVisible"
      :title="t('table.editRecord')"
      :ok-text="t('common.save')"
      :cancel-text="t('common.cancel')"
      @ok="handleEditSave"
    >
      <a-space v-if="editingTodo" direction="vertical" style="width: 100%">
        <a-input v-model:value="editingTodo.title" :placeholder="t('todo.addPlaceholder')" />
        <a-input v-model:value="editingTodo.description" :placeholder="t('todo.description')" />
        <a-select v-model:value="editingTodo.priority">
          <a-select-option value="low">{{ t('todo.low') }}</a-select-option>
          <a-select-option value="medium">{{ t('todo.medium') }}</a-select-option>
          <a-select-option value="high">{{ t('todo.high') }}</a-select-option>
        </a-select>
      </a-space>
    </a-modal>
  </div>
</template>

<style scoped>
:root {
  --priority-low: #52c41a;
  --priority-medium: #1890ff;
  --priority-high: #ff4d4f;
}
.add-card {
  margin-bottom: 16px;
}
.todo-done {
  opacity: 0.6;
}
.line-through {
  text-decoration: line-through;
  color: #999;
}
.empty-state {
  padding: 60px 0;
}
.footer-bar {
  margin-top: 16px;
  text-align: right;
}
</style>
