<template>
  <div>
    <h2 class="xs-step-title">择 · 初始资材</h2>
    <p class="xs-step-subtitle">取舍之间见性情；可同时携带数件，所选条目独立计费。可按境界、品质、类型筛选；亦可自创资材。</p>
    <p class="xs-realm-cap-hint">
      <span class="xs-pill xs-pill-jade">境界上限</span>
      仅可选择 <b>{{ realmCapLabel }}</b> 及以下境界的资材（由开局故事决定）。
    </p>

    <!-- 剧情物品（随剧本解锁·固定携带） -->
    <section v-if="activePlotItems.length" class="xs-inv-section">
      <div class="xs-custom-head">
        <h3 class="xs-section-title">剧情物品</h3>
        <span class="xs-custom-count">由所选开局剧本赋予 · 固定携带 · 不耗点数</span>
      </div>
      <div class="xs-card-grid cols-3">
        <ItemCard
          v-for="p in activePlotItems"
          :key="p.id"
          :view="plotView(p)"
          locked
          badge="剧情"
          badge-type="plot"
          cost-text="固定 · 0 点"
        />
      </div>
    </section>

    <!-- 自创资材 -->
    <section class="xs-custom-section">
      <div class="xs-custom-head">
        <h3 class="xs-section-title">自创资材</h3>
        <span class="xs-custom-count">
          已创 {{ store.selection.customItems.length }} 件 · 计 {{ store.customItemsCost }} 点
        </span>
        <button
          v-if="!editorOpen"
          type="button"
          class="xs-btn xs-btn-ghost"
          @click="openCreate()"
        >
          + 添加
        </button>
      </div>

      <!-- 自创条目卡片 -->
      <div v-if="store.selection.customItems.length" class="xs-card-grid cols-3">
        <ItemCard
          v-for="c in store.selection.customItems"
          :key="c.id"
          :view="customView(c)"
          badge="自创"
          badge-type="custom"
          :cost-text="`${customCost(c)} 点`"
        >
          <template #actions>
            <button type="button" class="xs-btn xs-btn-ghost xs-mini-btn" @click="openEdit(c)">编辑</button>
            <button type="button" class="xs-btn xs-btn-ghost xs-mini-btn" @click="store.removeCustomItem(c.id)">删除</button>
          </template>
        </ItemCard>
      </div>

      <!-- 编辑器 -->
      <div v-if="editorOpen" class="xs-custom-editor">
        <div class="xs-custom-edit-row">
          <label>名号</label>
          <input
            type="text"
            v-model="draft.name"
            maxlength="30"
            placeholder="请为这件资材命名（如：紫电雷符）"
          />
        </div>
        <div class="xs-custom-edit-row">
          <label>大类</label>
          <select v-model="draft.category" @change="onDraftCategoryChangeFull">
            <option v-for="c in ITEM_CATEGORIES.filter(c => c !== '灵石')" :key="c" :value="c">{{ c }}</option>
          </select>
          <label>类型</label>
          <select v-model="draft.类型" @change="onDraftKindChange">
            <option
              v-for="k in ITEM_KINDS_BY_CATEGORY[draft.category]"
              :key="k"
              :value="k"
            >
              {{ k }}
            </option>
          </select>
        </div>
        <div class="xs-custom-edit-row">
          <label>品质</label>
          <select v-model="draft.品质">
            <option v-for="q in ITEM_QUALITIES" :key="q" :value="q">{{ q }}品</option>
          </select>
          <label>境界</label>
          <select v-model="draft.境界">
            <option v-for="r in allowedRealms" :key="r" :value="r">{{ r }}</option>
          </select>
          <label>五行</label>
          <select v-model="draft.五行">
            <option v-for="el in FIVE_ELEMENTS" :key="el" :value="el">{{ el }}</option>
          </select>
        </div>
        <div class="xs-custom-edit-row">
          <label>描述</label>
          <input
            type="text"
            v-model="draft.desc"
            maxlength="200"
            placeholder="一句话描述其作用（可空）"
          />
        </div>

        <!-- 按 schema 渲染的字段（数值/select/toggle/string，按类型变化） -->
        <div v-if="draftFields.length" class="xs-custom-edit-schema">
          <div
            v-for="def in draftFields"
            :key="def.key"
            class="xs-custom-edit-row xs-schema-field"
            :class="{ 'xs-schema-toggle': def.type === 'toggle' }"
          >
            <label>{{ def.label }}</label>

            <!-- 数值 / 整数 -->
            <template v-if="def.type === 'number' || def.type === 'integer'">
              <input
                type="number"
                min="0"
                step="1"
                class="xs-schema-num-input"
                :class="{ overflow: fieldOverflow(def) }"
                :value="getFieldValue(def) ?? ''"
                :placeholder="rangeFor(def)?.suggested?.toString() ?? ''"
                @input="onFieldNumberInput(def, $event)"
              />
              <span v-if="fieldHintText(def)" class="xs-schema-hint" :class="{ warn: fieldOverflow(def) }">
                {{ fieldOverflow(def) ? '⚠ 超出推荐上限：' + fieldHintText(def) : fieldHintText(def) }}
              </span>
            </template>

            <!-- 百分比 -->
            <template v-else-if="def.type === 'percent'">
              <div class="xs-schema-percent-wrap" :class="{ overflow: fieldOverflow(def) }">
                <input
                  type="number"
                  min="0"
                  step="1"
                  :value="getFieldValue(def) ?? ''"
                  :placeholder="rangeFor(def)?.suggested?.toString() ?? ''"
                  @input="onFieldNumberInput(def, $event)"
                />
                <span class="xs-schema-percent-suffix">%</span>
              </div>
              <span v-if="fieldHintText(def)" class="xs-schema-hint" :class="{ warn: fieldOverflow(def) }">
                {{ fieldOverflow(def) ? '⚠ 超出推荐上限：' + fieldHintText(def) : fieldHintText(def) }}
              </span>
            </template>

            <!-- 字符串 -->
            <template v-else-if="def.type === 'string'">
              <input
                type="text"
                :value="getFieldValue(def) ?? ''"
                :placeholder="stringPlaceholder(def)"
                maxlength="40"
                @input="setFieldValue(def, ($event.target as HTMLInputElement).value)"
              />
              <span v-if="def.hint" class="xs-schema-hint">{{ def.hint }}</span>
            </template>

            <!-- 下拉 -->
            <template v-else-if="def.type === 'select'">
              <select
                :value="getFieldValue(def) ?? def.default ?? ''"
                @change="setFieldValue(def, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="opt in def.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <span v-if="def.hint" class="xs-schema-hint">{{ def.hint }}</span>
            </template>

            <!-- 开关 -->
            <template v-else-if="def.type === 'toggle'">
              <label class="xs-schema-toggle-label">
                <input
                  type="checkbox"
                  :checked="getFieldValue(def) === true"
                  @change="setFieldValue(def, ($event.target as HTMLInputElement).checked)"
                />
                <span>启用</span>
              </label>
              <span v-if="def.hint" class="xs-schema-hint">{{ def.hint }}</span>
            </template>
          </div>
        </div>

        <!-- 技能（仅傀儡/灵兽） -->
        <div v-if="draftSupportsSkill" class="xs-custom-edit-row xs-custom-edit-skill-row">
          <label>技能</label>
          <div class="xs-custom-edit-skill-wrap">
            <SkillEditor
              v-model="draft.技能"
              :quality="draft.品质"
              :realm="draft.境界"
            />
          </div>
        </div>

        <!-- 效果（仅支持该结构的子类型才显示） -->
        <div v-if="draftSupportsEffect" class="xs-custom-edit-effects">
          <div
            v-for="(eff, idx) in draft.effects"
            :key="idx"
            class="xs-custom-edit-row xs-custom-edit-effect"
          >
            <label>{{ idx === 0 ? '效果' : '' }}</label>
            <input
              type="text"
              class="xs-effect-name-input"
              v-model="eff.name"
              maxlength="24"
              placeholder="效果名"
            />
            <input
              type="text"
              class="xs-effect-desc-input"
              v-model="eff.value"
              maxlength="120"
              placeholder="效果描述"
            />
            <button
              type="button"
              class="xs-effect-remove-btn"
              :title="draft.effects.length === 1 ? '至少保留 1 条' : '删除此条效果'"
              :disabled="draft.effects.length === 1"
              @click="removeDraftEffect(idx)"
            >×</button>
          </div>
          <div class="xs-custom-edit-row xs-custom-edit-effect-add">
            <label></label>
            <button type="button" class="xs-effect-add-btn" @click="addDraftEffect">+ 添加效果</button>
          </div>
        </div>

        <div class="xs-custom-edit-actions">
          <span class="xs-custom-cost-preview">将耗费 {{ draftCost }} 点</span>
          <button type="button" class="xs-btn xs-btn-ghost" @click="closeEditor">取消</button>
          <button
            type="button"
            class="xs-btn xs-btn-primary"
            :disabled="!canSave"
            @click="onSave"
          >
            {{ editingId ? '保存改动' : '加入' }}
          </button>
        </div>
      </div>
    </section>

    <!-- 筛选器 -->
    <section class="xs-preset-section">
      <h3 class="xs-section-title">预设资材</h3>
      <div class="xs-inv-filters">
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">境界</span>
          <select v-model="realmFilter">
            <option value="">全部</option>
            <option v-for="r in allowedRealms" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">品质</span>
          <select v-model="qualityFilter">
            <option value="">全部</option>
            <option v-for="q in ITEM_QUALITIES" :key="q" :value="q">{{ q }}品</option>
          </select>
        </div>
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">大类</span>
          <select v-model="categoryFilter" @change="onCategoryChange">
            <option value="">全部</option>
            <option v-for="c in ITEM_CATEGORIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">类型</span>
          <select v-model="kindFilter">
            <option value="">全部</option>
            <option v-for="k in availableKinds" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>
        <button v-if="hasFilters" type="button" class="xs-btn xs-btn-ghost xs-inv-clear" @click="clearFilters">
          清空筛选
        </button>
        <span class="xs-inv-count">显示 {{ filteredItems.length }} / {{ items.length }}</span>
      </div>

      <div v-if="filteredItems.length === 0" class="xs-empty">未匹配到任何资材</div>
      <div v-else>
        <div class="xs-card-grid cols-3">
          <ItemCard
            v-for="it in pageItems"
            :key="it.id"
            :view="presetView(it)"
            clickable
            :selected="store.isItemSelected(it.id)"
            :disabled="!canAfford(it)"
            :cost-text="costText(it)"
            @pick="store.toggleItem(it.id)"
          />
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="xs-pager">
          <button
            type="button"
            class="xs-pager-btn"
            :disabled="currentPage <= 1"
            @click="currentPage = 1"
          >« 首页</button>
          <button
            type="button"
            class="xs-pager-btn"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >‹ 上一页</button>
          <span class="xs-pager-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button
            type="button"
            class="xs-pager-btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >下一页 ›</button>
          <button
            type="button"
            class="xs-pager-btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage = totalPages"
          >末页 »</button>
        </div>
      </div>
    </section>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="store.overBudget"
        @click="store.next"
      >
        继续 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type {
  CustomItem,
  CustomSkill,
  ItemCategory,
  ItemKind,
  ItemOption,
  ItemQuality,
  ItemRealm,
} from '../types';
import {
  ALL_ITEM_KINDS,
  EFFECT_SUPPORTED_KINDS,
  FIELD_SCHEMAS,
  ITEM_CATEGORIES,
  ITEM_KINDS_BY_CATEGORY,
  ITEM_QUALITIES,
  ITEM_REALMS,
  SKILL_SUPPORTED_KINDS,
  computeCustomItemCost,
  computeSuggestedRange,
  customStoryToOption,
  findStory,
  isOverRecommended,
  items,
  plotItemsForStory,
  qualityQ,
  rangeHintText,
  realmL,
} from '../config';
import type { PlotItem } from '../types';
import type { FieldDef, SuggestedRange } from '../config/itemSchema';
import type { CardStat, CardView } from '../itemNormalizer';
import { dataToCardView, itemToCardView } from '../itemNormalizer';
import { useStartStore } from '../store';
import ItemCard from '../components/ItemCard.vue';
import SkillEditor from '../components/SkillEditor.vue';

const FIVE_ELEMENTS = ['金', '木', '水', '火', '土', '阴', '阳', '混沌'] as const;

const store = useStartStore();

// —— 剧情物品（随所选剧本解锁，固定携带、0 点、锁定） ——
const activePlotItems = computed<PlotItem[]>(() =>
  plotItemsForStory(store.selection.storyId),
);

// —— CardView 构建（预设 / 剧情 / 自创，统一交给 ItemCard 渲染） ——
function presetView(it: ItemOption): CardView {
  return itemToCardView(it);
}
function plotView(p: PlotItem): CardView {
  return dataToCardView(
    p.name,
    p.category,
    { 品质: p.品质, 境界: p.境界, 类型: p.类型, 五行: p.五行 },
    p.data,
  );
}
const STAT_SUFFIX: Record<string, string> = { 穿透: '%', 减免: '%' };
function customView(c: CustomItem): CardView {
  const stats: CardStat[] = [];
  const clsMap: Record<string, string> = {
    攻击力: 'atk', 防御力: 'def', 命中: 'hit', 闪避: 'hit',
    修行速度: 'spd', 遁速: 'spd', 灵气消耗: 'mana', 灵气容量: 'mana',
    穿透: 'buff', 减免: 'buff',
  };
  if (c.数值) {
    const order = ['攻击力', '防御力', '命中', '闪避', '穿透', '减免', '修行速度', '遁速', '灵气消耗', '灵气容量', '炼制难度'];
    for (const k of order) {
      const v = (c.数值 as any)[k];
      if (typeof v === 'number') stats.push({ label: k, value: `${v}${STAT_SUFFIX[k] || ''}`, cls: clsMap[k] || '' });
    }
  }
  const resources: { name: string; cur: number; max?: number }[] = [];
  if (c.资源池) {
    if (typeof c.资源池.气血 === 'number') resources.push({ name: '气血', cur: c.资源池.气血, max: c.资源池.气血 });
    if (typeof c.资源池.灵气 === 'number') resources.push({ name: '灵气', cur: c.资源池.灵气, max: c.资源池.灵气 });
    if (typeof c.资源池.遁速 === 'number') stats.push({ label: '遁', value: String(c.资源池.遁速), cls: 'spd' });
  }
  const effects = c.效果
    ? Object.entries(c.效果).map(([name, val]) => ({ name, val: String(val) }))
    : [];
  const skills = (c.技能 || []).map(s => ({
    name: s.name,
    攻击力: typeof s.攻击力 === 'number' ? String(s.攻击力) : undefined,
    消耗: s.消耗,
    效果: s.效果,
  }));
  return {
    name: c.name,
    category: c.category,
    类型: c.类型,
    品质: c.品质,
    境界: c.境界,
    五行: c.五行,
    数量: typeof c.数量 === 'number' && c.数量 > 1 ? c.数量 : undefined,
    stats,
    resources,
    descTags: [],
    effects,
    skills,
    desc: c.desc,
    消耗: c.消耗 && c.消耗 !== '无' ? c.消耗 : undefined,
    位置: c.位置 && c.位置 !== '储物袋' ? c.位置 : undefined,
  };
}
function costText(it: ItemOption): string {
  if (it.cost === 0) return '免费';
  if (it.cost < 0) return `+${-it.cost} 点`;
  return `${it.cost} 点`;
}

// —— 当前开局故事决定的大境界(决定了资材境界上限) ——
const REALM_RANK_MAP: Record<string, number> = {
  炼气: 1, 练气: 1, 筑基: 2, 金丹: 3, 元婴: 4, 化神: 5,
};
const playerRealmRank = computed<number>(() => {
  const id = store.selection.storyId;
  if (!id) return 1; // 未选剧本时默认炼气,允许低阶资材
  const custom = store.selection.customStory;
  const story = (custom && custom.id === id) ? customStoryToOption(custom) : findStory(id);
  const big = story?.settings?.初始境界?.大境界 ?? '炼气';
  return REALM_RANK_MAP[big] ?? 1;
});
function realmRankOf(realm: ItemRealm | undefined): number {
  if (!realm) return 0; // 无境界(灵石/通用工具)恒不超
  return REALM_RANK_MAP[realm] ?? 1;
}
function realmAllowed(it: ItemOption): boolean {
  return realmRankOf(it.境界) <= playerRealmRank.value;
}
function realmAllowedCustom(c: CustomItem): boolean {
  return realmRankOf(c.境界) <= playerRealmRank.value;
}
const realmCapLabel = computed<string>(() => {
  const r = playerRealmRank.value;
  return ITEM_REALMS[Math.max(0, Math.min(ITEM_REALMS.length - 1, r - 1))] ?? '炼气';
});
const allowedRealms = computed<ItemRealm[]>(() =>
  ITEM_REALMS.filter(r => realmRankOf(r) <= playerRealmRank.value),
);

// —— 进入本步骤时,清理已选/自创但超出当前境界上限的资材 ——
function pruneOverCapSelections() {
  const removed: string[] = [];
  // 预设资材
  const keepIds = store.selection.itemIds.filter(id => {
    const it = items.find(x => x.id === id);
    if (!it) return false;
    if (realmAllowed(it)) return true;
    removed.push(it.name);
    return false;
  });
  store.selection.itemIds = keepIds;
  // 自创资材
  const overCustom = store.selection.customItems.filter(c => !realmAllowedCustom(c));
  for (const c of overCustom) {
    store.removeCustomItem(c.id);
    removed.push(c.name);
  }
  if (removed.length) {
    store.showToast(`已移除超出境界上限的资材: ${removed.slice(0, 3).join('、')}${removed.length > 3 ? '…' : ''}`);
  }
  // 同步重置筛选(若当前境界筛选已超上限)
  if (realmFilter.value && !allowedRealms.value.includes(realmFilter.value as ItemRealm)) {
    realmFilter.value = '';
  }
}
onMounted(pruneOverCapSelections);
watch(playerRealmRank, pruneOverCapSelections);

// —— 筛选状态 ——
const realmFilter = ref<'' | ItemRealm>('');
const qualityFilter = ref<'' | ItemQuality>('');
const categoryFilter = ref<'' | ItemCategory>('');
const kindFilter = ref<'' | ItemKind>('');

const availableKinds = computed<ItemKind[]>(() => {
  if (!categoryFilter.value) return ALL_ITEM_KINDS;
  return ITEM_KINDS_BY_CATEGORY[categoryFilter.value];
});

const filteredItems = computed(() =>
  items.filter(it => {
    if (!realmAllowed(it)) return false; // 高于角色境界的资材直接隐藏
    if (realmFilter.value && it.境界 !== realmFilter.value) return false;
    if (qualityFilter.value && it.品质 !== qualityFilter.value) return false;
    if (categoryFilter.value && it.category !== categoryFilter.value) return false;
    if (kindFilter.value && it.类型 !== kindFilter.value) return false;
    return true;
  }),
);

const hasFilters = computed(
  () =>
    !!realmFilter.value ||
    !!qualityFilter.value ||
    !!categoryFilter.value ||
    !!kindFilter.value,
);

function onCategoryChange() {
  if (kindFilter.value && categoryFilter.value) {
    const allowed = ITEM_KINDS_BY_CATEGORY[categoryFilter.value];
    if (!allowed.includes(kindFilter.value as ItemKind)) {
      kindFilter.value = '';
    }
  }
}

function clearFilters() {
  realmFilter.value = '';
  qualityFilter.value = '';
  categoryFilter.value = '';
  kindFilter.value = '';
}

// —— 分页 ——
const PAGE_SIZE = 12;
const currentPage = ref(1);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredItems.value.length / PAGE_SIZE)),
);
const pageItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredItems.value.slice(start, start + PAGE_SIZE);
});
// 筛选条件变化时回到第 1 页
watch(filteredItems, () => {
  currentPage.value = 1;
});

function canAfford(it: ItemOption): boolean {
  if (store.isItemSelected(it.id)) return true;
  return it.cost <= store.remainingPoints;
}

// —— 自创资材编辑器 ——
const editorOpen = ref(false);
const editingId = ref<string | null>(null);

interface EffectPair { name: string; value: string }

interface Draft {
  name: string;
  desc: string;
  category: ItemCategory;
  类型: ItemKind;
  品质: ItemQuality;
  境界: ItemRealm;
  五行: string;
  /** 效果列表（仅当 类型 在 EFFECT_SUPPORTED_KINDS 时生效） */
  effects: EffectPair[];
  /** 顶层覆盖：消耗/位置/数量/攻击型/加成型/完整度/护体触发 */
  top: Record<string, any>;
  /** 数值覆盖（攻击力/防御力/命中/闪避/穿透/减免/...） */
  数值: Record<string, number | undefined>;
  /** 资源池覆盖（傀儡/灵兽：气血/灵气/遁速） */
  资源池: Record<string, number | undefined>;
  /** 技能列表（傀儡/灵兽） */
  技能: CustomSkill[];
}

const draft = reactive<Draft>({
  name: '',
  desc: '',
  category: '物品',
  类型: '丹药',
  品质: '黄',
  境界: '炼气',
  五行: '金',
  effects: [{ name: '', value: '' }],
  top: {},
  数值: {},
  资源池: {},
  技能: [],
});

const draftSupportsEffect = computed(() => EFFECT_SUPPORTED_KINDS.has(draft.类型));
const draftSupportsSkill = computed(() => SKILL_SUPPORTED_KINDS.has(draft.类型));

/** 当前类型的字段 schema */
const draftFields = computed<FieldDef[]>(() => FIELD_SCHEMAS[draft.类型] || []);

const draftL = computed(() => realmL(draft.境界));
const draftQ = computed(() => qualityQ(draft.品质));

/** 取字段值（按 group 路由到对应子对象） */
function getFieldValue(def: FieldDef): any {
  if (def.group === '数值') return draft.数值[def.key];
  if (def.group === '资源池') return draft.资源池[def.key];
  return draft.top[def.key];
}

/** 设字段值（按 group 路由） */
function setFieldValue(def: FieldDef, value: any) {
  if (def.group === '数值') {
    if (value === undefined || value === null || value === '') {
      delete draft.数值[def.key];
    } else {
      draft.数值[def.key] = value;
    }
  } else if (def.group === '资源池') {
    if (value === undefined || value === null || value === '') {
      delete draft.资源池[def.key];
    } else {
      draft.资源池[def.key] = value;
    }
  } else {
    if (value === undefined || value === null || value === '') {
      delete draft.top[def.key];
    } else {
      draft.top[def.key] = value;
    }
  }
}

/** 数值字段：input 事件处理 */
function onFieldNumberInput(def: FieldDef, e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  if (raw === '') {
    setFieldValue(def, undefined);
    return;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  setFieldValue(def, def.type === 'integer' ? Math.floor(n) : Math.max(0, Math.floor(n)));
}

/** 推荐区间缓存 */
function rangeFor(def: FieldDef): SuggestedRange | null {
  return computeSuggestedRange(def, draftL.value, draftQ.value);
}

/** 当前字段值是否超出推荐上限 */
function fieldOverflow(def: FieldDef): boolean {
  const v = getFieldValue(def);
  if (typeof v !== 'number') return false;
  return isOverRecommended(v, rangeFor(def));
}

function fieldHintText(def: FieldDef): string {
  const r = rangeFor(def);
  if (!r) return def.hint || '';
  const range = rangeHintText(r);
  return def.hint ? `${range} · ${def.hint}` : range;
}

/** string 字段动态 placeholder：placeholderCoef 优先，否则用静态 placeholder */
function stringPlaceholder(def: FieldDef): string {
  if (typeof def.placeholderCoef === 'number') {
    const n = Math.max(
      1,
      Math.floor(Math.pow(10, draftL.value) * def.placeholderCoef * (1 + draftQ.value)),
    );
    return `如:灵气${n}，留空则无消耗`;
  }
  return def.placeholder || '';
}

function resetDraft() {
  draft.name = '';
  draft.desc = '';
  draft.category = '物品';
  draft.类型 = '丹药';
  draft.品质 = '黄';
  draft.境界 = '炼气';
  draft.五行 = '金';
  draft.effects = [{ name: '', value: '' }];
  draft.top = {};
  draft.数值 = {};
  draft.资源池 = {};
  draft.技能 = [];
  seedDraftDefaults();
}

/** 按 schema 给未填字段填默认值 */
function seedDraftDefaults() {
  for (const def of draftFields.value) {
    if (def.default !== undefined && getFieldValue(def) === undefined) {
      setFieldValue(def, def.default);
    }
  }
}

function openCreate() {
  editingId.value = null;
  resetDraft();
  editorOpen.value = true;
}
function openEdit(c: CustomItem) {
  editingId.value = c.id;
  draft.name = c.name;
  draft.desc = c.desc || '';
  draft.category = c.category;
  draft.类型 = c.类型;
  draft.品质 = c.品质;
  draft.境界 = c.境界;
  draft.五行 = c.五行 || '金';
  draft.effects = c.效果
    ? Object.entries(c.效果).map(([name, value]) => ({ name, value }))
    : [{ name: '', value: '' }];
  if (draft.effects.length === 0) draft.effects = [{ name: '', value: '' }];
  // 数值 / 资源池
  draft.数值 = c.数值 ? { ...c.数值 } : {};
  draft.资源池 = c.资源池 ? { ...c.资源池 } : {};
  // 顶层
  draft.top = {};
  if (c.消耗) draft.top.消耗 = c.消耗;
  if (c.位置) draft.top.位置 = c.位置;
  if (typeof c.数量 === 'number') draft.top.数量 = c.数量;
  if (typeof c.攻击型 === 'boolean') draft.top.攻击型 = c.攻击型;
  if (typeof c.加成型 === 'boolean') draft.top.加成型 = c.加成型;
  if (c.完整度) draft.top.完整度 = c.完整度;
  if (c.护体触发) draft.top.护体触发 = c.护体触发;
  // 技能
  draft.技能 = Array.isArray(c.技能) ? c.技能.map(s => ({ ...s, 效果: s.效果 ? { ...s.效果 } : {} })) : [];
  seedDraftDefaults();
  editorOpen.value = true;
}
function closeEditor() {
  editorOpen.value = false;
  editingId.value = null;
}

function onDraftCategoryChange() {
  const kinds = ITEM_KINDS_BY_CATEGORY[draft.category];
  if (!kinds.includes(draft.类型)) {
    draft.类型 = kinds[0];
  }
}

/** 大类切换：连带触发 类型 变更后的 schema 清理 */
function onDraftCategoryChangeFull() {
  onDraftCategoryChange();
  onDraftKindChange();
}

/** 类型切换时：清空与新 schema 无关的数值字段，并填新 schema 的默认值 */
function onDraftKindChange() {
  // 删除不属于新 schema 的 数值/资源池/top 字段
  const allowedNum = new Set<string>();
  const allowedRp = new Set<string>();
  const allowedTop = new Set<string>();
  for (const def of draftFields.value) {
    if (def.group === '数值') allowedNum.add(def.key);
    else if (def.group === '资源池') allowedRp.add(def.key);
    else allowedTop.add(def.key);
  }
  for (const k of Object.keys(draft.数值)) {
    if (!allowedNum.has(k)) delete draft.数值[k];
  }
  for (const k of Object.keys(draft.资源池)) {
    if (!allowedRp.has(k)) delete draft.资源池[k];
  }
  for (const k of Object.keys(draft.top)) {
    if (!allowedTop.has(k)) delete draft.top[k];
  }
  // 不支持技能的类型清空 技能 列表
  if (!draftSupportsSkill.value) draft.技能 = [];
  seedDraftDefaults();
}

function addDraftEffect() {
  draft.effects.push({ name: '', value: '' });
}
function removeDraftEffect(idx: number) {
  if (idx < 0 || idx >= draft.effects.length) return;
  draft.effects.splice(idx, 1);
  if (draft.effects.length === 0) draft.effects.push({ name: '', value: '' });
}

const draftCost = computed(() =>
  computeCustomItemCost({ 品质: draft.品质, 境界: draft.境界 }),
);

const canSave = computed(() => {
  if (!draft.name.trim()) return false;
  if (editingId.value) {
    // 编辑时若涨价导致超支也允许保存（与游戏逻辑无关）
    return true;
  }
  return draftCost.value <= store.remainingPoints;
});

function onSave() {
  // —— 效果 —— //
  let 效果: Record<string, string> | undefined;
  if (draftSupportsEffect.value) {
    const valid = draft.effects
      .map(e => ({ name: e.name.trim(), value: e.value.trim() }))
      .filter(e => e.name);
    if (valid.length) {
      效果 = {};
      for (const e of valid) 效果[e.name] = e.value;
    }
  }
  // —— 数值 / 资源池：只保留有值的 —— //
  const 数值: Record<string, number> = {};
  for (const [k, v] of Object.entries(draft.数值)) {
    if (typeof v === 'number') 数值[k] = v;
  }
  const 资源池: Record<string, number> = {};
  for (const [k, v] of Object.entries(draft.资源池)) {
    if (typeof v === 'number') 资源池[k] = v;
  }
  // —— 技能：过滤无名技能 —— //
  const 技能 = draftSupportsSkill.value
    ? draft.技能
        .filter(s => s.name && s.name.trim())
        .map(s => ({ ...s, name: s.name.trim() }))
    : [];

  const payload: Omit<CustomItem, 'id'> = {
    name: draft.name.trim(),
    desc: draft.desc.trim() || undefined,
    category: draft.category,
    类型: draft.类型,
    品质: draft.品质,
    境界: draft.境界,
    五行: draft.五行,
    效果,
    数值: Object.keys(数值).length ? 数值 : undefined,
    资源池: Object.keys(资源池).length ? 资源池 : undefined,
    消耗: draft.top.消耗 || undefined,
    位置: draft.top.位置 || undefined,
    数量: typeof draft.top.数量 === 'number' ? draft.top.数量 : undefined,
    攻击型: typeof draft.top.攻击型 === 'boolean' ? draft.top.攻击型 : undefined,
    加成型: typeof draft.top.加成型 === 'boolean' ? draft.top.加成型 : undefined,
    完整度: draft.top.完整度 || undefined,
    护体触发: draft.top.护体触发 || undefined,
    技能: 技能.length ? 技能 : undefined,
  };
  if (editingId.value) {
    store.updateCustomItem(editingId.value, payload);
  } else {
    store.addCustomItem(payload);
  }
  closeEditor();
}

function customCost(c: CustomItem): number {
  return computeCustomItemCost({ 品质: c.品质, 境界: c.境界 });
}
</script>

<style scoped>
.xs-section-title {
  font-family: var(--xs-font-display);
  font-size: 16px;
  letter-spacing: 4px;
  color: var(--xs-ink);
  border-left: 3px solid var(--xs-cinnabar);
  padding-left: 8px;
}

.xs-inv-section { margin-bottom: 22px; }
/* 卡片操作插槽（自创：编辑/删除） */
.xs-mini-btn {
  padding: 2px 10px;
  font-size: 11px;
  letter-spacing: 1px;
}

.xs-realm-cap-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 14px;
  padding: 6px 12px;
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--xs-ink-soft);
  background: var(--xs-tint-cinnabar-faint, rgba(168, 153, 104, 0.08));
  border-left: 2px solid var(--xs-cinnabar, #a07f48);
  border-radius: 0 4px 4px 0;
}
.xs-realm-cap-hint b {
  color: var(--xs-cinnabar-deep, #a07f48);
  letter-spacing: 2px;
}

.xs-custom-section {
  margin-bottom: 22px;
}
.xs-custom-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.xs-custom-count {
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--xs-ink-mute);
}
.xs-custom-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 10px;
}
@media (min-width: 600px) {
  .xs-custom-list { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 880px) {
  .xs-custom-list { grid-template-columns: repeat(3, 1fr); }
}
.xs-custom-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px dashed var(--xs-cinnabar);
  border-radius: 10px;
  background: var(--xs-tint-cinnabar-faint);
}
.xs-custom-card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.xs-custom-card-name {
  font-family: var(--xs-font-display);
  font-size: 14px;
  letter-spacing: 2px;
  color: var(--xs-ink);
}
.xs-custom-card-cost {
  font-family: var(--xs-font-title);
  font-size: 14px;
  color: var(--xs-cinnabar);
  letter-spacing: 1px;
}
.xs-custom-card-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--xs-ink-soft);
}
.xs-custom-card-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.xs-custom-card-actions .xs-btn {
  padding: 4px 12px;
  font-size: 11px;
  letter-spacing: 2px;
}

.xs-custom-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px dashed var(--xs-cinnabar);
  border-radius: 10px;
  background: var(--xs-tint-cinnabar-faint);
  margin-top: 8px;
}
.xs-custom-edit-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.xs-custom-edit-row label {
  flex: 0 0 auto;
  min-width: 36px;
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
}
.xs-custom-edit-row input[type='text'] {
  flex: 1 1 200px;
  font-family: var(--xs-font-display);
  font-size: 13.5px;
  letter-spacing: 1.5px;
  background: var(--xs-paper-warm);
  border: 1px solid var(--xs-line-gold);
  padding: 6px 10px;
}
.xs-custom-edit-row input:focus,
.xs-custom-edit-row select:focus {
  border-color: var(--xs-cinnabar);
  outline: none;
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
}
.xs-custom-edit-row select {
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 1px;
  background: var(--xs-paper);
  border: 1px solid var(--xs-line-gold);
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--xs-ink);
}
/* —— schema 驱动字段 —— */
.xs-custom-edit-schema {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(168, 153, 104, 0.05);
  border-radius: 6px;
  border: 1px dashed rgba(160, 127, 72, 0.25);
}
.xs-schema-field {
  align-items: center;
}
.xs-schema-field input[type='number'] {
  flex: 0 0 110px;
  text-align: center;
  font-family: var(--xs-font-title);
  font-size: 14px;
  background: var(--xs-paper);
  border: 1px solid var(--xs-line-gold);
  padding: 5px 6px;
  border-radius: 4px;
}
.xs-schema-field input[type='number']:focus {
  border-color: var(--xs-cinnabar);
  outline: none;
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
}
.xs-schema-num-input.overflow,
.xs-schema-percent-wrap.overflow {
  border-color: #d69e2e;
  background: rgba(214, 158, 46, 0.08);
}
.xs-schema-percent-wrap {
  display: inline-flex;
  align-items: stretch;
  flex: 0 0 130px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 4px;
  background: var(--xs-paper);
  overflow: hidden;
}
.xs-schema-percent-wrap:focus-within {
  border-color: var(--xs-cinnabar);
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
}
.xs-schema-percent-wrap input {
  flex: 1 1 0;
  min-width: 0;
  border: none;
  background: transparent;
  text-align: center;
  font-family: var(--xs-font-title);
  font-size: 14px;
  padding: 5px 4px;
  outline: none;
}
.xs-schema-percent-suffix {
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  background: var(--xs-tint-gold-soft, rgba(168, 153, 104, 0.15));
  font-family: var(--xs-font-display);
  font-size: 12px;
  color: var(--xs-ink-mute);
  border-left: 1px solid var(--xs-line-gold);
}
.xs-schema-hint {
  font-size: 11px;
  letter-spacing: 0.5px;
  color: var(--xs-ink-mute);
}
.xs-schema-hint.warn {
  color: #b7791f;
  font-weight: 600;
}
.xs-schema-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 1px;
  color: var(--xs-ink);
  cursor: pointer;
}
.xs-schema-toggle-label input {
  width: auto;
  margin: 0;
  accent-color: var(--xs-cinnabar);
}

/* 技能编辑器外框：让 label 顶部对齐 */
.xs-custom-edit-skill-row {
  align-items: flex-start;
}
.xs-custom-edit-skill-row > label {
  padding-top: 8px;
}
.xs-custom-edit-skill-wrap {
  flex: 1 1 100%;
  min-width: 0;
}

.xs-custom-edit-effects {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.xs-custom-edit-effect-add {
  margin-top: 2px;
}
.xs-custom-edit-effect input.xs-effect-name-input {
  flex: 1 1 0;
  min-width: 120px;
}
.xs-custom-edit-effect input.xs-effect-desc-input {
  flex: 1.4 1 0;
  min-width: 160px;
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

.xs-custom-edit-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.xs-custom-cost-preview {
  flex: 1 1 auto;
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 1px;
  color: var(--xs-cinnabar);
}

.xs-preset-section .xs-section-title {
  margin-bottom: 10px;
}

.xs-inv-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 10px;
  background: var(--xs-paper-warm);
  margin-bottom: 14px;
}
.xs-inv-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.xs-inv-filter-label {
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
}
.xs-inv-filter select {
  font-family: var(--xs-font-display);
  font-size: 13px;
  letter-spacing: 1.5px;
  background: var(--xs-paper);
  border: 1px solid var(--xs-line-gold);
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--xs-ink);
}
.xs-inv-filter select:focus {
  border-color: var(--xs-cinnabar);
  outline: none;
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
}
.xs-inv-clear {
  padding: 4px 12px;
  font-size: 11.5px;
  letter-spacing: 2px;
}
.xs-inv-count {
  margin-left: auto;
  font-size: 11.5px;
  letter-spacing: 1px;
  color: var(--xs-ink-mute);
}
.xs-inv-meta {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

/* —— 卡片扩展区:数值/效果/标签/位置 —— */
.xs-inv-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}
.xs-stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: var(--xs-paper-warm);
  border: 1px solid var(--xs-line-gold);
  color: var(--xs-ink);
}
.xs-stat-chip.xs-stat-attack {
  background: linear-gradient(135deg, rgba(229, 62, 62, 0.10), rgba(197, 48, 48, 0.06));
  border-color: rgba(197, 48, 48, 0.30);
  color: #b03030;
}
.xs-stat-chip.xs-stat-defense {
  background: linear-gradient(135deg, rgba(66, 153, 225, 0.10), rgba(44, 82, 130, 0.06));
  border-color: rgba(44, 82, 130, 0.30);
  color: #2c5282;
}
.xs-stat-chip.xs-stat-hp {
  background: linear-gradient(135deg, rgba(245, 101, 101, 0.10), rgba(155, 44, 44, 0.06));
  border-color: rgba(155, 44, 44, 0.28);
  color: #9b2c2c;
}
.xs-stat-chip.xs-stat-speed {
  background: linear-gradient(135deg, rgba(56, 161, 105, 0.10), rgba(47, 133, 90, 0.06));
  border-color: rgba(47, 133, 90, 0.28);
  color: #2f855a;
}
.xs-stat-chip.xs-stat-cult {
  background: linear-gradient(135deg, rgba(214, 158, 46, 0.12), rgba(183, 121, 31, 0.08));
  border-color: rgba(183, 121, 31, 0.32);
  color: #b7791f;
}
.xs-stat-chip.xs-stat-mana {
  background: linear-gradient(135deg, rgba(99, 179, 237, 0.10), rgba(43, 108, 176, 0.06));
  border-color: rgba(43, 108, 176, 0.30);
  color: #2b6cb0;
}
.xs-stat-chip.xs-stat-heal {
  background: linear-gradient(135deg, rgba(159, 122, 234, 0.10), rgba(85, 60, 154, 0.06));
  border-color: rgba(85, 60, 154, 0.28);
  color: #6b46c1;
}
.xs-stat-chip.xs-stat-bonus {
  background: linear-gradient(135deg, rgba(72, 187, 120, 0.10), rgba(38, 132, 70, 0.06));
  border-color: rgba(38, 132, 70, 0.28);
  color: #276749;
}
.xs-stat-chip.xs-stat-qty {
  font-family: var(--xs-font-display, 'Cinzel', serif);
}
.xs-stat-chip.xs-stat-active {
  background: linear-gradient(135deg, #38a169, #2f855a);
  color: #fff;
  border-color: #2f855a;
}

.xs-inv-effects {
  margin-top: 6px;
  padding: 5px 8px;
  background: rgba(168, 153, 104, 0.08);
  border-left: 2px solid var(--xs-cinnabar, #a07f48);
  border-radius: 0 4px 4px 0;
  font-size: 11.5px;
  line-height: 1.55;
  text-align: left;
}
.xs-inv-effect-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.xs-inv-effect-name {
  color: var(--xs-cinnabar-deep, #a07f48);
  font-weight: 700;
  flex-shrink: 0;
}
.xs-inv-effect-val {
  color: var(--xs-ink, #3a2f24);
}

.xs-inv-skills {
  margin-top: 6px;
  padding: 5px 8px;
  background: rgba(160, 127, 72, 0.06);
  border-left: 2px solid var(--xs-cinnabar-deep, #a07f48);
  border-radius: 0 4px 4px 0;
  font-size: 11.5px;
  text-align: left;
}
.xs-inv-skills-head {
  font-family: var(--xs-font-display);
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--xs-cinnabar-deep, #a07f48);
  margin-bottom: 3px;
}
.xs-inv-skill-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  margin-bottom: 2px;
  line-height: 1.5;
}
.xs-inv-skill-name {
  font-weight: 700;
  color: var(--xs-ink, #3a2f24);
}
.xs-inv-skill-cost {
  font-size: 11px;
  color: var(--xs-ink-mute, #5a4a36);
}
.xs-inv-skill-eff {
  font-size: 11px;
  color: var(--xs-ink-soft, #4a3d2c);
}
.xs-inv-skill-eff > span {
  margin-right: 4px;
}

.xs-inv-tagrow {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 5px;
}
.xs-inv-tag {
  padding: 1px 7px;
  border-radius: 4px;
  background: rgba(168, 153, 104, 0.12);
  border: 1px dashed rgba(160, 127, 72, 0.35);
  color: var(--xs-ink-mute, #5a4a36);
  font-size: 11px;
  letter-spacing: 0.4px;
}

.xs-inv-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 5px;
  font-size: 11px;
  color: var(--xs-ink-mute, #5a4a36);
}
.xs-inv-foot-item {
  opacity: 0.85;
}
.xs-inv-foot-item.xs-inv-loc {
  color: var(--xs-cinnabar-deep, #a07f48);
  font-weight: 600;
}

/* —— 分页 —— */
.xs-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.xs-pager-btn {
  padding: 4px 12px;
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  border: 1px solid var(--xs-line-gold);
  border-radius: 14px;
  background: var(--xs-paper-warm);
  color: var(--xs-ink);
  transition: all 0.18s ease;
}
.xs-pager-btn:hover:not(:disabled) {
  background: var(--xs-cinnabar);
  border-color: var(--xs-cinnabar-deep);
  color: #fff;
}
.xs-pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.xs-pager-info {
  font-family: var(--xs-font-display);
  font-size: 12.5px;
  letter-spacing: 2px;
  color: var(--xs-ink-mute);
  margin: 0 8px;
}

/* —— 剧情物品：独立配色（毒紫），与普通资材明显区分 —— */
.xs-plot-section {
  margin-bottom: 22px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(124, 58, 143, 0.45);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(124, 58, 143, 0.10), rgba(124, 58, 143, 0.03));
}
.xs-plot-title {
  border-left-color: #7c3a8f;
}
.xs-plot-note {
  font-size: 12px;
  letter-spacing: 1px;
  color: #7c3a8f;
}
.xs-plot-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 10px;
}
@media (min-width: 600px) {
  .xs-plot-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 880px) {
  .xs-plot-grid { grid-template-columns: repeat(3, 1fr); }
}
.xs-plot-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 14px;
  border: 1px solid rgba(124, 58, 143, 0.5);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(124, 58, 143, 0.14), rgba(124, 58, 143, 0.05));
  box-shadow: 0 0 0 1px rgba(124, 58, 143, 0.25) inset, 0 6px 18px -10px rgba(124, 58, 143, 0.5);
  overflow: hidden;
}
.xs-plot-glyph {
  position: absolute;
  right: 8px;
  bottom: 2px;
  font-family: var(--xs-font-display);
  font-size: 42px;
  line-height: 1;
  color: rgba(124, 58, 143, 0.14);
  pointer-events: none;
  user-select: none;
}
.xs-plot-card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.xs-plot-name {
  font-family: var(--xs-font-display);
  font-size: 15px;
  letter-spacing: 2px;
  color: var(--xs-ink);
}
.xs-plot-lock {
  flex: 0 0 auto;
  font-size: 11px;
  letter-spacing: 0.5px;
  color: #7c3a8f;
  font-weight: 700;
}
.xs-plot-pill {
  background: #7c3a8f;
  border-color: #6a2f7c;
  color: #fff;
}
.xs-plot-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--xs-ink-soft);
  position: relative;
  z-index: 1;
}
</style>
