<template>
  <div
    class="item-card"
    :class="[
      `cat-${view.category}`,
      `sub-${view.类型}`,
      {
        'is-stone': isStone,
        selected,
        disabled,
        locked,
        clickable,
        'has-corner': selected || badge,
      },
    ]"
    @click="onClick"
  >
    <!-- 右上角标：已选 / 剧情 / 自创（互斥，绝对定位不占布局） -->
    <span v-if="selected" class="ic-corner ic-corner-sel">✓ 已选</span>
    <span v-else-if="badge" class="ic-corner" :class="badgeType ? `bt-${badgeType}` : ''">{{ badge }}</span>

    <!-- 头部 -->
    <div class="ic-head">
      <div class="ic-name">{{ view.name }}</div>
      <div class="ic-meta">
        <span v-if="view.品质" class="ic-pill ic-quality" :class="`q-${view.品质}`">{{ view.品质 }}品</span>
        <span v-if="view.类型" class="ic-pill ic-type">{{ view.类型 }}</span>
        <span v-if="view.境界" class="ic-pill ic-realm">{{ view.境界 }}</span>
        <span v-if="view.五行" class="ic-element" :style="{ background: elColor(view.五行) }">{{ view.五行 === '混沌' ? '混' : view.五行 }}</span>
        <span v-if="view.数量" class="ic-pill ic-qty">×{{ view.数量 }}</span>
        <span v-if="view.完整度" class="ic-pill ic-mini">{{ view.完整度 }}</span>
        <span v-if="view.阅读进度" class="ic-pill ic-mini">进度 {{ view.阅读进度 }}</span>
      </div>
    </div>

    <!-- 灵石：数量大字 -->
    <div v-if="view.category === '灵石' && view.灵石" class="ic-qtybig">
      ×{{ view.灵石 }} <small>枚</small>
    </div>

    <!-- 数值 chip -->
    <div v-if="view.stats.length" class="ic-stats">
      <span v-for="(s, i) in view.stats" :key="i" class="ic-stat" :class="s.cls ? `st-${s.cls}` : ''">
        {{ s.label }} <b>{{ s.value }}</b>
      </span>
    </div>

    <!-- 资源池（傀儡/灵兽） -->
    <div v-if="view.resources.length" class="ic-resources">
      <div v-for="(r, i) in view.resources" :key="i" class="ic-bar">
        <span class="ic-bar-label">{{ r.name }}</span>
        <span class="ic-bar-track">
          <span class="ic-bar-fill" :class="r.name === '气血' ? 'hp' : 'mp'" :style="{ width: barPct(r) }"></span>
        </span>
        <span class="ic-bar-num">{{ r.cur }}<template v-if="r.max">/{{ r.max }}</template></span>
      </div>
    </div>

    <!-- 描述标签 -->
    <div v-if="view.descTags.length" class="ic-tagrow">
      <span v-for="(t, i) in view.descTags" :key="i" class="ic-tag-desc">{{ t }}</span>
    </div>

    <!-- 效果块 -->
    <div v-if="view.effects.length" class="ic-effects">
      <div v-for="(e, i) in view.effects" :key="i" class="ic-effect-row">
        <span class="ic-effect-name">{{ e.name }}</span>
        <span class="ic-effect-val">{{ e.val }}</span>
      </div>
    </div>

    <!-- 技能块（傀儡/灵兽） -->
    <div v-if="view.skills.length" class="ic-skills">
      <div class="ic-skills-head">技能</div>
      <div v-for="(sk, i) in view.skills" :key="i" class="ic-skill">
        <span class="ic-skill-name">{{ sk.name }}</span>
        <span v-if="sk.攻击力" class="ic-stat st-atk">攻 <b>{{ sk.攻击力 }}</b></span>
        <span v-if="sk.消耗" class="ic-skill-cost">耗 {{ sk.消耗 }}</span>
      </div>
    </div>

    <!-- 描述 -->
    <p v-if="view.desc" class="ic-desc">{{ view.desc }}</p>

    <!-- 底栏：消耗 / 位置 / 点数 / 操作 -->
    <div v-if="view.消耗 || view.位置 || costText || $slots.actions" class="ic-foot">
      <span v-if="view.消耗" class="ic-foot-item">耗 {{ view.消耗 }}</span>
      <span v-if="view.位置" class="ic-foot-item">📍 {{ view.位置 }}</span>
      <span v-if="costText" class="ic-cost" :class="{ free: costText.includes('免') || costText.includes('固定') }">{{ costText }}</span>
      <span class="ic-foot-spacer"></span>
      <span v-if="$slots.actions" class="ic-actions" @click.stop>
        <slot name="actions" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CardView } from '../itemNormalizer';

const props = defineProps<{
  view: CardView;
  selected?: boolean;
  disabled?: boolean;
  locked?: boolean;
  clickable?: boolean;
  badge?: string;
  badgeType?: string;
  costText?: string;
}>();

const emit = defineEmits<{ pick: [] }>();

const isStone = computed(() => props.view.类型 === '工具' && props.view.品质 === '凡');

const EL_COLOR: Record<string, string> = {
  金: '#d6c474', 木: '#7ec47b', 水: '#5d9cd4', 火: '#d46b50',
  土: '#b48a5e', 阴: '#7a4f7a', 阳: '#d4a85e', 混沌: '#888',
};
function elColor(el?: string): string {
  return (el && EL_COLOR[el]) || '#888';
}
function barPct(r: { cur: number; max?: number }): string {
  const max = Math.max(1, r.max || r.cur || 1);
  return Math.max(0, Math.min(100, (r.cur / max) * 100)).toFixed(1) + '%';
}
function onClick() {
  if (props.clickable && !props.disabled) emit('pick');
}
</script>

<style scoped>
.item-card {
  position: relative;
  border: 1px solid var(--xs-line-gold);
  border-radius: 10px;
  background: var(--xs-glass);
  overflow: hidden;
  box-shadow: 0 4px 14px -8px rgba(89, 65, 33, 0.25);
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}
.item-card.clickable { cursor: pointer; }
.item-card.clickable:hover:not(.selected):not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px -10px rgba(89, 65, 33, 0.4);
}
.item-card.disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(0.25); }
.item-card.selected {
  outline: 2px solid var(--xs-cinnabar);
  outline-offset: 1px;
  box-shadow: 0 0 0 1px var(--xs-cinnabar) inset, 0 6px 20px -10px var(--xs-cinnabar-glow);
}
.item-card.locked { cursor: default; }

.ic-head { padding: 9px 12px 8px; border-bottom: 1px dashed var(--xs-line); }
/* 头部预留右上角标空间，避免长名字被角标压住 */
.item-card.has-corner .ic-head { padding-right: 58px; }
.ic-corner {
  position: absolute; top: 8px; right: 8px; z-index: 4;
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  padding: 2px 8px; border-radius: 10px; color: #fff; background: #8a6a9c;
}
.ic-corner-sel { background: var(--xs-cinnabar); }
.ic-corner.bt-plot { background: #8a6a9c; }
.ic-corner.bt-custom { background: var(--xs-cinnabar); }
.ic-name {
  font-family: var(--xs-font-display, 'Cinzel', serif);
  font-size: 15px; font-weight: 700; letter-spacing: 0.6px; line-height: 1.3;
  color: var(--xs-ink);
}
.ic-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
.ic-pill {
  display: inline-flex; align-items: center; gap: 3px; padding: 1px 8px;
  font-size: 11px; border-radius: 9px;
  background: var(--xs-paper-warm); color: var(--xs-ink-soft); border: 1px solid var(--xs-line-gold);
}
.ic-quality.q-凡 { background: #e7e2d6; color: #6a6356; border-color: #cfc7b4; }
.ic-quality.q-黄 { background: linear-gradient(135deg, #e6c877, #d4af37); color: #5a4210; border-color: #c9a94e; }
.ic-quality.q-玄 { background: #dfe1e6; color: #4a4e57; border-color: #c2c6cf; }
.ic-quality.q-地 { background: linear-gradient(135deg, #dcb389, #bd8858); color: #5a3418; border-color: #c69a6a; }
.ic-quality.q-天 { background: linear-gradient(135deg, #f4e08a, #e0be5a); color: #5a4210; border-color: #cfa93e; box-shadow: 0 0 8px rgba(224, 190, 90, 0.4); }
.ic-realm { background: rgba(91, 138, 114, 0.14); color: var(--xs-jade-deep); border-color: rgba(91, 138, 114, 0.3); }
.ic-qty, .ic-mini { background: rgba(201, 169, 110, 0.14); color: var(--xs-gold-deep); }
.ic-element {
  width: 18px; height: 18px; border-radius: 50%; color: #fff; font-size: 10px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.ic-qtybig { padding: 7px 12px 2px; font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #3a7a80; }
.ic-qtybig small { font-size: 12px; color: var(--xs-ink-mute); font-weight: 400; }

.ic-stats { display: flex; flex-wrap: wrap; gap: 5px; padding: 7px 12px 2px; }
.ic-stat {
  display: inline-flex; align-items: center; gap: 3px; padding: 1px 9px; border-radius: 4px;
  font-size: 12px; background: var(--xs-paper-warm); border: 1px solid var(--xs-line-gold); color: var(--xs-ink-soft);
}
.ic-stat b { color: var(--xs-ink); font-weight: 700; }
.st-atk { background: rgba(177, 58, 58, 0.10); border-color: rgba(177, 58, 58, 0.3); color: #a33; }
.st-def { background: rgba(74, 110, 150, 0.10); border-color: rgba(74, 110, 150, 0.3); color: #3a5f88; }
.st-hit { background: rgba(201, 169, 110, 0.16); border-color: rgba(201, 169, 110, 0.4); color: #8a6a2e; }
.st-spd { background: rgba(138, 106, 156, 0.12); border-color: rgba(138, 106, 156, 0.32); color: #6e4f80; }
.st-mana { background: rgba(79, 138, 160, 0.12); border-color: rgba(79, 138, 160, 0.3); color: #3a6f80; }
.st-buff { background: rgba(91, 138, 114, 0.12); border-color: rgba(91, 138, 114, 0.3); color: var(--xs-jade-deep); }

.ic-resources { display: flex; flex-direction: column; gap: 4px; padding: 7px 12px 2px; }
.ic-bar { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.ic-bar-label { flex: 0 0 auto; min-width: 30px; color: var(--xs-ink-mute); font-weight: 600; }
.ic-bar-track { flex: 1; height: 6px; background: rgba(42, 37, 32, 0.1); border-radius: 3px; overflow: hidden; }
.ic-bar-fill { display: block; height: 100%; border-radius: 3px; transition: width 0.4s ease; }
.ic-bar-fill.hp { background: linear-gradient(90deg, #c96a6a, #b13a3a); }
.ic-bar-fill.mp { background: linear-gradient(90deg, #6f9bd0, #4f7aa0); }
.ic-bar-num { flex: 0 0 auto; color: var(--xs-ink-soft); font-size: 11px; font-variant-numeric: tabular-nums; }

.ic-tagrow { display: flex; flex-wrap: wrap; gap: 4px; padding: 5px 12px 2px; }
.ic-tag-desc {
  padding: 1px 8px; font-size: 11px; border-radius: 8px;
  background: rgba(201, 169, 110, 0.12); border: 1px dashed rgba(201, 169, 110, 0.4); color: var(--xs-ink-mute);
}

.ic-effects {
  margin: 5px 12px; padding: 5px 10px; background: rgba(201, 169, 110, 0.08);
  border-left: 2px solid var(--xs-gold-deep); border-radius: 0 4px 4px 0; font-size: 12px; line-height: 1.55;
}
.ic-effect-row { display: flex; flex-wrap: wrap; gap: 4px; }
.ic-effect-name { color: var(--xs-gold-deep); font-weight: 700; flex-shrink: 0; }
.ic-effect-name::after { content: '：'; }
.ic-effect-val { color: var(--xs-ink-soft); flex: 1 1 auto; }

.ic-skills {
  margin: 6px 12px 8px; padding: 6px 10px; background: rgba(201, 169, 110, 0.08);
  border-left: 2px solid var(--xs-gold-deep); border-radius: 0 4px 4px 0;
}
.ic-skills-head { font-size: 11px; letter-spacing: 1.5px; color: var(--xs-gold-deep); margin-bottom: 4px; }
.ic-skill { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; font-size: 12px; margin-bottom: 2px; }
.ic-skill-name { font-weight: 700; color: var(--xs-ink-soft); }
.ic-skill-cost { padding: 0 6px; border-radius: 4px; background: rgba(79, 138, 160, 0.12); color: #3a6f80; font-size: 11px; }

.ic-desc {
  padding: 5px 12px; font-size: 12px; line-height: 1.6; color: var(--xs-ink-mute);
  font-style: italic; border-top: 1px dashed var(--xs-line);
}
.ic-foot { padding: 5px 12px 8px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 11px; color: var(--xs-ink-mute); }
.ic-foot-item { display: inline-flex; align-items: center; gap: 3px; }
.ic-foot-spacer { flex: 1; }
.ic-cost {
  padding: 1px 9px; border-radius: 9px; font-size: 11px; font-weight: 600;
  background: var(--xs-paper-warm); border: 1px solid var(--xs-line-gold); color: var(--xs-ink-soft);
}
.ic-cost.free { background: rgba(91, 138, 114, 0.14); color: var(--xs-jade-deep); border-color: rgba(91, 138, 114, 0.3); }
.ic-actions { display: inline-flex; gap: 6px; }

/* ===== 大类基调（左色带 + 头部浅色底 + 名称/类型色） ===== */
.cat-功法 { border-left: 4px solid #a07fb0; }
.cat-功法 .ic-head { background: linear-gradient(135deg, rgba(138, 106, 156, 0.12), transparent); }
.cat-功法 .ic-name { color: #6e4f80; }
.cat-功法 .ic-type { background: rgba(138, 106, 156, 0.14); color: #6e4f80; border-color: rgba(138, 106, 156, 0.32); }
.cat-装备 { border-left: 4px solid #6f93b0; }
.cat-装备 .ic-head { background: linear-gradient(135deg, rgba(74, 110, 150, 0.12), transparent); }
.cat-装备 .ic-name { color: #3a5f88; }
.cat-装备 .ic-type { background: rgba(74, 110, 150, 0.12); color: #3a5f88; border-color: rgba(74, 110, 150, 0.3); }
.cat-物品 { border-left: 4px solid var(--xs-gold); }
.cat-物品 .ic-head { background: linear-gradient(135deg, rgba(201, 169, 110, 0.16), transparent); }
.cat-物品 .ic-name { color: var(--xs-gold-deep); }
.cat-物品 .ic-type { background: rgba(201, 169, 110, 0.16); color: var(--xs-gold-deep); border-color: rgba(201, 169, 110, 0.4); }
.cat-灵石 { border-left: 4px solid #5aa0a8; }
.cat-灵石 .ic-head { background: linear-gradient(135deg, rgba(79, 154, 160, 0.14), transparent); }
.cat-灵石 .ic-name { color: #3a7a80; }
.cat-灵石 .ic-type { background: rgba(79, 154, 160, 0.14); color: #3a7a80; border-color: rgba(79, 154, 160, 0.32); }
.cat-傀儡 { border-left: 4px solid #9a9384; }
.cat-傀儡 .ic-head { background: linear-gradient(135deg, rgba(138, 133, 120, 0.14), transparent); }
.cat-傀儡 .ic-name { color: #6a6558; }
.cat-傀儡 .ic-type { background: rgba(138, 133, 120, 0.14); color: #6a6558; border-color: rgba(138, 133, 120, 0.32); }
.cat-灵兽 { border-left: 4px solid var(--xs-jade); }
.cat-灵兽 .ic-head { background: linear-gradient(135deg, rgba(91, 138, 114, 0.14), transparent); }
.cat-灵兽 .ic-name { color: var(--xs-jade-deep); }
.cat-灵兽 .ic-type { background: rgba(91, 138, 114, 0.14); color: var(--xs-jade-deep); border-color: rgba(91, 138, 114, 0.3); }

/* ===== 子类专属点缀 ===== */
/* 神识：淡紫柔光 */
.sub-神识 { border-color: rgba(160, 127, 176, 0.55); box-shadow: 0 0 0 1px rgba(160, 127, 176, 0.25) inset, 0 4px 16px -8px rgba(160, 127, 176, 0.5); }
.sub-神识 .ic-head { background: linear-gradient(135deg, rgba(160, 127, 176, 0.2), transparent); }
/* 符箓：符纸暖底 + 朱砂竖纹 */
.sub-符箓 { background: linear-gradient(160deg, #f6ecd6, #f0e2c4); }
.sub-符箓::after {
  content: ''; position: absolute; right: 10px; top: 8px; bottom: 8px; width: 2px;
  background: linear-gradient(#b13a3a, rgba(177, 58, 58, 0.2)); opacity: 0.5;
}
/* 工具·凡品：顽石灰底 */
.item-card.is-stone { background: linear-gradient(135deg, #eae6da, #ddd8cb); border-color: #c8c2b2; }
.item-card.is-stone .ic-head { background: linear-gradient(135deg, rgba(120, 116, 108, 0.1), transparent); }
.item-card.is-stone .ic-name { color: #6a6558; }
</style>
