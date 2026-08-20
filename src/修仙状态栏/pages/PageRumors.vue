<template>
  <section class="xy-page xy-page-rumors">
    <div v-if="activeTimelineEvents.length === 0" class="xy-empty">
      <div class="xy-empty-mark">寂</div>
      <p>风平浪静，未闻新事</p>
    </div>

    <div v-else class="xy-rumor-list">
      <article
        v-for="(r, i) in activeTimelineEvents"
        :key="i"
        class="xy-rumor"
      >
        <div class="xy-rumor-head">
          <div class="xy-rumor-seal">
            <span>{{ r.类别 }}</span>
          </div>
          <div class="xy-rumor-meta">
            <div class="xy-rumor-time">{{ formatRange(r.时间区间) }}</div>
            <div class="xy-rumor-source">— {{ r.地点 || '不知何处' }}</div>
          </div>
          <div class="xy-rumor-difficulty" :title="`适配境界：${r.难度}`">
            <i>难</i>{{ r.难度 }}
          </div>
        </div>
        <div class="xy-rumor-body">{{ r.内容 }}</div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { activeTimelineEvents, type TimelineDate } from '../composables';

function formatRange(range: { 起: TimelineDate; 止: TimelineDate }): string {
  const s = range.起;
  const e = range.止;
  const fmt = (d: TimelineDate) => `${d.年}年${d.月}月${d.日}日`;
  if (s.年 === e.年 && s.月 === e.月 && s.日 === e.日) return fmt(s);
  return `${fmt(s)} ~ ${fmt(e)}`;
}
</script>
