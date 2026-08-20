<template>
  <div class="xs-app">
    <!-- 装饰背景 -->
    <div class="xs-bg" aria-hidden="true">
      <svg class="xs-bg-mountain" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="xsMt" x1="0" y1="0" x2="0" y2="1">
            <stop class="xs-mt-stop-1" offset="0%" />
            <stop class="xs-mt-stop-2" offset="100%" />
          </linearGradient>
          <linearGradient id="xsMt2" x1="0" y1="0" x2="0" y2="1">
            <stop class="xs-mt-stop-3" offset="0%" />
            <stop class="xs-mt-stop-4" offset="100%" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 Q120,80 220,140 T420,120 T620,160 T840,100 T1060,150 T1200,130 L1200,240 L0,240 Z"
          fill="url(#xsMt)"
        />
        <path d="M0,220 Q150,150 280,200 T520,180 T780,210 T1020,170 T1200,200 L1200,240 L0,240 Z" fill="url(#xsMt2)" />
      </svg>
      <svg class="xs-crane xs-crane-1" viewBox="0 0 80 60">
        <path
          class="xs-crane-body"
          d="M5,40 Q15,28 28,30 Q34,22 42,26 Q50,20 56,28 Q62,26 70,32 Q66,38 58,38 Q52,44 44,42 Q38,48 30,44 Q22,48 14,44 Q8,46 5,40 Z"
        />
        <circle cx="62" cy="29" r="1.2" fill="#b13a3a" />
        <path class="xs-crane-tail" d="M64,28 L72,24" stroke-width="1" fill="none" />
      </svg>
      <svg class="xs-crane xs-crane-2" viewBox="0 0 80 60">
        <path
          class="xs-crane-body xs-crane-body--soft"
          d="M5,40 Q15,28 28,30 Q34,22 42,26 Q50,20 56,28 Q62,26 70,32 Q66,38 58,38 Q52,44 44,42 Q38,48 30,44 Q22,48 14,44 Q8,46 5,40 Z"
        />
      </svg>
    </div>

    <!-- 主体 -->
    <div class="xs-scroll">
      <!-- 顶部导航条（封面页隐藏） -->
      <nav v-if="store.stepIndex > 0" class="xs-nav">
        <button
          v-for="(s, i) in steps"
          :key="i"
          type="button"
          class="xs-nav-step"
          :class="{ active: store.stepIndex === i, done: store.stepIndex > i && i > 0 }"
          :disabled="i > store.stepIndex"
          @click="i <= store.stepIndex && store.goto(i)"
        >
          <span class="xs-nav-step-num">{{ i }}</span>
          <span>{{ s.title }}</span>
        </button>
        <span class="xs-nav-spacer" />
        <button
          type="button"
          class="xs-btn xs-btn-ghost xs-theme-btn"
          :title="isDark ? '切换日间' : '切换夜间'"
          @click="toggleTheme"
        >
          {{ isDark ? '☀ 日' : '🌙 夜' }}
        </button>
        <button type="button" class="xs-btn xs-btn-ghost" @click="store.presetOpen = true">封存 / 读取</button>
        <span class="xs-points-badge" :class="{ warn: store.overBudget }">
          <span class="label">余</span>
          <span class="num">{{ store.remainingPoints }}</span>
          <span class="label">/ {{ store.totalPoints }}</span>
        </span>
      </nav>

      <!-- 步骤内容 -->
      <div class="xs-step-wrap">
        <transition name="xs-step" mode="out-in">
          <component :is="currentStepComp" :key="store.stepIndex" />
        </transition>
      </div>
    </div>

    <!-- 预设对话框 -->
    <PresetModal v-if="store.presetOpen" @close="store.presetOpen = false" />

    <!-- Toast -->
    <transition name="xs-step">
      <div v-if="store.toast" class="xs-toast">{{ store.toast }}</div>
    </transition>

    <!-- 主题悬浮切换按钮（封面页也可见） -->
    <button type="button" class="xs-floating-theme" :title="isDark ? '切换日间' : '切换夜间'" @click="toggleTheme">
      {{ isDark ? '☀' : '🌙' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { publishSharedTheme, readSharedTheme, subscribeSharedTheme, type SharedTheme } from '../shared/theme';
import { useStartStore } from './store';
import StepCover from './steps/StepCover.vue';
import StepApiMode from './steps/StepApiMode.vue';
import StepDifficulty from './steps/StepDifficulty.vue';
import StepRoot from './steps/StepRoot.vue';
import StepLocation from './steps/StepLocation.vue';
import StepInventory from './steps/StepInventory.vue';
import StepStory from './steps/StepStory.vue';
import StepConfirm from './steps/StepConfirm.vue';
import PresetModal from './components/PresetModal.vue';

const store = useStartStore();

const steps = [
  { title: '封面', comp: StepCover },
  { title: '配置', comp: StepApiMode },
  { title: '难度', comp: StepDifficulty },
  { title: '灵根 · 体质', comp: StepRoot },
  { title: '出生地', comp: StepLocation },
  { title: '开局故事', comp: StepStory },
  { title: '初始资材', comp: StepInventory },
  { title: '确认', comp: StepConfirm },
];

const currentStepComp = computed(() => steps[store.stepIndex]?.comp ?? StepCover);

const isDark = ref(false);
let stopThemeSync: (() => void) | undefined;
function applyTheme(theme: SharedTheme, publish = false) {
  isDark.value = theme === 'dark';
  const el = document.documentElement;
  if (theme === 'dark') el.setAttribute('data-theme', 'dark');
  else el.removeAttribute('data-theme');
  if (publish) publishSharedTheme(theme);
}
function toggleTheme() {
  applyTheme(isDark.value ? 'light' : 'dark', true);
}
onMounted(() => {
  applyTheme(readSharedTheme('dark'));
  stopThemeSync = subscribeSharedTheme(theme => applyTheme(theme));
});
onBeforeUnmount(() => stopThemeSync?.());
</script>
