<template>
  <div class="xs-skill-editor">
    <div v-if="!modelValue.length" class="xs-skill-empty">尚未添加技能（按规则：凡/黄品 1 条，玄/地品 2 条，天品 3 条）</div>
    <div v-for="(sk, i) in modelValue" :key="i" class="xs-skill-card">
      <div class="xs-skill-card-head">
        <span class="xs-skill-index">技能 {{ i + 1 }}</span>
        <button type="button" class="xs-effect-remove-btn" title="删除此技能" @click="remove(i)">×</button>
      </div>
      <div class="xs-skill-row">
        <label>名称</label>
        <input
          type="text"
          :value="sk.name"
          maxlength="20"
          placeholder="技能名（如：山岳拳）"
          @input="update(i, 'name', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="xs-skill-row xs-skill-row-stat">
        <label>攻击力</label>
        <input
          type="number"
          min="0"
          :value="sk.攻击力 ?? ''"
          :class="{ overflow: isOver(sk.攻击力, attackRange) }"
          :placeholder="attackRange ? `${attackRange.min}~${attackRange.max}` : ''"
          @input="updateNum(i, '攻击力', $event)"
        />
        <span v-if="attackRange" class="xs-skill-hint" :class="{ warn: isOver(sk.攻击力, attackRange) }">
          {{ isOver(sk.攻击力, attackRange) ? '⚠ 超出推荐上限' : `推荐 ${attackRange.min}~${attackRange.max}` }}
        </span>
        <label class="xs-skill-label-inline">消耗</label>
        <input
          type="text"
          :value="sk.消耗 || ''"
          maxlength="32"
          placeholder="如 气血:30 / 灵气:50 / 无"
          @input="update(i, '消耗', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="xs-skill-effects">
        <div class="xs-skill-effects-head">
          <label>效果</label>
          <button type="button" class="xs-effect-add-btn xs-tiny" @click="addEffect(i)">+ 添加效果</button>
        </div>
        <div v-if="!getEffectPairs(sk).length" class="xs-skill-empty xs-inline">无效果条目</div>
        <div
          v-for="(eff, j) in getEffectPairs(sk)"
          :key="j"
          class="xs-skill-row xs-skill-effect-row"
        >
          <input
            type="text"
            class="xs-effect-name-input"
            :value="eff.name"
            maxlength="24"
            placeholder="效果名"
            @input="updateEffectName(i, j, ($event.target as HTMLInputElement).value)"
          />
          <input
            type="text"
            class="xs-effect-desc-input"
            :value="eff.value"
            maxlength="120"
            placeholder="效果描述"
            @input="updateEffectValue(i, j, ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="xs-effect-remove-btn"
            title="删除此条效果"
            @click="removeEffect(i, j)"
          >×</button>
        </div>
      </div>
    </div>
    <button type="button" class="xs-effect-add-btn xs-skill-add" @click="add">+ 添加技能</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CustomSkill, ItemQuality, ItemRealm } from '../types';
import { computeSuggestedRange, realmL, qualityQ, SKILL_ATTACK_COEF_RANGE, isOverRecommended, type SuggestedRange } from '../config/itemSchema';

interface Props {
  modelValue: CustomSkill[];
  quality: ItemQuality;
  realm: ItemRealm;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: CustomSkill[]): void;
}>();

// 技能攻击力的推荐区间（按规则表 0~0.3）
const attackRange = computed<SuggestedRange | null>(() =>
  computeSuggestedRange(
    { key: '攻击力', label: '攻击力', type: 'number', group: '数值', formula: 'coef', coefRange: SKILL_ATTACK_COEF_RANGE },
    realmL(props.realm),
    qualityQ(props.quality),
  ),
);

function isOver(v: number | undefined, r: SuggestedRange | null): boolean {
  return typeof v === 'number' && isOverRecommended(v, r);
}

function emitUpdate(arr: CustomSkill[]) {
  emit('update:modelValue', arr);
}

function add() {
  emitUpdate([...props.modelValue, { name: '', 效果: {} }]);
}
function remove(i: number) {
  const next = props.modelValue.slice();
  next.splice(i, 1);
  emitUpdate(next);
}
function update<K extends keyof CustomSkill>(i: number, key: K, value: CustomSkill[K]) {
  const next = props.modelValue.slice();
  next[i] = { ...next[i], [key]: value };
  emitUpdate(next);
}
function updateNum(i: number, key: '攻击力', e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  const v = raw === '' ? undefined : Math.max(0, Math.floor(Number(raw) || 0));
  update(i, key, v as any);
}

// —— 效果 key-value 子编辑 —— //
interface EffectPair { name: string; value: string }
function getEffectPairs(sk: CustomSkill): EffectPair[] {
  if (!sk.效果) return [];
  return Object.entries(sk.效果).map(([name, value]) => ({
    name: name.startsWith('__empty_') ? '' : name,
    value,
  }));
}
function setEffectPairs(i: number, pairs: EffectPair[]) {
  const map: Record<string, string> = {};
  for (const p of pairs) {
    const k = p.name.trim();
    if (k) map[k] = p.value;
  }
  update(i, '效果', map);
}
function addEffect(i: number) {
  const pairs = getEffectPairs(props.modelValue[i]);
  // 直接编辑临时数组（带空槽）
  const next = props.modelValue.slice();
  const sk = { ...next[i] };
  const newPairs = [...pairs, { name: '', value: '' }];
  // 写回时空 name 会被过滤，所以这里把整条数组临时存进去
  sk.效果 = pairsToRecord(newPairs);
  next[i] = sk;
  emitUpdate(next);
}
function removeEffect(i: number, j: number) {
  const pairs = getEffectPairs(props.modelValue[i]);
  pairs.splice(j, 1);
  setEffectPairs(i, pairs);
}
function updateEffectName(i: number, j: number, name: string) {
  const pairs = getEffectPairs(props.modelValue[i]);
  if (!pairs[j]) return;
  pairs[j] = { ...pairs[j], name };
  // 名为空时保留占位条目（直接写 record 会丢条），所以这里写带空 key 的 record
  setEffectPairsKeepEmpty(i, pairs);
}
function updateEffectValue(i: number, j: number, value: string) {
  const pairs = getEffectPairs(props.modelValue[i]);
  if (!pairs[j]) return;
  pairs[j] = { ...pairs[j], value };
  setEffectPairsKeepEmpty(i, pairs);
}
// 保留空 name 的条目（用 __empty_N 占位），UI 渲染时不显示占位 key
function pairsToRecord(pairs: EffectPair[]): Record<string, string> {
  const map: Record<string, string> = {};
  let emptyIdx = 0;
  for (const p of pairs) {
    if (p.name.trim() === '') {
      map[`__empty_${emptyIdx++}`] = p.value;
    } else {
      map[p.name] = p.value;
    }
  }
  return map;
}
function setEffectPairsKeepEmpty(i: number, pairs: EffectPair[]) {
  update(i, '效果', pairsToRecord(pairs));
}
</script>

<style scoped>
.xs-skill-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.xs-skill-empty {
  font-size: 12px;
  color: var(--xs-ink-mute);
  letter-spacing: 1px;
  padding: 8px 12px;
  border: 1px dashed var(--xs-line);
  border-radius: 8px;
  background: var(--xs-paper-warm);
  text-align: center;
}
.xs-skill-empty.xs-inline {
  padding: 4px 8px;
  text-align: left;
  background: transparent;
  border: none;
  font-size: 11.5px;
}
.xs-skill-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 8px;
  background: var(--xs-paper-warm);
}
.xs-skill-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px dashed var(--xs-line);
  padding-bottom: 6px;
}
.xs-skill-index {
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 2px;
  color: var(--xs-cinnabar-deep);
}
.xs-skill-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.xs-skill-row label {
  flex: 0 0 auto;
  min-width: 44px;
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
}
.xs-skill-row input[type='text'] {
  flex: 1 1 200px;
  font-family: var(--xs-font-display);
  font-size: 13px;
  background: var(--xs-paper);
  border: 1px solid var(--xs-line-gold);
  padding: 5px 9px;
  border-radius: 4px;
}
.xs-skill-row input[type='number'] {
  flex: 0 0 100px;
  text-align: center;
  font-family: var(--xs-font-title);
  font-size: 13px;
  background: var(--xs-paper);
  border: 1px solid var(--xs-line-gold);
  padding: 5px 6px;
  border-radius: 4px;
}
.xs-skill-row input.overflow {
  border-color: #d69e2e;
  background: rgba(214, 158, 46, 0.08);
}
.xs-skill-row input:focus {
  border-color: var(--xs-cinnabar);
  outline: none;
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
}
.xs-skill-row-stat .xs-skill-label-inline {
  min-width: auto;
  margin-left: 12px;
}
.xs-skill-hint {
  font-size: 11px;
  color: var(--xs-ink-mute);
  letter-spacing: 0.5px;
}
.xs-skill-hint.warn {
  color: #b7791f;
  font-weight: 600;
}
.xs-skill-effects {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  background: rgba(168, 153, 104, 0.06);
  border-left: 2px solid var(--xs-cinnabar);
  border-radius: 0 4px 4px 0;
}
.xs-skill-effects-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.xs-skill-effects-head label {
  flex: 0 0 auto;
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
}
.xs-skill-effect-row .xs-effect-name-input { flex: 1 1 0; min-width: 110px; }
.xs-skill-effect-row .xs-effect-desc-input { flex: 1.4 1 0; min-width: 140px; }

/* —— 复用自 StepInventory.vue 的样式，这里加 scoped 副本 —— */
.xs-effect-remove-btn {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--xs-line);
  background: var(--xs-paper-warm);
  color: var(--xs-ink-mute);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.18s ease;
}
.xs-effect-remove-btn:hover:not(:disabled) {
  border-color: var(--xs-cinnabar);
  background: var(--xs-tint-cinnabar-soft);
  color: var(--xs-cinnabar);
}
.xs-effect-add-btn {
  padding: 4px 14px;
  border-radius: 14px;
  border: 1px dashed var(--xs-cinnabar);
  background: var(--xs-tint-cinnabar-faint);
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--xs-cinnabar);
  cursor: pointer;
  transition: all 0.18s ease;
}
.xs-effect-add-btn.xs-tiny {
  padding: 2px 10px;
  font-size: 11px;
  letter-spacing: 1px;
}
.xs-effect-add-btn:hover {
  background: var(--xs-cinnabar);
  color: #fff;
  border-style: solid;
}
.xs-skill-add {
  align-self: flex-start;
}
</style>
