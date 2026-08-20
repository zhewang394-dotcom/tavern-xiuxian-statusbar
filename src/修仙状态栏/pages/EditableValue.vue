<template>
  <span class="xy-editable" :class="{ editing, multiline }">
    <template v-if="!editing">
      <slot>{{ display }}</slot>
      <button
        v-if="state.editMode && !disabled"
        type="button"
        class="xy-edit-pencil"
        :title="`编辑${label || ''}`"
        @click.stop="startEdit"
      >
        <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden="true">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      </button>
    </template>
    <input
      v-else-if="!multiline"
      ref="inputEl"
      v-model="draft"
      :type="type === 'number' ? 'number' : 'text'"
      :min="min"
      :max="max"
      :step="step"
      class="xy-edit-input"
      :class="{ 'xy-edit-input-num': type === 'number' }"
      @keydown.enter.prevent="commit"
      @keydown.escape.prevent="cancel"
      @blur="commit"
      @click.stop
    />
    <textarea
      v-else
      ref="inputEl"
      v-model="draft"
      :rows="rows"
      class="xy-edit-input xy-edit-input-multiline"
      @keydown.escape.prevent="cancel"
      @blur="commit"
      @click.stop
    />
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { state } from '../composables';

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined;
    type?: 'text' | 'number';
    label?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
    /** 多行编辑：渲染 textarea，回车换行，按 Esc 取消，失焦提交 */
    multiline?: boolean;
    /** 多行模式下默认行数 */
    rows?: number;
    /** 显示时的格式化函数；不影响存储值 */
    format?: (v: any) => string;
  }>(),
  { type: 'text', step: 1, rows: 2 },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const editing = ref(false);
const draft = ref('');
const inputEl = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

const display = computed(() =>
  props.format ? props.format(props.modelValue) : (props.modelValue ?? ''),
);

function startEdit() {
  draft.value = String(props.modelValue ?? '');
  editing.value = true;
  nextTick(() => {
    inputEl.value?.focus();
    if (!props.multiline) inputEl.value?.select?.();
  });
}

function commit() {
  if (!editing.value) return;
  editing.value = false;
  const raw = draft.value;
  let v: string | number = raw;
  if (props.type === 'number') {
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    v = n;
    if (props.min != null && v < props.min) v = props.min;
    if (props.max != null && v > props.max) v = props.max;
  }
  if (v !== props.modelValue) emit('update:modelValue', v);
}

function cancel() {
  editing.value = false;
}
</script>
