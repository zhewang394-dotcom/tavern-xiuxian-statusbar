<template>
  <div>
    <h2 class="xs-step-title">择 · 开局故事</h2>
    <p class="xs-step-subtitle">道始于一场际遇。开局故事不耗费点数，但会写入开局时间、宗门归属与初始境界。</p>

    <!-- 自创剧本（最多一篇） -->
    <section class="xs-custom-section">
      <div class="xs-custom-head">
        <h3 class="xs-section-title">自创剧本</h3>
        <span class="xs-custom-count">
          {{ store.selection.customStory ? '已自创 1 篇' : '尚未自创' }}
        </span>
        <button
          v-if="!editorOpen && !store.selection.customStory"
          type="button"
          class="xs-btn xs-btn-ghost"
          @click="openCreate()"
        >
          + 添加自创剧本
        </button>
      </div>

      <!-- 自创卡片 -->
      <div v-if="store.selection.customStory && !editorOpen" class="xs-custom-list">
        <button
          type="button"
          class="xs-story-card xs-story-card-custom"
          :class="{ active: store.selection.storyId === store.selection.customStory.id }"
          @click="selectCustom"
        >
          <div class="xs-story-head">
            <span class="xs-story-name">{{ store.selection.customStory.name }}</span>
            <span class="xs-pill xs-pill-cinnabar">自创</span>
            <span v-if="customKind" class="xs-pill">{{ customKind }}</span>
          </div>
          <p v-if="store.selection.customStory.desc" class="xs-story-desc">
            {{ store.selection.customStory.desc }}
          </p>
          <div class="xs-story-settings">
            <span v-for="(line, idx) in describeSettings(store.selection.customStory.settings)" :key="idx">
              {{ line }}
            </span>
          </div>
          <div
            v-if="store.selection.storyId === store.selection.customStory.id"
            class="xs-story-body"
          >{{ store.selection.customStory.body }}</div>
          <div class="xs-story-card-actions">
            <button type="button" class="xs-btn xs-btn-ghost" @click.stop="openEdit">编辑</button>
            <button type="button" class="xs-btn xs-btn-ghost" @click.stop="store.clearCustomStory()">删除</button>
          </div>
        </button>
      </div>

      <!-- 编辑器 -->
      <div v-if="editorOpen" class="xs-custom-editor">
        <div class="xs-custom-edit-row">
          <label>名号</label>
          <input
            type="text"
            v-model="draft.name"
            maxlength="24"
            placeholder="为这段开局命名"
          />
        </div>
        <div class="xs-custom-edit-row">
          <label>简述</label>
          <input
            type="text"
            v-model="draft.desc"
            maxlength="80"
            placeholder="一句话概括这段开局（可空）"
          />
        </div>
        <div class="xs-custom-edit-row xs-edit-time">
          <label>时间</label>
          <input type="number" min="7000" v-model.number="draft.year" /> 年
          <input type="number" min="1" max="12" v-model.number="draft.month" /> 月
          <input type="number" min="1" max="30" v-model.number="draft.day" /> 日
          <input type="text" v-model="draft.shichen" placeholder="时辰" maxlength="6" />
        </div>
        <div class="xs-custom-edit-row">
          <label>宗门</label>
          <input
            type="text"
            v-model="draft.sect"
            maxlength="20"
            placeholder="宗门或'散修'"
          />
        </div>
        <div class="xs-custom-edit-row">
          <label>境界</label>
          <select v-model="draft.bigRealm">
            <option v-for="r in BIG_REALMS" :key="r" :value="r">{{ r }}</option>
          </select>
          <select v-model="draft.smallRealm">
            <option v-for="r in SMALL_REALMS" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="xs-custom-edit-row xs-edit-body">
          <label>正文</label>
          <textarea
            v-model="draft.body"
            rows="6"
            placeholder="开局正文（直接以「你」指代主角）"
          />
        </div>
        <div class="xs-custom-edit-actions">
          <span class="xs-custom-warn" v-if="!yearOk">时间需 ≥ 7000 年</span>
          <button type="button" class="xs-btn xs-btn-ghost" @click="closeEditor">取消</button>
          <button
            type="button"
            class="xs-btn xs-btn-primary"
            :disabled="!canSave"
            @click="onSave"
          >
            {{ store.selection.customStory ? '保存改动' : '加入' }}
          </button>
        </div>
      </div>
    </section>

    <!-- 筛选 -->
    <section class="xs-preset-section">
      <h3 class="xs-section-title">预设剧本</h3>
      <div class="xs-inv-filters">
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">类型</span>
          <select v-model="kindFilter">
            <option value="">全部</option>
            <option value="宗门">宗门</option>
            <option value="散修">散修</option>
            <option value="特殊">特殊</option>
          </select>
        </div>
        <div class="xs-inv-filter">
          <span class="xs-inv-filter-label">仅可选</span>
          <input type="checkbox" v-model="onlyAvailable" />
        </div>
        <button v-if="hasFilters" type="button" class="xs-btn xs-btn-ghost xs-inv-clear" @click="clearFilters">
          清空筛选
        </button>
        <span class="xs-inv-count">显示 {{ filteredStories.length }} / {{ stories.length }}</span>
      </div>

      <div v-if="filteredStories.length === 0" class="xs-empty">未匹配到任何剧本</div>
      <div v-else>
        <div class="xs-story-list">
          <button
            v-for="s in pageStories"
            :key="s.id"
            type="button"
            class="xs-story-card"
            :class="{
              active: store.selection.storyId === s.id,
              disabled: !storyAvailable(s),
              'xs-story-card-plot': s.剧情,
            }"
            :disabled="!storyAvailable(s)"
            @click="storyAvailable(s) && store.selectStory(s.id)"
          >
            <div class="xs-story-head">
              <span v-if="s.剧情" class="xs-pill xs-pill-plot">★ 剧情</span>
              <span class="xs-story-name">{{ s.name }}</span>
              <span v-if="s.类型" class="xs-pill xs-pill-jade">{{ s.类型 }}</span>
              <span v-if="s.recommend" class="xs-pill xs-pill-cinnabar">推荐：{{ s.recommend }}</span>
              <span v-for="t in s.tags || []" :key="t" class="xs-pill xs-pill-gold">{{ t }}</span>
            </div>
            <p v-if="s.subtitle" class="xs-story-sub">{{ s.subtitle }}</p>
            <p v-if="s.desc" class="xs-story-desc">{{ s.desc }}</p>
            <div class="xs-story-settings">
              <span v-for="(line, idx) in describeSettings(s.settings)" :key="idx">{{ line }}</span>
            </div>
            <div v-if="s.constraints" class="xs-story-constraints">
              <span class="xs-pill" v-for="(line, idx) in describeConstraints(s.constraints)" :key="idx">
                {{ line }}
              </span>
            </div>
            <div v-if="store.selection.storyId === s.id" class="xs-story-body">{{ s.body }}</div>
            <div v-if="!storyAvailable(s)" class="xs-story-blocked-block">
              <span class="xs-story-blocked-title">条件未满足</span>
              <ul class="xs-story-blocked-reasons">
                <li v-for="(r, idx) in whyUnavailable(s)" :key="idx">{{ r }}</li>
              </ul>
            </div>
          </button>
        </div>

        <!-- 分页：4 篇 / 页 -->
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
        :disabled="!hasValidSelectedStory || store.overBudget"
        @click="store.next"
      >
        继续 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { CustomStory, StoryKind, StoryOption, SmallRealm } from '../types';
import {
  BIG_REALMS,
  SMALL_REALMS,
  deriveCustomStoryKind,
  describeConstraints,
  describeSettings,
  isCustomStoryValid,
  isStoryAvailable,
  stories,
  whyStoryUnavailable,
} from '../config';
import { useStartStore } from '../store';

const store = useStartStore();

// —— 筛选 ——
const kindFilter = ref<'' | StoryKind>('');
const onlyAvailable = ref(false);

const _storyOrder = new Map(stories.map((s, i) => [s.id, i]));
const filteredStories = computed(() => {
  const list = stories.filter(s => {
    if (kindFilter.value && s.类型 !== kindFilter.value) return false;
    if (onlyAvailable.value && !isStoryAvailable(s, store.selection)) return false;
    return true;
  });
  // 排序：可选剧本置顶；可选剧本内，剧情剧本再置顶；其余保持原序
  return list.slice().sort((a, b) => {
    const aAvail = isStoryAvailable(a, store.selection);
    const bAvail = isStoryAvailable(b, store.selection);
    if (aAvail !== bAvail) return aAvail ? -1 : 1;
    if (aAvail) {
      const aPlot = !!a.剧情;
      const bPlot = !!b.剧情;
      if (aPlot !== bPlot) return aPlot ? -1 : 1;
    }
    return (_storyOrder.get(a.id) ?? 0) - (_storyOrder.get(b.id) ?? 0);
  });
});

const hasFilters = computed(() => !!kindFilter.value || onlyAvailable.value);

function clearFilters() {
  kindFilter.value = '';
  onlyAvailable.value = false;
}

function storyAvailable(s: StoryOption): boolean {
  return isStoryAvailable(s, store.selection);
}
function whyUnavailable(s: StoryOption): string[] {
  return whyStoryUnavailable(s, store.selection);
}

// —— 分页 ——
const PAGE_SIZE = 4;
const currentPage = ref(1);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredStories.value.length / PAGE_SIZE)),
);
const pageStories = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredStories.value.slice(start, start + PAGE_SIZE);
});
watch(filteredStories, () => {
  currentPage.value = 1;
});

const hasValidSelectedStory = computed(() => {
  const id = store.selection.storyId;
  if (!id) return false;
  if (store.selection.customStory && store.selection.customStory.id === id) return true;
  const s = stories.find(x => x.id === id);
  if (!s) return false;
  return isStoryAvailable(s, store.selection);
});

// 自创剧本不设「分类」；卡片上按宗门字段推导展示（散修→散修，其余→宗门）
const customKind = computed(() =>
  store.selection.customStory
    ? deriveCustomStoryKind(store.selection.customStory.settings.宗门)
    : '',
);

// —— 自创剧本编辑器 ——
const editorOpen = ref(false);

interface Draft {
  name: string;
  desc: string;
  body: string;
  year: number;
  month: number;
  day: number;
  shichen: string;
  sect: string;
  bigRealm: string;
  smallRealm: SmallRealm;
}

const draft = reactive<Draft>({
  name: '',
  desc: '',
  body: '',
  year: 7200,
  month: 1,
  day: 1,
  shichen: '辰时',
  sect: '散修',
  bigRealm: '炼气',
  smallRealm: '初期',
});

function resetDraft() {
  draft.name = '';
  draft.desc = '';
  draft.body = '';
  draft.year = 7200;
  draft.month = 1;
  draft.day = 1;
  draft.shichen = '辰时';
  draft.sect = '散修';
  draft.bigRealm = '炼气';
  draft.smallRealm = '初期';
}

function openCreate() {
  resetDraft();
  editorOpen.value = true;
}
function openEdit() {
  const c = store.selection.customStory;
  if (!c) return;
  draft.name = c.name;
  draft.desc = c.desc || '';
  draft.body = c.body;
  draft.year = c.settings.时间.年;
  draft.month = c.settings.时间.月;
  draft.day = c.settings.时间.日;
  draft.shichen = c.settings.时间.时辰 || '';
  draft.sect = c.settings.宗门;
  draft.bigRealm = c.settings.初始境界.大境界;
  draft.smallRealm = c.settings.初始境界.小境界;
  editorOpen.value = true;
}
function closeEditor() {
  editorOpen.value = false;
}

const yearOk = computed(() => draft.year >= 7000);

const canSave = computed(() => {
  const built: CustomStory = {
    id: 'tmp',
    name: draft.name.trim(),
    desc: draft.desc.trim() || undefined,
    body: draft.body.trim(),
    类型: deriveCustomStoryKind(draft.sect),
    settings: {
      时间: {
        年: draft.year,
        月: draft.month,
        日: draft.day,
        时辰: draft.shichen.trim() || undefined,
      },
      宗门: draft.sect.trim(),
      初始境界: { 大境界: draft.bigRealm.trim(), 小境界: draft.smallRealm },
    },
  };
  return isCustomStoryValid(built);
});

function onSave() {
  const created = store.setCustomStory({
    name: draft.name.trim(),
    desc: draft.desc.trim() || undefined,
    body: draft.body.trim(),
    类型: deriveCustomStoryKind(draft.sect),
    settings: {
      时间: {
        年: draft.year,
        月: draft.month,
        日: draft.day,
        时辰: draft.shichen.trim() || undefined,
      },
      宗门: draft.sect.trim(),
      初始境界: { 大境界: draft.bigRealm.trim(), 小境界: draft.smallRealm },
    },
  });
  store.selectStory(created.id);
  closeEditor();
}

function selectCustom() {
  if (store.selection.customStory) {
    store.selectStory(store.selection.customStory.id);
  }
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
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}
.xs-custom-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px dashed var(--xs-cinnabar);
  border-radius: 10px;
  background: var(--xs-tint-cinnabar-faint);
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
.xs-custom-edit-row input[type='text'],
.xs-custom-edit-row textarea {
  flex: 1 1 200px;
  font-family: var(--xs-font-display);
  font-size: 13.5px;
  letter-spacing: 1.5px;
  background: var(--xs-paper-warm);
  border: 1px solid var(--xs-line-gold);
  padding: 6px 10px;
}
.xs-edit-body textarea {
  flex: 1 1 100%;
  font-family: var(--xs-font-body);
  resize: vertical;
  line-height: 1.7;
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
.xs-custom-edit-row input:focus,
.xs-custom-edit-row textarea:focus,
.xs-custom-edit-row select:focus {
  border-color: var(--xs-cinnabar);
  outline: none;
  box-shadow: 0 0 0 3px var(--xs-tint-cinnabar-strong);
}
.xs-edit-time input[type='number'] {
  width: 80px;
  font-family: var(--xs-font-title);
  font-size: 14px;
  text-align: center;
  background: var(--xs-paper-warm);
  border: 1px solid var(--xs-line-gold);
  padding: 4px 6px;
  border-radius: 4px;
}
.xs-custom-edit-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.xs-custom-warn {
  flex: 1 1 auto;
  font-size: 12px;
  color: var(--xs-cinnabar);
  letter-spacing: 1px;
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

/* —— 故事卡片 —— */
.xs-story-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.xs-story-card {
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
.xs-story-card:hover:not(.active):not(.disabled) {
  border-color: var(--xs-gold);
  transform: translateY(-2px);
  box-shadow: var(--xs-shadow);
}
.xs-story-card.active {
  border-color: var(--xs-cinnabar);
  background: linear-gradient(180deg, var(--xs-tint-cinnabar-soft), var(--xs-glass-strong));
  box-shadow: 0 0 0 1px var(--xs-cinnabar) inset, 0 8px 24px -10px var(--xs-cinnabar-glow);
}
.xs-story-card.disabled {
  cursor: not-allowed;
  opacity: 0.55;
  filter: grayscale(0.3);
}
.xs-story-card-custom {
  border-style: dashed;
}
/* —— 剧情剧本：毒紫特殊样式（与剧情物品呼应） —— */
.xs-story-card-plot {
  border-color: rgba(124, 58, 143, 0.55);
  background:
    linear-gradient(180deg, rgba(124, 58, 143, 0.10), var(--xs-glass));
  box-shadow: 0 0 0 1px rgba(124, 58, 143, 0.2) inset;
}
.xs-story-card-plot:hover:not(.active):not(.disabled) {
  border-color: #7c3a8f;
  box-shadow: 0 8px 22px -12px rgba(124, 58, 143, 0.6);
}
.xs-story-card-plot.active {
  border-color: #7c3a8f;
  background: linear-gradient(180deg, rgba(124, 58, 143, 0.18), var(--xs-glass-strong));
  box-shadow: 0 0 0 1px #7c3a8f inset, 0 8px 24px -10px rgba(124, 58, 143, 0.6);
}
.xs-pill-plot {
  background: #7c3a8f;
  border-color: #6a2f7c;
  color: #fff;
  letter-spacing: 1px;
}
.xs-story-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.xs-story-name {
  font-family: var(--xs-font-display);
  font-size: 16px;
  letter-spacing: 3px;
  color: var(--xs-ink);
}
.xs-story-sub {
  font-size: 12px;
  color: var(--xs-ink-mute);
  letter-spacing: 1px;
}
.xs-story-desc {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--xs-ink-soft);
}
.xs-story-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.xs-story-settings span {
  font-size: 11.5px;
  padding: 2px 8px;
  border-radius: 8px;
  background: var(--xs-tint-jade-mid);
  color: var(--xs-jade-deep);
  letter-spacing: 0.5px;
}
.xs-story-constraints {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.xs-story-body {
  white-space: pre-wrap;
  line-height: 2;
  font-size: 13px;
  color: var(--xs-ink-soft);
  padding: 8px 12px;
  background: var(--xs-tint-ink-soft);
  border-left: 3px solid var(--xs-gold);
  border-radius: 4px;
  margin-top: 8px;
}
.xs-story-blocked-block {
  margin-top: 4px;
  padding: 6px 10px;
  border: 1px dashed var(--xs-cinnabar);
  border-radius: 6px;
  background: var(--xs-tint-cinnabar-soft);
}
.xs-story-blocked-title {
  font-family: var(--xs-font-display);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--xs-cinnabar);
}
.xs-story-blocked-reasons {
  list-style: '· ' inside;
  padding-left: 4px;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--xs-cinnabar-deep);
}
.xs-story-card-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.xs-story-card-actions .xs-btn {
  padding: 4px 12px;
  font-size: 11px;
  letter-spacing: 2px;
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
</style>
