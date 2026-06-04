<!--
  ============================================================
  TableFormModal — 独立的表格 CRUD 弹窗组件
  ============================================================
  演示 Vue3 父子组件通信的 4 种核心模式：

  【模式1】Props        — 父传子（数据向下流）
  【模式2】Emits        — 子传父（事件向上冒泡）
  【模式3】v-model      — 双向绑定语法糖（Props + Emits 的简写）
  【模式3】watch        — 响应式监听 prop 变化并同步本地状态
  【模式4】defineExpose — 暴露方法给父组件通过 ref 调用

  推荐用法（声明式）：
    <TableFormModal
      v-model:open="modalVisible"
      :title="modalTitle"
      :record="editingRecord"
      @save="handleSave"
    />

  备选用法（命令式，通过 defineExpose）：
    <TableFormModal ref="modalRef" @save="handleSave" />
    modalRef.value.openModal('新增记录', defaultRecord)
  ============================================================
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { TableRecord } from '@/api/table'

// ============================================================
// 【模式1: Props — 父传子】
// ============================================================
// defineProps 是 Vue3 的编译宏，无需导入。
// 泛型语法 `defineProps<{ ... }>()` 提供完整的 TS 类型支持。
// 父组件通过属性绑定将数据传给子组件：
//   <TableFormModal :open="..." :title="..." :record="..." />
//
// ⚠️ 重要原则：子组件不应直接修改 props！
//   - 基本类型 prop 修改会触发 Vue 警告
//   - 对象类型 prop 修改虽无警告但会导致数据流混乱
//   - 正确做法：创建本地副本，通过 emit 通知父组件修改
interface Props {
  /** 控制弹窗显示/隐藏 — 配合 v-model:open 实现双向绑定 */
  open: boolean
  /** 弹窗标题（"新增记录" / "编辑记录"） */
  title: string
  /** 当前编辑的记录数据，新增时传入空记录 */
  record: TableRecord
}
const props = defineProps<Props>()

// ============================================================
// 【模式2: Emits — 子传父】
// ============================================================
// defineEmits 定义子组件可以发出的事件。
// TS 泛型语法：{ 事件名: [参数类型1, 参数类型2, ...] }
//
//   'update:open' → Vue3 约定命名，配合 v-model:open 实现双向绑定
//   'save'        → 自定义事件，通知父组件执行保存操作
const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [data: TableRecord]
}>()

// ============================================================
// 【模式3: v-model — 双向绑定语法糖】
// ============================================================
// 父组件写：  <TableFormModal v-model:open="modalVisible" />
//
// 等价于：    <TableFormModal
//               :open="modalVisible"
//               @update:open="modalVisible = $event"
//             />
//
// Vue3 支持多个 v-model 绑定：
//   v-model:open="visible"     → :open + @update:open
//   v-model:record="data"      → :record + @update:record
//   v-model:title="t"          → :title + @update:title

// ============================================================
// 本地表单状态 — 核心模式：Prop 副本 + emit 回传
// ============================================================
// 为什么需要本地副本？
//   1. 不直接修改 prop（Vue 单向数据流原则）
//   2. 表单编辑过程中的中间状态不应污染父组件数据
//   3. 用户点了"取消"可以直接丢弃本地修改
//   4. 只在用户点击"保存"时才通过 emit('save', data) 将最终数据传回
const formData = ref<TableRecord>({ ...props.record })

// ============================================================
// 【模式4: watch — 响应式监听 prop 变化】
// ============================================================
// 场景：父组件先修改 editingRecord，然后设置 modalVisible = true
//       watch 监听到 open 变为 true，自动将 prop 数据同步到本地表单
//
// 如果不 watch：formData 停留在上一次编辑的数据，用户会看到旧数据
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // 弹窗打开时：用父组件传入的最新 record 重置本地表单
      // 使用展开运算符创建新对象，切断引用关系
      formData.value = { ...props.record }
    }
  },
)

// ============================================================
// 方法：保存 — 本地校验 → emit 通知父组件
// ============================================================
function handleOk() {
  // --- 表单校验（在子组件中完成，父组件无需关心校验逻辑）---
  if (!formData.value.name.trim() || !formData.value.email.trim()) {
    message.warning('请填写姓名和邮箱')
    return
  }

  // --- 将本地数据通过 emit 传递给父组件 ---
  // 父组件 @save="handleSave" 接收数据并执行 API 调用
  // 使用展开运算符传递副本，避免父组件意外修改子组件数据
  emit('save', { ...formData.value })
}

// --- 取消：通知父组件关闭弹窗 ---
// emit('update:open', false) → 父组件的 modalVisible 自动更新为 false
// 这就是 v-model:open 的双向绑定机制
function handleCancel() {
  emit('update:open', false)
}

// ============================================================
// 【模式5: defineExpose — 暴露方法给父组件命令式调用】
// ============================================================
// 与声明式的 v-model 不同，defineExpose 允许父组件通过
// template ref 直接调用子组件暴露的方法，适合命令式场景：
//
//   <TableFormModal ref="modalRef" @save="handleSave" />
//   const modalRef = ref<InstanceType<typeof TableFormModal>>()
//   modalRef.value?.openModal('新增', defaultRecord)
//
// 优缺点：
//   ✅ 调用方代码更简洁（一行代码打开弹窗）
//   ❌ 数据流不如 props/emits 清晰（违反了"数据向下，事件向上"）
//   💡 推荐：优先用 props + emits，复杂场景可配合 defineExpose
defineExpose({
  /**
   * 命令式打开弹窗（备选方案）
   * @param title 弹窗标题
   * @param record 编辑的记录数据
   */
  openModal(title: string, record: TableRecord) {
    // 由于 title 和 record 是 props，这里不能直接修改
    // defineExpose 模式通常不配合 v-model:open 使用
    // 这里仅作演示，实际项目建议选一种模式坚持到底
    formData.value = { ...record }
    emit('update:open', true)
  },
})
</script>

<template>
  <!--
    v-model:open 拆解：
    - :open="open"            ← Props  父→子（控制弹窗显示）
    - @update:open="..."      ← Emits  子→父（关闭弹窗时通知父组件）
  -->
  <a-modal
    :open="open"
    :title="title"
    :ok-text="$t('common.save')"
    :cancel-text="$t('common.cancel')"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <!--
      表单使用本地 formData 而非 props.record
      → 编辑过程中父组件不受影响
      → 点了"取消"修改自动丢弃
      → 点了"保存"才通过 emit('save') 提交
    -->
    <a-form layout="vertical">
      <a-form-item :label="$t('table.name')" required>
        <a-input v-model:value="formData.name" />
      </a-form-item>
      <a-form-item :label="$t('table.email')" required>
        <a-input v-model:value="formData.email" />
      </a-form-item>
      <a-form-item :label="$t('table.role')">
        <a-select v-model:value="formData.role">
          <a-select-option value="管理员">管理员</a-select-option>
          <a-select-option value="编辑">编辑</a-select-option>
          <a-select-option value="用户">用户</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="$t('table.status')">
        <a-switch
          :checked="formData.status === 'active'"
          checked-children="启用"
          un-checked-children="停用"
          @change="(val: boolean) => (formData.status = val ? 'active' : 'inactive')"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
