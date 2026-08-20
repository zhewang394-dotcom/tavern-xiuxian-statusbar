<template>
  <div>
    <h2 class="xs-step-title">命途 · 落定</h2>
    <p class="xs-step-subtitle">最后核对你的选择；点击「确认开局」后将组装为初始变量。</p>

    <div class="xs-name-row">
      <label>道号</label>
      <input
        v-model="store.selection.道号"
        type="text"
        class="xs-name-input"
        placeholder="为自己取一个名字"
      />
    </div>

    <div class="xs-summary">
      <div class="xs-summary-row" v-if="difficulty">
        <span class="xs-summary-label">难度</span>
        <span class="xs-summary-value">
          <strong>{{ difficulty.name }}</strong>
          <span style="color: var(--xs-ink-mute);">{{ difficulty.subtitle }} · 共 {{ difficulty.points }} 点</span>
        </span>
      </div>
      <div class="xs-summary-row" v-if="store.rootChosen">
        <span class="xs-summary-label">灵根</span>
        <span class="xs-summary-value">
          <strong>{{ rootName }}</strong>
          <span style="color: var(--xs-ink-mute);">{{ rootTier }} · {{ rootElements.join(' / ') }}</span>
        </span>
      </div>
      <div class="xs-summary-row" v-if="store.physiqueChosen">
        <span class="xs-summary-label">体质</span>
        <span class="xs-summary-value">
          <strong>{{ physique.name }}</strong>
          <span style="color: var(--xs-ink-mute);">
            {{ physique.tier }} · 悟 {{ physique.悟性 }} · 骨 {{ physique.根骨 }} · 感 {{ physique.气感 }}
            <template v-for="(eff, idx) in physique.效果s" :key="idx"> · {{ eff.name }} {{ eff.value }}</template>
          </span>
        </span>
      </div>
      <div class="xs-summary-row">
        <span class="xs-summary-label">阴阳</span>
        <span class="xs-summary-value">
          <strong>{{ store.selection.性别 }}</strong>
          <span style="color: var(--xs-ink-mute);">
            {{ store.selection.性别 === '男' ? '元阳' : '元阴' }}：{{ store.selection.元阳元阴 ? '尚存' : '已损' }}
          </span>
        </span>
      </div>
      <div class="xs-summary-row" v-if="location">
        <span class="xs-summary-label">出生地</span>
        <span class="xs-summary-value">
          <strong>{{ location.name }}</strong>
          <span style="color: var(--xs-ink-mute);">{{ location.世界 }} · {{ location.地域 }} · {{ location.生态 }}</span>
        </span>
      </div>
      <div class="xs-summary-row">
        <span class="xs-summary-label">身份</span>
        <span class="xs-summary-value">
          <strong>{{ 身份文本 }}</strong>
        </span>
      </div>
      <div class="xs-summary-row">
        <span class="xs-summary-label">资材</span>
        <span class="xs-summary-value">
          <span
            v-if="store.selection.itemIds.length === 0 && store.selection.customItems.length === 0 && plotItems.length === 0"
            style="color: var(--xs-ink-mute);"
          >未择资材</span>
          <template v-else>
            <span v-for="it in selectedItems" :key="it.id" style="margin-right: 8px;">
              <strong>{{ it.name }}</strong>
            </span>
            <span
              v-for="c in store.selection.customItems"
              :key="c.id"
              style="margin-right: 8px;"
              :title="`${c.品质}品 · ${c.境界} · ${c.类型}（自创）`"
            >
              <strong style="color: var(--xs-cinnabar-deep);">{{ c.name }}</strong>
            </span>
            <span
              v-for="p in plotItems"
              :key="p.id"
              style="margin-right: 8px;"
              :title="`${p.类型}（剧情物品 · 固定携带）`"
            >
              <strong style="color: #7c3a8f;">{{ p.name }}</strong>
            </span>
          </template>
        </span>
      </div>
      <div class="xs-summary-row" v-if="story">
        <span class="xs-summary-label">故事</span>
        <span class="xs-summary-value">
          <strong>{{ story.name }}</strong>
          <span style="color: var(--xs-ink-mute);">
            {{ story.subtitle || '' }}
            <template v-if="story.settings"> · {{ story.settings.宗门 }} · {{ story.settings.初始境界.大境界 }}{{ story.settings.初始境界.小境界 }} · {{ story.settings.时间.年 }}年</template>
          </span>
        </span>
      </div>
      <div class="xs-summary-row">
        <span class="xs-summary-label">点数</span>
        <span class="xs-summary-value">
          <strong :style="{ color: store.overBudget ? 'var(--xs-cinnabar)' : 'var(--xs-jade-deep)' }">
            {{ store.spentPoints }} / {{ store.totalPoints }}
          </strong>
          <span style="color: var(--xs-ink-mute);">
            {{ store.overBudget ? '超出预算！' : '余 ' + store.remainingPoints + ' 点' }}
          </span>
        </span>
      </div>
    </div>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button type="button" class="xs-btn xs-btn-ghost" @click="store.resetAll()">重新开始</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="!canConfirm"
        @click="onConfirm"
      >
        确认开局 ▸
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  customStoryToOption,
  findDifficulty,
  findItem,
  findLocation,
  findStory,
  physiqueResolved,
  plotItemsForStory,
  rootDisplayName,
  rootTierLabel,
} from '../config';
import { useStartStore } from '../store';
import { commitJourney } from '../export';

const store = useStartStore();

const difficulty = computed(() => findDifficulty(store.selection.difficultyId));
const rootName = computed(() => rootDisplayName(store.selection.root));
const rootTier = computed(() => rootTierLabel(store.selection.root));
const rootElements = computed(() => store.selection.root.elements);
const physique = computed(() => physiqueResolved(store.selection.physique));
const location = computed(() => findLocation(store.selection.locationId));
const story = computed(() => {
  const id = store.selection.storyId;
  if (!id) return undefined;
  const custom = store.selection.customStory;
  if (custom && custom.id === id) return customStoryToOption(custom);
  return findStory(id);
});
const selectedItems = computed(() =>
  store.selection.itemIds.map(id => findItem(id)).filter(Boolean) as NonNullable<ReturnType<typeof findItem>>[],
);
const plotItems = computed(() => plotItemsForStory(store.selection.storyId));
const 身份文本 = computed(() => {
  const mp = (store.selection.门派归属 || '').trim();
  if (mp === '散修') return '散修';
  if (mp) return `${mp}弟子`;
  return '无';
});

const canConfirm = computed(() => {
  return (
    !store.overBudget &&
    !!store.selection.difficultyId &&
    store.rootChosen &&
    store.physiqueChosen &&
    !!store.selection.locationId &&
    !!store.selection.storyId &&
    !!store.selection.道号.trim()
  );
});

async function onConfirm() {
  if (!canConfirm.value) {
    if (!store.selection.道号.trim()) store.showToast('请先填写道号');
    else if (store.overBudget) store.showToast('点数超出预算');
    else store.showToast('请先完成所有选择');
    return;
  }
  store.showToast('命途落定中…');
  const res = await commitJourney(store.selection);
  if (res.ok) {
    store.showToast(res.reason || '命途已落定，AI 将为你生成开局剧情');
  } else {
    store.showToast(res.reason || '提交失败，请检查酒馆接口');
  }
}
</script>
