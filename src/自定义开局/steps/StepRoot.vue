<template>
  <div>
    <h2 class="xs-step-title">择 · 性别 · 灵根 · 体质</h2>
    <p class="xs-step-subtitle">先定性别与阴阳，再择灵根与体质——三者皆为修行根本，需综合点数与道途权衡。</p>

    <!-- 性别 / 元阳元阴（置于灵根之前） -->
    <h3 class="xs-section-title">性别 · 元阳元阴</h3>
    <div class="xs-yy-builder">
      <div class="xs-yy-row">
        <span class="xs-yy-label">性别</span>
        <button
          type="button"
          class="xs-yy-chip"
          :class="{ active: store.selection.性别 === '男' }"
          @click="store.setGender('男')"
        >
          男
        </button>
        <button
          type="button"
          class="xs-yy-chip"
          :class="{ active: store.selection.性别 === '女' }"
          @click="store.setGender('女')"
        >
          女
        </button>
        <button
          type="button"
          class="xs-yy-chip"
          :class="{ active: store.selection.性别 === '其他' }"
          @click="store.setGender('其他')"
        >
          其他
        </button>
      </div>
      <div v-if="store.selection.性别 !== '其他'" class="xs-yy-row">
        <span class="xs-yy-label">{{ store.selection.性别 === '男' ? '元阳' : '元阴' }}</span>
        <label class="xs-yy-toggle">
          <input
            type="checkbox"
            :checked="store.selection.元阳元阴"
            @change="store.setVirgin(($event.target as HTMLInputElement).checked)"
          />
          <span>{{ store.selection.性别 === '男' ? '元阳尚存' : '元阴尚存' }}（处子之身）</span>
        </label>
        <span class="xs-yy-hint">{{ virginHint }}</span>
      </div>
      <div v-else class="xs-yy-row">
        <span class="xs-yy-label">元阴元阳</span>
        <span class="xs-yy-hint">其他性别无元阳/元阴之分，二者皆判定为「无」。</span>
      </div>
    </div>

    <!-- 灵根 -->
    <h3 class="xs-section-title" style="margin-top: 22px">灵根</h3>
    <div class="xs-root-builder">
      <!-- 属性多选 -->
      <div class="xs-root-pickers">
        <div class="xs-root-picker-row">
          <span class="xs-root-picker-label">五行</span>
          <button
            v-for="el in ELEMENT_NORMAL"
            :key="el"
            type="button"
            class="xs-element-chip"
            :class="{ active: isChosen(el), disabled: !canToggle(el) }"
            :style="chipStyle(el)"
            :disabled="!canToggle(el)"
            @click="store.toggleRootElement(el)"
          >
            <span class="xs-element-chip-glyph">{{ glyph(el) }}</span>
            <span class="xs-element-chip-name">{{ el }}</span>
          </button>
        </div>
        <div class="xs-root-picker-row">
          <span class="xs-root-picker-label">阴阳</span>
          <button
            v-for="el in ELEMENT_POLAR"
            :key="el"
            type="button"
            class="xs-element-chip"
            :class="{ active: isChosen(el), disabled: !canToggle(el) }"
            :style="chipStyle(el)"
            :disabled="!canToggle(el)"
            @click="store.toggleRootElement(el)"
          >
            <span class="xs-element-chip-glyph">{{ glyph(el) }}</span>
            <span class="xs-element-chip-name">{{ el }}</span>
          </button>
          <span class="xs-root-picker-hint">阴/阳 视同五行属性，与五行可任意组合；最多 5 个属性。</span>
        </div>
        <div class="xs-root-picker-row">
          <span class="xs-root-picker-label">特殊</span>
          <button
            v-for="el in ELEMENT_EXCLUSIVE"
            :key="el"
            type="button"
            class="xs-element-chip"
            :class="{ active: isChosen(el), disabled: !canToggle(el), exclusive: true }"
            :style="chipStyle(el)"
            :disabled="!canToggle(el)"
            @click="store.toggleRootElement(el)"
          >
            <span class="xs-element-chip-glyph">{{ glyph(el) }}</span>
            <span class="xs-element-chip-name">{{ el === '混沌' ? '混沌' : '无灵根' }}</span>
          </button>
          <span class="xs-root-picker-hint">混沌 / 无灵根 与其它属性互斥。</span>
        </div>
      </div>

      <!-- 变异编辑器 -->
      <div v-if="canMutateNow || isMutationActive" class="xs-mutation-panel" :class="{ on: isMutationActive }">
        <label class="xs-mutation-toggle">
          <input
            type="checkbox"
            :checked="isMutationActive"
            :disabled="!canMutateNow"
            @change="store.setMutation(($event.target as HTMLInputElement).checked)"
          />
          <span>设为变异灵根</span>
          <span class="xs-mutation-hint">仅单灵根可发生变异；耗费 +2 点。</span>
        </label>

        <div v-if="isMutationActive" class="xs-mutation-body">
          <div class="xs-mutation-presets">
            <button
              v-for="m in mutationOptions"
              :key="m.id"
              type="button"
              class="xs-mutation-chip"
              :class="{ active: choice.mutationId === m.id }"
              :title="m.desc"
              @click="store.setMutationId(m.id)"
            >
              {{ m.name }}
            </button>
            <button
              type="button"
              class="xs-mutation-chip"
              :class="{ active: choice.mutationId === null }"
              @click="store.setMutationId(null)"
            >
              自定义
            </button>
          </div>
          <div v-if="choice.mutationId === null" class="xs-mutation-custom">
            <input
              type="text"
              :value="choice.customName"
              maxlength="10"
              placeholder="请为这条变异灵根命名（如：苍穹剑灵根）"
              @input="store.setCustomMutationName(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>

      <!-- 实时预览卡 -->
      <div class="xs-root-preview" :class="{ empty: !store.rootChosen }">
        <div class="xs-root-preview-head">
          <div class="xs-root-preview-title">
            <span class="xs-root-preview-name">{{ rootName }}</span>
            <span class="xs-root-preview-tier">{{ rootTier }}</span>
          </div>
          <div class="xs-root-preview-cost" :class="costClass">{{ costText }}</div>
        </div>
        <div v-if="effectiveElements.length" class="xs-root-preview-elements">
          <span v-for="el in effectiveElements" :key="el" class="xs-element" :style="{ '--el': elColor(el) }">
            {{ glyph(el) }}
          </span>
        </div>
        <p class="xs-root-preview-desc">{{ rootDesc }}</p>
      </div>
    </div>

    <!-- 体质 -->
    <h3 class="xs-section-title" style="margin-top: 22px">体质</h3>
    <div class="xs-root-builder">
      <!-- 预设品阶 / 自创体质同级入口 -->
      <div class="xs-root-pickers">
        <div class="xs-root-picker-row">
          <span class="xs-root-picker-label">选择</span>
          <button
            v-for="t in PHYSIQUE_TIERS"
            :key="t"
            type="button"
            class="xs-tier-chip"
            :class="{ active: !isCustomPhysique && physique.tier === t, disabled: !canAffordTier(t) }"
            :disabled="!canAffordTier(t)"
            @click="selectPresetTier(t)"
          >
            <span class="xs-tier-chip-name">{{ t }}</span>
            <span class="xs-tier-chip-meta">
              S {{ PHYSIQUE_TIER_S[t] }} · {{ PHYSIQUE_TIER_COST[t] === 0 ? '免费' : PHYSIQUE_TIER_COST[t] + ' 点' }}
            </span>
          </button>
          <button
            type="button"
            class="xs-tier-chip xs-tier-chip-custom"
            :class="{ active: isCustomPhysique }"
            @click="openCustomPhysique"
          >
            <span class="xs-tier-chip-name">自创体质</span>
            <span class="xs-tier-chip-meta">自选品阶 · 名称 · 效果</span>
          </button>
        </div>
        <p v-if="!isCustomPhysique" class="xs-tier-intro">{{ PHYSIQUE_TIER_INTRO[physique.tier] }}</p>
      </div>

      <!-- 预设体质：分类标签 + 分页卡片 -->
      <div v-if="!isCustomPhysique" class="xs-physique-presets">
        <div class="xs-physique-category-bar" aria-label="体质分类">
          <button
            type="button"
            class="xs-category-chip"
            :class="{ active: selectedCategory === null }"
            @click="selectCategory(null)"
          >
            全部 <span>{{ tierPresetCount }}</span>
          </button>
          <button
            v-for="category in tierCategories"
            :key="category"
            type="button"
            class="xs-category-chip"
            :class="{ active: selectedCategory === category }"
            @click="selectCategory(category)"
          >
            {{ category }} <span>{{ categoryCount(category) }}</span>
          </button>
        </div>

        <div class="xs-physique-grid">
          <button
            v-for="p in pagedPresets"
            :key="p.id"
            type="button"
            class="xs-physique-card"
            :class="{ active: physique.presetId === p.id }"
            @click="store.selectPhysiquePreset(p.id)"
          >
            <div class="xs-physique-card-head">
              <span class="xs-physique-card-name">{{ p.name }}</span>
            </div>
            <div class="xs-attr-row">
              <div class="xs-attr-cell">
                <span class="xs-attr-cell-label">悟</span>
                <span class="xs-attr-cell-value">{{ p.悟性 }}</span>
              </div>
              <div class="xs-attr-cell">
                <span class="xs-attr-cell-label">骨</span>
                <span class="xs-attr-cell-value">{{ p.根骨 }}</span>
              </div>
              <div class="xs-attr-cell">
                <span class="xs-attr-cell-label">感</span>
                <span class="xs-attr-cell-value">{{ p.气感 }}</span>
              </div>
            </div>
            <p v-for="(effect, index) in p.效果 || []" :key="`${p.id}-effect-${index}`" class="xs-physique-card-effect">
              <strong>{{ effect.name }}</strong>
              <span>{{ effect.value }}</span>
            </p>
            <p v-if="p.desc" class="xs-physique-card-desc">{{ p.desc }}</p>
          </button>
        </div>

        <nav v-if="pageCount > 1" class="xs-physique-pager" aria-label="体质分页">
          <button type="button" :disabled="currentPage <= 1" @click="currentPage--">‹ 上一页</button>
          <span>第 {{ currentPage }} / {{ pageCount }} 页</span>
          <button type="button" :disabled="currentPage >= pageCount" @click="currentPage++">下一页 ›</button>
        </nav>
      </div>

      <!-- 自创体质编辑器：先在页面内选择品阶 -->
      <div v-else class="xs-physique-editor">
        <div class="xs-custom-tier-picker">
          <span class="xs-root-picker-label">品阶</span>
          <button
            v-for="t in PHYSIQUE_TIERS"
            :key="`custom-${t}`"
            type="button"
            class="xs-category-chip"
            :class="{ active: physique.tier === t, disabled: !canAffordTier(t) }"
            :disabled="!canAffordTier(t)"
            @click="store.selectPhysiqueTier(t)"
          >
            {{ t }} · {{ PHYSIQUE_TIER_COST[t] === 0 ? '免费' : PHYSIQUE_TIER_COST[t] + '点' }}
          </button>
        </div>
        <p class="xs-custom-tier-intro">
          {{ PHYSIQUE_TIER_INTRO[physique.tier] }} 按 S = {{ PHYSIQUE_TIER_S[physique.tier] }} 分配三维。
        </p>
        <div class="xs-physique-edit-row">
          <label>名号</label>
          <input
            type="text"
            :value="physique.customName"
            maxlength="30"
            placeholder="为这具体魄拟一个名字（如：玄霜玲珑体）"
            @input="store.setPhysiqueCustomName(($event.target as HTMLInputElement).value)"
          />
        </div>
        <div v-if="physique.tier !== '凡体'" class="xs-physique-edit-effects">
          <div
            v-for="(eff, idx) in physique.customEffects"
            :key="idx"
            class="xs-physique-edit-row xs-physique-edit-effect"
          >
            <label>{{ idx === 0 ? '效果' : '' }}</label>
            <input
              type="text"
              class="xs-effect-name-input"
              :value="eff.name"
              maxlength="24"
              placeholder="效果名"
              @input="onEffectNameInput(idx, $event)"
            />
            <input
              type="text"
              class="xs-effect-desc-input"
              :value="eff.value"
              maxlength="80"
              placeholder="效果描述"
              @input="onEffectValueInput(idx, $event)"
            />
            <button
              type="button"
              class="xs-effect-remove-btn"
              :title="physique.customEffects.length === 1 ? '至少保留 1 条' : '删除此条效果'"
              :disabled="physique.customEffects.length === 1"
              @click="store.removePhysiqueCustomEffect(idx)"
            >
              ×
            </button>
          </div>
          <div class="xs-physique-edit-row xs-physique-edit-effect-add">
            <label></label>
            <button type="button" class="xs-effect-add-btn" @click="store.addPhysiqueCustomEffect">+ 添加效果</button>
          </div>
        </div>
        <div class="xs-physique-edit-row xs-physique-edit-stats">
          <label>三维</label>
          <div class="xs-stat-input-group">
            <span>悟性</span>
            <input type="number" min="1" :value="physique.custom悟性" @input="onStatInput('悟性', $event)" />
          </div>
          <div class="xs-stat-input-group">
            <span>根骨</span>
            <input type="number" min="1" :value="physique.custom根骨" @input="onStatInput('根骨', $event)" />
          </div>
          <div class="xs-stat-input-group">
            <span>气感</span>
            <input type="number" min="1" :value="physique.custom气感" @input="onStatInput('气感', $event)" />
          </div>
          <span class="xs-stat-sum" :class="{ ok: statSumOk, bad: !statSumOk }">
            合 {{ statSum }} / {{ targetS }}
          </span>
          <button
            type="button"
            class="xs-btn xs-btn-ghost xs-stat-balance-btn"
            :disabled="statSumOk"
            @click="store.autoBalancePhysique('气感')"
          >
            余补气感
          </button>
        </div>
      </div>
    </div>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="!store.rootChosen || !store.physiqueChosen || store.overBudget"
        @click="store.next"
      >
        继续 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  ELEMENT_EXCLUSIVE,
  ELEMENT_NORMAL,
  ELEMENT_POLAR,
  PHYSIQUE_TIERS,
  PHYSIQUE_TIER_COST,
  PHYSIQUE_TIER_INTRO,
  PHYSIQUE_TIER_S,
  canMutate,
  canToggleElement,
  customPhysiqueSum,
  elementGlyph,
  mutationsByElement,
  physiqueCategoriesByTier,
  physiquesByTier,
  physiquesByTierAndCategory,
  rootDescription,
  rootDisplayName,
  rootTierLabel,
} from '../config';
import type { PhysiqueCategory, PhysiqueTier } from '../types';
import { useStartStore } from '../store';

const store = useStartStore();
const choice = computed(() => store.selection.root);
const physique = computed(() => store.selection.physique);

const isMutationActive = computed(() => choice.value.mutation);
const canMutateNow = computed(() => canMutate(choice.value));

const mutationOptions = computed(() => {
  if (!isMutationActive.value || choice.value.elements.length !== 1) return [];
  return mutationsByElement(choice.value.elements[0]);
});

const rootName = computed(() => rootDisplayName(choice.value));
const rootTier = computed(() => rootTierLabel(choice.value));
const rootDesc = computed(() => rootDescription(choice.value));

const effectiveElements = computed(() => choice.value.elements.slice());

const costText = computed(() => (store.rootCost === 0 ? '免费' : `${store.rootCost} 点`));
const costClass = computed(() => (store.rootCost === 0 ? 'free' : ''));

function isChosen(el: string): boolean {
  return choice.value.elements.includes(el);
}
function canToggle(el: string): boolean {
  return canToggleElement(choice.value, el);
}
function glyph(el: string): string {
  return elementGlyph(el);
}

function elColor(el: string): string {
  const map: Record<string, string> = {
    金: 'var(--xs-el-jin)',
    木: 'var(--xs-el-mu)',
    水: 'var(--xs-el-shui)',
    火: 'var(--xs-el-huo)',
    土: 'var(--xs-el-tu)',
    阴: 'var(--xs-el-yin)',
    阳: 'var(--xs-el-yang)',
    混沌: 'var(--xs-el-hundun)',
    无: 'var(--xs-ink-mute)',
  };
  return map[el] || 'var(--xs-ink-mute)';
}
function chipStyle(el: string) {
  return { '--el': elColor(el) } as Record<string, string>;
}

// —— 体质 ——
const PHYSIQUE_PAGE_SIZE = 9;
const isCustomPhysique = computed(() => physique.value.presetId === null);
const selectedCategory = ref<PhysiqueCategory | null>(null);
const currentPage = ref(1);

const tierPresets = computed(() => physiquesByTier(physique.value.tier));
const tierPresetCount = computed(() => tierPresets.value.length);
const tierCategories = computed(() => physiqueCategoriesByTier(physique.value.tier));
const filteredPresets = computed(() => physiquesByTierAndCategory(physique.value.tier, selectedCategory.value));
const pageCount = computed(() => Math.max(1, Math.ceil(filteredPresets.value.length / PHYSIQUE_PAGE_SIZE)));
const pagedPresets = computed(() => {
  const start = (currentPage.value - 1) * PHYSIQUE_PAGE_SIZE;
  return filteredPresets.value.slice(start, start + PHYSIQUE_PAGE_SIZE);
});
watch(
  () => physique.value.tier,
  () => {
    selectedCategory.value = null;
    currentPage.value = 1;
  },
);
watch(selectedCategory, () => {
  currentPage.value = 1;
});
watch(pageCount, total => {
  if (currentPage.value > total) currentPage.value = total;
});
watch(
  () => physique.value.presetId,
  presetId => {
    if (!presetId || selectedCategory.value !== null) return;
    const index = filteredPresets.value.findIndex(preset => preset.id === presetId);
    if (index >= 0) currentPage.value = Math.floor(index / PHYSIQUE_PAGE_SIZE) + 1;
  },
  { immediate: true },
);

function selectPresetTier(tier: PhysiqueTier) {
  if (!canAffordTier(tier)) return;
  if (physique.value.tier !== tier) store.selectPhysiqueTier(tier);
  const firstPreset = physiquesByTier(tier)[0];
  if (firstPreset) store.selectPhysiquePreset(firstPreset.id);
  selectedCategory.value = null;
  currentPage.value = 1;
}

function openCustomPhysique() {
  store.selectPhysiquePreset(null);
}

function selectCategory(category: PhysiqueCategory | null) {
  selectedCategory.value = category;
}

function categoryCount(category: PhysiqueCategory): number {
  return tierPresets.value.filter(preset => preset.category === category).length;
}

const targetS = computed(() => PHYSIQUE_TIER_S[physique.value.tier]);
const statSum = computed(() => customPhysiqueSum(physique.value));
const statSumOk = computed(() => statSum.value === targetS.value);

/** 切到该等级是否在预算内（考虑当前体质退还） */
function canAffordTier(tier: PhysiqueTier): boolean {
  if (physique.value.tier === tier) return true;
  const delta = PHYSIQUE_TIER_COST[tier] - store.physiqueCost;
  return delta <= store.remainingPoints;
}

function onEffectNameInput(idx: number, e: Event) {
  const v = (e.target as HTMLInputElement).value;
  const current = physique.value.customEffects[idx];
  if (!current) return;
  store.setPhysiqueCustomEffectAt(idx, v, current.value);
}
function onEffectValueInput(idx: number, e: Event) {
  const v = (e.target as HTMLInputElement).value;
  const current = physique.value.customEffects[idx];
  if (!current) return;
  store.setPhysiqueCustomEffectAt(idx, current.name, v);
}
function onStatInput(key: '悟性' | '根骨' | '气感', e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  store.setPhysiqueCustomStat(key, v);
}

const virginHint = computed(() => {
  const g = store.selection.性别;
  if (g === '其他') return '不涉元阳/元阴双修法门';
  return store.selection.元阳元阴
    ? g === '男'
      ? '元阳未泄，可凝乾元真气'
      : '元阴未损，可炼坤德神髓'
    : g === '男'
      ? '元阳已泄，需别图他途'
      : '元阴已损，可改习他法';
});
</script>

<style scoped>
.xs-section-title {
  font-family: var(--xs-font-display);
  font-size: 16px;
  letter-spacing: 4px;
  color: var(--xs-ink);
  margin-bottom: 10px;
  border-left: 3px solid var(--xs-cinnabar);
  padding-left: 8px;
}

.xs-root-builder {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 10px;
  background: var(--xs-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  margin-bottom: 18px;
}

.xs-root-pickers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xs-root-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.xs-root-picker-label {
  flex: 0 0 auto;
  width: 44px;
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 3px;
  color: var(--xs-ink-mute);
}

.xs-root-picker-hint {
  font-size: 11.5px;
  color: var(--xs-ink-mute);
  letter-spacing: 0.5px;
  margin-left: 4px;
}

.xs-element-chip {
  --el: var(--xs-ink);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 4px;
  border-radius: 22px;
  border: 1px solid var(--xs-line);
  background: var(--xs-paper-warm);
  color: var(--xs-ink);
  font-size: 13px;
  letter-spacing: 1px;
  transition: all 0.18s ease;
}
.xs-element-chip:hover:not(:disabled):not(.active) {
  border-color: var(--el);
  color: var(--el);
}
.xs-element-chip.active {
  border-color: var(--el);
  background: linear-gradient(180deg, color-mix(in srgb, var(--el) 12%, transparent), var(--xs-paper-warm));
  color: var(--xs-ink);
  box-shadow:
    0 0 0 1px var(--el) inset,
    0 6px 18px -10px var(--el);
}
.xs-element-chip:disabled,
.xs-element-chip.disabled {
  opacity: 0.32;
  cursor: not-allowed;
  filter: grayscale(0.4);
}
.xs-element-chip.exclusive {
  border-style: dashed;
}

.xs-element-chip-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-family: var(--xs-font-display);
  font-size: 11px;
  color: #fff;
  background: var(--el);
  box-shadow:
    0 0 0 2px var(--xs-element-halo),
    0 0 0 3px var(--el);
}
.xs-element-chip-name {
  font-family: var(--xs-font-display);
  letter-spacing: 2px;
}

/* —— 变异编辑器 —— */
.xs-mutation-panel {
  border: 1px dashed var(--xs-line);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--xs-tint-gold-soft);
}
.xs-mutation-panel.on {
  border-color: var(--xs-cinnabar);
  background: var(--xs-tint-cinnabar-soft);
}
.xs-mutation-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--xs-ink);
  cursor: pointer;
}
.xs-mutation-toggle input {
  width: auto;
  margin: 0;
  accent-color: var(--xs-cinnabar);
}
.xs-mutation-hint {
  font-size: 11.5px;
  color: var(--xs-ink-mute);
  letter-spacing: 0.5px;
  margin-left: 6px;
}
.xs-mutation-body {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.xs-mutation-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.xs-mutation-chip {
  padding: 4px 12px;
  border-radius: 14px;
  border: 1px solid var(--xs-line);
  background: var(--xs-paper-warm);
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 2px;
  color: var(--xs-ink);
  transition: all 0.18s ease;
}
.xs-mutation-chip:hover:not(.active) {
  border-color: var(--xs-cinnabar);
  color: var(--xs-cinnabar);
}
.xs-mutation-chip.active {
  background: var(--xs-cinnabar);
  border-color: var(--xs-cinnabar-deep);
  color: #fff;
  box-shadow: 0 4px 12px -4px var(--xs-cinnabar-glow);
}
.xs-mutation-custom input {
  width: 100%;
  font-family: var(--xs-font-title);
  font-size: 16px;
  letter-spacing: 3px;
  background: var(--xs-paper-warm);
  border: 1px solid var(--xs-line-gold);
  padding: 6px 10px;
}
.xs-mutation-custom input:focus {
  border-color: var(--xs-cinnabar);
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
  outline: none;
}

/* —— 预览卡 —— */
.xs-root-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--xs-cinnabar);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--xs-tint-cinnabar-faint), var(--xs-glass-strong));
  box-shadow: 0 0 0 1px var(--xs-tint-cinnabar-mid) inset;
}
.xs-root-preview.empty {
  border-color: var(--xs-line);
  background: var(--xs-paper-warm);
  box-shadow: none;
}
.xs-root-preview-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.xs-root-preview-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1 1 auto;
}
.xs-root-preview-name {
  font-family: var(--xs-font-title);
  font-size: 22px;
  letter-spacing: 3px;
  color: var(--xs-ink);
}
.xs-root-preview-tier {
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
}
.xs-root-preview-cost {
  font-family: var(--xs-font-title);
  font-size: 16px;
  color: var(--xs-cinnabar);
  letter-spacing: 1px;
}
.xs-root-preview-cost.free {
  color: var(--xs-ink-mute);
}
.xs-root-preview-elements {
  display: flex;
  gap: 6px;
}
.xs-root-preview-desc {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--xs-ink-soft);
}

/* —— 体质等级 chip —— */
.xs-tier-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 6px 14px;
  border-radius: 12px;
  border: 1px solid var(--xs-line);
  background: var(--xs-paper-warm);
  color: var(--xs-ink);
  transition: all 0.18s ease;
}
.xs-tier-chip:hover:not(:disabled):not(.active) {
  border-color: var(--xs-cinnabar);
  color: var(--xs-cinnabar);
}
.xs-tier-chip.active {
  background: var(--xs-cinnabar);
  border-color: var(--xs-cinnabar-deep);
  color: #fff;
  box-shadow: 0 4px 12px -4px var(--xs-cinnabar-glow);
}
.xs-tier-chip:disabled,
.xs-tier-chip.disabled {
  opacity: 0.32;
  cursor: not-allowed;
  filter: grayscale(0.4);
}
.xs-tier-chip-name {
  font-family: var(--xs-font-display);
  font-size: 13.5px;
  letter-spacing: 3px;
}
.xs-tier-chip-meta {
  font-size: 10.5px;
  letter-spacing: 1px;
  opacity: 0.85;
}
.xs-tier-chip-custom {
  border-style: dashed;
  background: var(--xs-tint-gold-soft);
}
.xs-tier-intro {
  font-size: 12px;
  color: var(--xs-ink-mute);
  letter-spacing: 1px;
  margin-top: 2px;
  padding-left: 52px;
}

/* —— 体质分类与分页 —— */
.xs-physique-presets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.xs-physique-category-bar,
.xs-custom-tier-picker {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.xs-category-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border: 1px solid var(--xs-line);
  border-radius: 16px;
  background: var(--xs-paper-warm);
  color: var(--xs-ink-soft);
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 1.5px;
  transition: all 0.18s ease;
}
.xs-category-chip span {
  min-width: 17px;
  padding: 0 5px;
  border-radius: 10px;
  background: var(--xs-tint-gold-soft);
  color: var(--xs-ink-mute);
  font-family: var(--xs-font-body);
  font-size: 10px;
  letter-spacing: 0;
  text-align: center;
}
.xs-category-chip:hover:not(:disabled):not(.active) {
  border-color: var(--xs-gold);
  color: var(--xs-ink);
}
.xs-category-chip.active {
  border-color: var(--xs-cinnabar);
  background: var(--xs-tint-cinnabar-soft);
  color: var(--xs-cinnabar);
  box-shadow: 0 0 0 1px var(--xs-tint-cinnabar-mid) inset;
}
.xs-category-chip.active span {
  background: var(--xs-cinnabar);
  color: #fff;
}
.xs-category-chip:disabled,
.xs-category-chip.disabled {
  opacity: 0.32;
  cursor: not-allowed;
}
.xs-physique-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding-top: 2px;
  color: var(--xs-ink-mute);
  font-size: 12px;
  letter-spacing: 1px;
}
.xs-physique-pager button {
  min-width: 76px;
  padding: 5px 12px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 16px;
  background: var(--xs-paper-warm);
  color: var(--xs-ink-soft);
  transition: all 0.18s ease;
}
.xs-physique-pager button:hover:not(:disabled) {
  border-color: var(--xs-cinnabar);
  color: var(--xs-cinnabar);
}
.xs-physique-pager button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.xs-custom-tier-intro {
  margin: -2px 0 2px 52px;
  color: var(--xs-ink-mute);
  font-size: 12px;
  line-height: 1.6;
  letter-spacing: 0.5px;
}

/* —— 体质卡片网格 —— */
.xs-physique-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 600px) {
  .xs-physique-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 880px) {
  .xs-physique-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.xs-physique-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 10px;
  background: var(--xs-glass);
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
}
.xs-physique-card:hover:not(.active) {
  border-color: var(--xs-gold);
  transform: translateY(-2px);
  box-shadow: var(--xs-shadow);
}
.xs-physique-card.active {
  border-color: var(--xs-cinnabar);
  background: linear-gradient(180deg, var(--xs-tint-cinnabar-soft), var(--xs-glass-strong));
  box-shadow:
    0 0 0 1px var(--xs-cinnabar) inset,
    0 8px 24px -10px var(--xs-cinnabar-glow);
}
.xs-physique-card-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.xs-physique-card-name {
  font-family: var(--xs-font-display);
  font-size: 15px;
  letter-spacing: 3px;
  color: var(--xs-ink);
}
.xs-physique-card-effect {
  font-size: 12px;
  line-height: 1.65;
  color: var(--xs-ink-soft);
  letter-spacing: 0.5px;
}
.xs-physique-card-effect strong {
  font-family: var(--xs-font-display);
  margin-right: 4px;
  color: var(--xs-cinnabar);
  letter-spacing: 2px;
}
.xs-physique-card-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--xs-ink-soft);
}

/* —— 自拟体质编辑器 —— */
.xs-physique-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px dashed var(--xs-cinnabar);
  border-radius: 8px;
  background: var(--xs-tint-cinnabar-faint);
}
.xs-physique-edit-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.xs-physique-edit-row label {
  flex: 0 0 auto;
  width: 44px;
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 3px;
  color: var(--xs-ink-mute);
}
.xs-physique-edit-row input[type='text'] {
  flex: 1 1 160px;
  font-family: var(--xs-font-display);
  font-size: 14px;
  letter-spacing: 1.5px;
  background: var(--xs-paper-warm);
  border: 1px solid var(--xs-line-gold);
  padding: 6px 10px;
}
.xs-physique-edit-row input:focus {
  border-color: var(--xs-cinnabar);
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
  outline: none;
}
.xs-physique-edit-effect input.xs-effect-name-input {
  flex: 1 1 0;
  min-width: 120px;
}
.xs-physique-edit-effect input.xs-effect-desc-input {
  flex: 1.4 1 0;
  min-width: 160px;
}

.xs-physique-edit-effects {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.xs-physique-edit-effect-add {
  margin-top: 2px;
}
.xs-effect-remove-btn {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--xs-line);
  background: var(--xs-paper-warm);
  color: var(--xs-ink-mute);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.18s ease;
}
.xs-effect-remove-btn:hover:not(:disabled) {
  border-color: var(--xs-cinnabar);
  background: var(--xs-tint-cinnabar-soft);
  color: var(--xs-cinnabar);
}
.xs-effect-remove-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.xs-effect-add-btn {
  padding: 4px 14px;
  border-radius: 14px;
  border: 1px dashed var(--xs-cinnabar);
  background: var(--xs-tint-cinnabar-faint);
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 2px;
  color: var(--xs-cinnabar);
  cursor: pointer;
  transition: all 0.18s ease;
}
.xs-effect-add-btn:hover {
  background: var(--xs-cinnabar);
  color: #fff;
  border-style: solid;
}

.xs-stat-input-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.xs-stat-input-group span {
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
}
.xs-stat-input-group input[type='number'] {
  width: 60px;
  font-family: var(--xs-font-title);
  font-size: 15px;
  text-align: center;
  background: var(--xs-paper-warm);
  border: 1px solid var(--xs-line-gold);
  padding: 4px 6px;
  border-radius: 4px;
}
.xs-stat-input-group input[type='number']:focus {
  border-color: var(--xs-cinnabar);
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
  outline: none;
}
.xs-stat-sum {
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 2px;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid var(--xs-line);
}
.xs-stat-sum.ok {
  color: var(--xs-jade-deep);
  border-color: var(--xs-jade);
  background: var(--xs-tint-jade-soft);
}
.xs-stat-sum.bad {
  color: var(--xs-cinnabar);
  border-color: var(--xs-cinnabar);
  background: var(--xs-tint-cinnabar-soft);
}
.xs-stat-balance-btn {
  padding: 4px 12px;
  font-size: 11.5px;
  letter-spacing: 2px;
}

/* —— 性别 / 元阳元阴 —— */
.xs-yy-builder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 10px;
  background: var(--xs-glass);
  margin-bottom: 18px;
}
.xs-yy-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.xs-yy-label {
  flex: 0 0 auto;
  width: 56px;
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 3px;
  color: var(--xs-ink-mute);
}
.xs-yy-chip {
  padding: 4px 18px;
  border-radius: 14px;
  border: 1px solid var(--xs-line);
  background: var(--xs-paper-warm);
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 3px;
  color: var(--xs-ink);
  transition: all 0.18s ease;
}
.xs-yy-chip:hover:not(.active) {
  border-color: var(--xs-cinnabar);
  color: var(--xs-cinnabar);
}
.xs-yy-chip.active {
  background: var(--xs-cinnabar);
  border-color: var(--xs-cinnabar-deep);
  color: #fff;
  box-shadow: 0 4px 12px -4px var(--xs-cinnabar-glow);
}
.xs-yy-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--xs-ink);
  cursor: pointer;
}
.xs-yy-toggle input {
  width: auto;
  margin: 0;
  accent-color: var(--xs-cinnabar);
}
.xs-yy-hint {
  font-size: 11.5px;
  letter-spacing: 0.5px;
  color: var(--xs-ink-mute);
  margin-left: 4px;
}
</style>
