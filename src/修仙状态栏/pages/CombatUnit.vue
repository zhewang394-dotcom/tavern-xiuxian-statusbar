<template>
  <article
    class="xy-item xy-unit"
    :class="[
      'xy-q-bg-' + (unit.品质 || '凡'),
      {
        'xy-unit-active': unit.使用中,
        'xy-has-trash': deletable,
        'xy-mobile-card-open': isMobileCardOpen('unit', name),
      },
    ]"
  >
    <button v-if="deletable" type="button" class="xy-trash" title="删除" @click.stop="$emit('delete')">
      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
        <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
      </svg>
    </button>
    <div
      class="xy-item-head xy-mobile-card-head"
      :aria-expanded="state.layoutMode === 'mobile' ? isMobileCardOpen('unit', name) : undefined"
      @click="toggleMobileCard('unit', name)"
    >
      <span class="xy-item-name">{{ name }}</span>
      <button
        v-if="!compact"
        class="xy-toggle"
        :class="{ on: unit.使用中 }"
        @click.stop="$emit('toggle', !unit.使用中)"
      >
        {{ unit.使用中 ? '在身' : '入囊' }}
      </button>
      <span v-else-if="unit.使用中" class="xy-unit-badge">在身</span>
      <span class="xy-mobile-card-caret" aria-hidden="true">⌄</span>
    </div>

    <div
      v-show="state.layoutMode === 'pc' || state.editMode || isMobileCardOpen('unit', name)"
      class="xy-mobile-card-body"
    >
      <div class="xy-item-meta">
        <span :class="['xy-quality', 'xy-q-' + (unit.品质 || '凡')]">{{ unit.品质 || '凡' }}</span>
        <span v-if="unit.境界" class="xy-pill xy-pill-soft">{{ unit.境界 }}</span>
        <span v-if="unit.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(unit.五行) }">
          {{ unit.五行 === '未知' ? '未' : unit.五行 }}
        </span>
        <span v-for="t in unit.标签 || []" :key="t" class="xy-tag">{{ t }}</span>
      </div>

      <div class="xy-unit-bars">
        <div class="xy-unit-bar">
          <span class="xy-unit-bar-label">气血</span>
          <span class="xy-unit-bar-track">
            <span class="xy-unit-bar-fill blood" :style="{ width: hpPct + '%' }" />
          </span>
          <span class="xy-unit-bar-num">
            <template v-if="unit.资源池?.气血">
              <EditableValue
                v-model.number="unit.资源池.气血.现值"
                type="number"
                label="气血现值"
                :min="0"
              />/<EditableValue v-model.number="unit.资源池.气血.上限" type="number" label="气血上限" :min="1" />
            </template>
            <template v-else>{{ hp.现值 }}/{{ hp.上限 }}</template>
          </span>
        </div>
        <div class="xy-unit-bar">
          <span class="xy-unit-bar-label">灵气</span>
          <span class="xy-unit-bar-track">
            <span class="xy-unit-bar-fill spirit" :style="{ width: mpPct + '%' }" />
          </span>
          <span class="xy-unit-bar-num">
            <template v-if="unit.资源池?.灵气">
              <EditableValue
                v-model.number="unit.资源池.灵气.现值"
                type="number"
                label="灵气现值"
                :min="0"
              />/<EditableValue v-model.number="unit.资源池.灵气.上限" type="number" label="灵气上限" :min="0" />
            </template>
            <template v-else>{{ mp.现值 }}/{{ mp.上限 }}</template>
          </span>
        </div>
      </div>

      <div class="xy-unit-stats">
        <span class="xy-eq-stat xy-stat-def"
          >防 <EditableValue v-model.number="unit.防御力" type="number" label="防御力" :min="0" :format="v => v ?? 0"
        /></span>
        <span class="xy-eq-stat">
          遁
          <EditableValue
            v-if="unit.资源池"
            v-model.number="unit.资源池.遁速"
            type="number"
            label="遁速"
            :min="0"
            :format="v => v ?? 0"
          />
          <template v-else>{{ unit.资源池?.遁速 ?? 0 }}</template>
        </span>
      </div>

      <div v-if="unit.描述 || state.editMode" class="xy-item-desc">
        <EditableValue v-model="unit.描述" label="描述" multiline />
      </div>

      <div v-if="!isEmpty(unit.技能)" class="xy-skill-list">
        <div v-for="(sv, sn) in unit.技能" :key="sn" class="xy-skill-line">
          <span class="xy-skill-line-name">{{ sn }}</span>
          <span class="xy-skill-line-atk"
            >攻 <EditableValue v-model.number="sv.攻击力" type="number" label="攻击力" :min="0" :format="v => v ?? 0"
          /></span>
          <span v-if="sv.消耗 || state.editMode" class="xy-pill xy-pill-cost"
            >耗 <EditableValue v-model="sv.消耗" label="消耗"
          /></span>
          <div v-if="!isEmpty(sv.效果) || state.editMode" class="xy-skill-line-effects">
            <EffectList v-model="sv.效果" />
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed } from 'vue';
import EditableValue from './EditableValue.vue';
import EffectList from './EffectList.vue';
import { isMobileCardOpen, state, toggleMobileCard } from '../composables';

const props = defineProps<{
  unit: any;
  name: string;
  compact?: boolean;
  deletable?: boolean;
}>();

defineEmits<{
  (e: 'toggle', value: boolean): void;
  (e: 'delete'): void;
}>();

const isEmpty = _.isEmpty;

const hp = computed(() => props.unit?.资源池?.气血 || { 现值: 0, 上限: 1 });
const mp = computed(() => props.unit?.资源池?.灵气 || { 现值: 0, 上限: 1 });
const hpPct = computed(() => Math.max(0, Math.min(100, (hp.value.现值 / Math.max(hp.value.上限, 1)) * 100)));
const mpPct = computed(() => Math.max(0, Math.min(100, (mp.value.现值 / Math.max(mp.value.上限, 1)) * 100)));

const elColor = (el: string) =>
  (
    ({
      金: 'var(--xy-el-jin)',
      木: 'var(--xy-el-mu)',
      水: 'var(--xy-el-shui)',
      火: 'var(--xy-el-huo)',
      土: 'var(--xy-el-tu)',
      阴: 'var(--xy-el-yin)',
      阳: 'var(--xy-el-yang)',
      混沌: 'var(--xy-el-hundun)',
    }) as Record<string, string>
  )[el] || 'var(--xy-ink)';
</script>

<style scoped>
.xy-item {
  background: var(--xy-glass);
  border: 1px solid var(--xy-line-gold);
  border-radius: 4px;
  padding: 10px 12px;
}
.xy-item {
  position: relative;
}
.xy-trash {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: var(--xy-paper);
  color: var(--xy-ink-mute);
  border: 1px solid var(--xy-line);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: all 0.18s ease;
  z-index: 2;
}
.xy-item:hover .xy-trash,
.xy-trash:focus-visible {
  opacity: 1;
}
.xy-trash:hover {
  color: var(--xy-cinnabar);
  border-color: var(--xy-cinnabar);
  background: var(--xy-tint-cinnabar-mid);
}

.xy-q-bg-凡 {
  border-left: 3px solid #b8b0a3;
}
.xy-q-bg-黄 {
  border-left: 3px solid var(--xy-gold-deep);
  background: linear-gradient(135deg, var(--xy-tint-gold-mid), var(--xy-glass));
}
.xy-q-bg-玄 {
  border-left: 3px solid #6b6f7a;
  background: linear-gradient(135deg, rgba(120, 130, 150, 0.12), var(--xy-glass));
}
.xy-q-bg-地 {
  border-left: 3px solid #8a5a3a;
  background: linear-gradient(135deg, rgba(160, 100, 60, 0.14), var(--xy-glass));
}
.xy-q-bg-天 {
  border-left: 3px solid var(--xy-gold);
  background: linear-gradient(135deg, var(--xy-tint-gold-mid), var(--xy-glass));
}

.xy-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.xy-has-trash .xy-item-head {
  padding-right: 22px;
}
.xy-item-name {
  font-family: var(--xy-font-display);
  font-size: 15px;
  letter-spacing: 1px;
}
.xy-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}
.xy-item-desc {
  font-size: 12px;
  color: var(--xy-ink-soft);
  line-height: 1.6;
  margin-top: 6px;
}

.xy-toggle {
  flex: 0 0 auto;
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid var(--xy-line);
  border-radius: 12px;
  background: var(--xy-paper-warm);
  color: var(--xy-ink-soft);
  letter-spacing: 1px;
  font-family: var(--xy-font-display);
  cursor: pointer;
  transition: all 0.2s ease;
}
.xy-toggle.on {
  background: linear-gradient(135deg, var(--xy-cinnabar), var(--xy-cinnabar-deep));
  color: var(--xy-paper);
  border-color: var(--xy-cinnabar);
  box-shadow: 0 0 0 2px var(--xy-tint-cinnabar-edge);
}
.xy-unit-badge {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--xy-tint-cinnabar-strong);
  color: var(--xy-cinnabar-deep);
  border: 1px solid var(--xy-tint-cinnabar-border);
  letter-spacing: 1px;
}

.xy-pill {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 2px;
  background: var(--xy-paper-warm);
  border: 1px solid var(--xy-line);
  color: var(--xy-ink-soft);
  letter-spacing: 0.5px;
}
.xy-pill-soft {
  background: var(--xy-tint-jade-soft);
  border-color: var(--xy-tint-jade-border);
  color: var(--xy-jade-deep);
}
.xy-pill-cost {
  background: var(--xy-tint-cinnabar-mid);
  border-color: var(--xy-tint-cinnabar-border);
  color: var(--xy-cinnabar-deep);
}

.xy-quality {
  font-family: var(--xy-font-display);
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 2px;
  letter-spacing: 1px;
}
.xy-q-凡 {
  background: #d4cfc4;
  color: #5a5249;
}
.xy-q-黄 {
  background: linear-gradient(135deg, #d4b06a, #b58938);
  color: #fff;
}
.xy-q-玄 {
  background: linear-gradient(135deg, #6b6f7a, #4a4d56);
  color: #fff;
}
.xy-q-地 {
  background: linear-gradient(135deg, #a06439, #6b3c1a);
  color: #fff;
}
.xy-q-天 {
  background: linear-gradient(135deg, #d4af37, #8b6914);
  color: #fff;
  box-shadow: 0 0 6px var(--xy-tint-gold-glow);
}

.xy-element {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 11px;
  background: var(--el, #ccc);
  color: #fff;
}
.xy-element-mini {
  width: 18px;
  height: 18px;
  font-size: 10px;
}
.xy-tag {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--xy-tint-ink-soft);
  color: var(--xy-ink-mute);
}

.xy-unit-active {
  background: linear-gradient(135deg, var(--xy-tint-gold-strong), var(--xy-glass));
  border-color: var(--xy-gold);
}
.xy-unit-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 6px 0;
}
.xy-unit-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.xy-unit-bar-label {
  flex: 0 0 26px;
  color: var(--xy-ink-mute);
}
.xy-unit-bar-track {
  flex: 1 1 auto;
  height: 6px;
  background: var(--xy-tint-ink-strong);
  border-radius: 3px;
  overflow: hidden;
}
.xy-unit-bar-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s;
}
.xy-unit-bar-fill.blood {
  background: linear-gradient(90deg, #8a2828, #d05858);
}
.xy-unit-bar-fill.spirit {
  background: linear-gradient(90deg, #3d5a8a, #6f9bd0);
}
.xy-unit-bar-num {
  flex: 0 0 auto;
  font-size: 10.5px;
  color: var(--xy-ink-mute);
  font-variant-numeric: tabular-nums;
}
.xy-unit-stats {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.xy-eq-stat {
  font-size: 12px;
  font-family: var(--xy-font-display);
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 2px;
  background: var(--xy-tint-ink-soft);
}
.xy-stat-def {
  color: var(--xy-jade-deep);
  background: var(--xy-tint-jade-mid);
}

.xy-skill-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.xy-skill-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  padding: 4px 8px;
  background: var(--xy-tint-ink-faint);
  border-radius: 3px;
  border-left: 2px solid var(--xy-line-gold);
}
.xy-skill-line-name {
  font-family: var(--xy-font-display);
  flex: 0 0 auto;
  letter-spacing: 1px;
}
.xy-skill-line-atk {
  color: var(--xy-cinnabar);
  font-size: 11px;
  flex: 0 0 auto;
}
.xy-skill-line-effects {
  flex: 1 1 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}
.xy-effect-line {
  font-size: 11.5px;
  color: var(--xy-ink-soft);
  padding: 1px 6px;
  border-left: 2px solid var(--xy-jade);
  background: var(--xy-tint-jade-faint);
}
</style>
