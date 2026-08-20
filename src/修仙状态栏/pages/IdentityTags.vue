<template>
  <span class="xy-idtags">
    <!-- 查看态：标签 -->
    <template v-if="!state.editMode">
      <span v-for="(t, i) in list" :key="i" class="xy-idtag">{{ t }}</span>
    </template>
    <!-- 编辑态：逐条可编辑(清空即删除) + ＋新增 -->
    <template v-else>
      <span v-for="(t, i) in list" :key="i" class="xy-idtag xy-idtag-edit">
        <EditableValue :model-value="t" :label="label" @update:model-value="setAt(i, $event)" />
      </span>
      <button
        v-if="!adding"
        type="button"
        class="xy-idtag-add"
        :title="`新增${label}`"
        @click.stop="startAdd"
      >
        ＋
      </button>
      <input
        v-else
        ref="newInput"
        v-model="newDraft"
        class="xy-edit-input xy-idtag-new"
        :placeholder="label"
        @keydown.enter.prevent="commitAdd"
        @keydown.escape.prevent="cancelAdd"
        @blur="commitAdd"
        @click.stop
      />
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import EditableValue from './EditableValue.vue';
import { state } from '../composables';

const props = withDefaults(defineProps<{ modelValue: string[] | undefined; label?: string }>(), {
  label: '身份',
});
const emit = defineEmits<{ 'update:modelValue': [string[]] }>();

const list = computed<string[]>(() => props.modelValue ?? []);
const adding = ref(false);
const newDraft = ref('');
const newInput = ref<HTMLInputElement | null>(null);

// 编辑某条目：清空(去空白后为空)视为删除该条目
function setAt(i: number, v: string | number) {
  const next = [...list.value];
  const val = String(v).trim();
  if (!val) next.splice(i, 1);
  else next[i] = val;
  emit('update:modelValue', next);
}

// ＋ 新增：展开一个输入框，仅非空(且不重复)才落库；空则丢弃，不留空条目
function startAdd() {
  adding.value = true;
  newDraft.value = '';
  nextTick(() => newInput.value?.focus());
}
function commitAdd() {
  if (!adding.value) return;
  const val = newDraft.value.trim();
  if (val && !list.value.includes(val)) emit('update:modelValue', [...list.value, val]);
  adding.value = false;
  newDraft.value = '';
}
function cancelAdd() {
  adding.value = false;
  newDraft.value = '';
}
</script>
