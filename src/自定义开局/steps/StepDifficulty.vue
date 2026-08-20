<template>
  <div>
    <h2 class="xs-step-title">择 · 难度</h2>
    <p class="xs-step-subtitle">难度决定可分配的初始点数；点数将用于灵根、体质与初始资材的购置（出生地不耗费点数）。</p>

    <div class="xs-card-grid cols-3">
      <OptionCard
        v-for="(d, i) in difficulties"
        :key="d.id"
        :title="d.name"
        :subtitle="d.subtitle"
        :desc="d.desc"
        :glyph="d.glyph"
        :selected="store.selection.difficultyId === d.id"
        :tone="d.tone"
        :index="i"
        @pick="store.selectDifficulty(d.id)"
      >
        <div class="xs-card-points">
          {{ d.points }}<small>点</small>
        </div>
      </OptionCard>
    </div>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="!store.selection.difficultyId"
        @click="store.next"
      >
        继续 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { difficulties } from '../config';
import { useStartStore } from '../store';
import OptionCard from '../components/OptionCard.vue';

const store = useStartStore();
</script>
