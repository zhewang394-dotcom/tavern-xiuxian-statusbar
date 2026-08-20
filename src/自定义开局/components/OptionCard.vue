<template>
  <button
    type="button"
    class="xs-card"
    :class="[{ selected, disabled }, tone ? `tone-${tone}` : '']"
    :disabled="disabled"
    :style="{ animationDelay: `${(index || 0) * 50}ms` }"
    @click="!disabled && $emit('pick')"
  >
    <span v-if="glyph" class="xs-card-glyph">{{ glyph }}</span>
    <div class="xs-card-head">
      <span class="xs-card-title2">{{ title }}</span>
      <span v-if="subtitle" class="xs-card-sub">{{ subtitle }}</span>
      <span v-if="cost != null" class="xs-card-cost" :class="costClass">
        {{ costText }}
      </span>
    </div>
    <slot />
    <p v-if="desc" class="xs-card-desc">{{ desc }}</p>
    <div v-if="tags && tags.length" class="xs-card-meta">
      <span v-for="t in tags" :key="t" class="xs-pill xs-pill-gold">{{ t }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  subtitle?: string;
  desc?: string;
  cost?: number;
  glyph?: string;
  tags?: string[];
  selected?: boolean;
  disabled?: boolean;
  tone?: string;
  index?: number;
}>();

defineEmits<{
  pick: [];
}>();

const costClass = computed(() => {
  if (props.cost == null) return '';
  if (props.cost === 0) return 'free';
  if (props.cost < 0) return 'gift';
  return '';
});
const costText = computed(() => {
  if (props.cost == null) return '';
  if (props.cost === 0) return '免费';
  if (props.cost < 0) return `+${-props.cost} 点`;
  return `${props.cost} 点`;
});
</script>
