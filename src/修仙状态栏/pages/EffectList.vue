<template>
  <span v-for="(_v, n) in modelValue" :key="String(n)" :class="lineClass">
    <span class="xy-effect-name-edit">
      <EditableValue
        :model-value="String(n)"
        :label="`${labelName}名`"
        @update:model-value="renameKey(String(n), String($event))"
      />
    </span>：<EditableValue v-model="modelValue[String(n)]" :label="String(n)" multiline />
    <button
      v-if="state.editMode"
      type="button"
      class="xy-effect-del"
      :title="`删除：${n}`"
      @click.stop="removeKey(String(n))"
    >×</button>
  </span>
  <button
    v-if="state.editMode"
    type="button"
    class="xy-effect-add"
    @click.stop="addEntry"
  >＋ 新增{{ labelName }}</button>
</template>

<script setup lang="ts">
import EditableValue from './EditableValue.vue';
import { state } from '../composables';

const props = withDefaults(
  defineProps<{
    modelValue: Record<string, string> | undefined | null;
    lineClass?: string;
    labelName?: string;
  }>(),
  { lineClass: 'xy-effect-line', labelName: '效果' },
);

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>];
}>();

function renameKey(oldKey: string, newKey: string) {
  newKey = newKey.trim();
  if (!newKey || newKey === oldKey || !props.modelValue) return;
  if (newKey in props.modelValue) return; // 避免覆盖已有键
  const obj = props.modelValue;
  // 重建以保持插入顺序
  const entries = Object.entries(obj).map(
    ([k, v]) => [k === oldKey ? newKey : k, v] as [string, any],
  );
  for (const k of Object.keys(obj)) delete obj[k];
  for (const [k, v] of entries) obj[k] = v;
}

function removeKey(key: string) {
  if (props.modelValue) delete props.modelValue[key];
}

function uniqueName(): string {
  const base = `新${props.labelName}`;
  if (!props.modelValue || !(base in props.modelValue)) return base;
  let i = 2;
  while (`${base}${i}` in props.modelValue) i++;
  return `${base}${i}`;
}

function addEntry() {
  if (!props.modelValue) {
    emit('update:modelValue', { [`新${props.labelName}`]: '' });
    return;
  }
  props.modelValue[uniqueName()] = '';
}
</script>
