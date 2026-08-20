<template>
  <component :is="embedded ? 'div' : 'section'" class="xy-page-arts" :class="{ 'xy-page': !embedded }">
    <div v-if="_.isEmpty(store.data.功法)" class="xy-empty">
      <div class="xy-empty-mark">空</div>
      <p>未修任何功法</p>
    </div>
    <template v-else>
      <div class="xy-rumor-filter">
        <button
          type="button"
          :class="['xy-chip', { active: state.artFilter === 'all' }]"
          @click="state.artFilter = 'all'"
        >
          全部 <em>{{ Object.keys(store.data.功法).length }}</em>
        </button>
        <template v-for="t in artTypes" :key="t">
          <button
            v-if="countField(store.data.功法, '类型', t)"
            type="button"
            :class="['xy-chip', { active: state.artFilter === t }]"
            @click="state.artFilter = t"
          >
            {{ t }} <em>{{ countField(store.data.功法, '类型', t) }}</em>
          </button>
        </template>
      </div>
      <div v-if="_.isEmpty(filteredArts)" class="xy-empty xy-empty-soft">
        <div class="xy-empty-mark">·</div>
        <p>该分类下暂无功法</p>
      </div>
      <div v-else class="xy-art-grid">
        <article
          v-for="(art, name) in filteredArts"
          :key="name"
          class="xy-art"
          :class="{
            'xy-art-active': art.使用中,
            'xy-mobile-card-open': isMobileCardOpen('art', String(name)),
          }"
        >
          <button
            type="button"
            class="xy-trash"
            title="删除此功法"
            @click.stop="requestDelete('art', name as string, name as string)"
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
            </svg>
          </button>
          <div
            class="xy-art-head xy-mobile-card-head"
            :aria-expanded="state.layoutMode === 'mobile' ? isMobileCardOpen('art', String(name)) : undefined"
            @click="toggleMobileCard('art', String(name))"
          >
            <div class="xy-art-title">
              <span class="xy-art-name">{{ name }}</span>
              <span :class="['xy-quality', 'xy-q-' + art.品质]">{{ art.品质 }}品</span>
            </div>
            <button class="xy-toggle" :class="{ on: art.使用中 }" @click.stop="toggleArt(name as string, !art.使用中)">
              {{ art.使用中 ? '运转中' : '凝息' }}
            </button>
            <span class="xy-mobile-card-caret" aria-hidden="true">⌄</span>
          </div>
          <div
            v-show="state.layoutMode === 'pc' || state.editMode || isMobileCardOpen('art', String(name))"
            class="xy-mobile-card-body"
          >
            <div class="xy-art-meta">
              <span class="xy-pill">{{ art.类型 }}</span>
              <span v-if="art.境界" class="xy-pill xy-pill-soft">{{ art.境界 }}</span>
              <span v-if="art.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(art.五行) }">{{
                art.五行 === '混沌' ? '混' : art.五行
              }}</span>
              <span v-if="art.消耗 || state.editMode" class="xy-pill xy-pill-cost"
                >耗 <EditableValue v-model="art.消耗" label="消耗"
              /></span>
            </div>
            <div v-if="art.描述 || state.editMode" class="xy-art-desc">
              <EditableValue v-model="art.描述" label="描述" multiline />
            </div>
            <div v-if="!_.isEmpty(art.效果) || state.editMode" class="xy-effect-list">
              <EffectList v-model="art.效果" />
            </div>
            <div v-if="art.标签 && art.标签.length" class="xy-tags">
              <span v-for="t in art.标签" :key="t" class="xy-tag">{{ t }}</span>
            </div>
          </div>
        </article>
      </div>
    </template>
  </component>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { useDataStore } from '../store';
import EditableValue from './EditableValue.vue';
import EffectList from './EffectList.vue';
import {
  state,
  artTypes,
  filteredArts,
  countField,
  requestDelete,
  toggleArt,
  elColor,
  isMobileCardOpen,
  toggleMobileCard,
} from '../composables';

const store = useDataStore();
withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });
</script>
