<template>
  <section class="xy-page xy-page-storage">
    <div class="xy-stone">
      <div class="xy-stone-label">灵石</div>
      <div class="xy-stone-value">
        <EditableValue
          :model-value="store.data.灵石"
          type="number"
          label="灵石"
          :min="0"
          :format="v => Number(v).toLocaleString()"
          @update:model-value="store.data.灵石 = Number($event)"
        />
      </div>
    </div>

    <div class="xy-storage-tabs">
      <button
        v-for="(s, i) in storageTabs"
        :key="s.key"
        :class="['xy-stab', { active: state.storageTab === i }]"
        @click="state.storageTab = i"
      >
        {{ s.label }}
        <em>{{ storageCount(s.key) }}</em>
      </button>
    </div>

    <!-- 功法 -->
    <PageArts v-if="state.storageTab === 0" embedded />

    <!-- 物品 -->
    <div v-else-if="state.storageTab === 1">
      <div v-if="_.isEmpty(store.data.物品)" class="xy-empty">
        <div class="xy-empty-mark">无</div>
        <p>储物空间空空如也</p>
      </div>
      <template v-else>
        <div class="xy-rumor-filter">
          <button
            type="button"
            :class="['xy-chip', { active: state.itemFilter === 'all' }]"
            @click="state.itemFilter = 'all'"
          >
            全部 <em>{{ Object.keys(store.data.物品).length }}</em>
          </button>
          <template v-for="t in itemTypes" :key="t">
            <button
              v-if="countField(store.data.物品, '类型', t)"
              type="button"
              :class="['xy-chip', { active: state.itemFilter === t }]"
              @click="state.itemFilter = t"
            >
              {{ t }} <em>{{ countField(store.data.物品, '类型', t) }}</em>
            </button>
          </template>
        </div>
        <div v-if="_.isEmpty(filteredItems)" class="xy-empty xy-empty-soft">
          <div class="xy-empty-mark">·</div>
          <p>该分类下暂无物品</p>
        </div>
        <div v-else class="xy-item-grid">
          <article
            v-for="(it, name) in filteredItems"
            :key="name"
            class="xy-item"
            :class="['xy-q-bg-' + it.品质, { 'xy-mobile-card-open': isMobileCardOpen('item', String(name)) }]"
          >
            <button
              type="button"
              class="xy-trash"
              title="删除此物品"
              @click.stop="requestDelete('item', name as string, name as string)"
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
              </svg>
            </button>
            <div
              class="xy-item-head xy-mobile-card-head"
              :aria-expanded="state.layoutMode === 'mobile' ? isMobileCardOpen('item', String(name)) : undefined"
              @click="toggleMobileCard('item', String(name))"
            >
              <span class="xy-item-name">{{ name }}</span>
              <span class="xy-item-qty" @click.stop
                >×<EditableValue v-model.number="it.数量" type="number" label="数量" :min="0"
              /></span>
              <span class="xy-mobile-card-caret" aria-hidden="true">⌄</span>
            </div>
            <div
              v-show="state.layoutMode === 'pc' || state.editMode || isMobileCardOpen('item', String(name))"
              class="xy-mobile-card-body"
            >
              <div class="xy-item-meta">
                <span :class="['xy-quality', 'xy-q-' + it.品质]">{{ it.品质 }}</span>
                <span class="xy-pill">{{ it.类型 }}</span>
                <span v-if="it.境界" class="xy-pill xy-pill-soft">{{ it.境界 }}</span>
                <span v-if="it.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(it.五行) }">{{
                  it.五行 === '混沌' ? '混' : it.五行
                }}</span>
              </div>
              <div v-if="parseItemTags(it.标签).length" class="xy-item-tags">
                <span
                  v-for="(t, i) in parseItemTags(it.标签)"
                  :key="i"
                  class="xy-item-tag"
                  :class="'xy-item-tag-' + t.label"
                >
                  {{ t.label }} <b>{{ t.value }}</b>
                </span>
              </div>
              <div v-if="it.描述 || state.editMode" class="xy-item-desc">
                <EditableValue v-model="it.描述" label="描述" multiline />
              </div>
              <div v-if="!_.isEmpty(it.效果) || state.editMode" class="xy-effect-list">
                <EffectList v-model="it.效果" />
              </div>
            </div>
          </article>
        </div>
      </template>
    </div>

    <!-- 装备 -->
    <div v-else-if="state.storageTab === 2">
      <div v-if="_.isEmpty(store.data.装备)" class="xy-empty">
        <div class="xy-empty-mark">无</div>
        <p>未持任何装备</p>
      </div>
      <template v-else>
        <div class="xy-rumor-filter">
          <button
            type="button"
            :class="['xy-chip', { active: state.equipFilter === 'all' }]"
            @click="state.equipFilter = 'all'"
          >
            全部 <em>{{ Object.keys(store.data.装备).length }}</em>
          </button>
          <template v-for="t in equipTypes" :key="t">
            <button
              v-if="countField(store.data.装备, '类型', t)"
              type="button"
              :class="['xy-chip', { active: state.equipFilter === t }]"
              @click="state.equipFilter = t"
            >
              {{ t }} <em>{{ countField(store.data.装备, '类型', t) }}</em>
            </button>
          </template>
        </div>
        <div v-if="_.isEmpty(filteredEquips)" class="xy-empty xy-empty-soft">
          <div class="xy-empty-mark">·</div>
          <p>该分类下暂无装备</p>
        </div>
        <div v-else class="xy-item-grid">
          <article
            v-for="(eq, name) in filteredEquips"
            :key="name"
            class="xy-item xy-equipment"
            :class="['xy-q-bg-' + eq.品质, { 'xy-mobile-card-open': isMobileCardOpen('equip', String(name)) }]"
          >
            <button
              type="button"
              class="xy-trash"
              title="删除此装备"
              @click.stop="requestDelete('equip', name as string, name as string)"
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
              </svg>
            </button>
            <div
              class="xy-item-head xy-mobile-card-head"
              :aria-expanded="state.layoutMode === 'mobile' ? isMobileCardOpen('equip', String(name)) : undefined"
              @click="toggleMobileCard('equip', String(name))"
            >
              <span class="xy-item-name">{{ name }}</span>
              <span class="xy-item-pos">{{ eq.位置 }}</span>
              <span class="xy-mobile-card-caret" aria-hidden="true">⌄</span>
            </div>
            <div
              v-show="state.layoutMode === 'pc' || state.editMode || isMobileCardOpen('equip', String(name))"
              class="xy-mobile-card-body"
            >
              <div class="xy-item-meta">
                <span :class="['xy-quality', 'xy-q-' + eq.品质]">{{ eq.品质 }}</span>
                <span class="xy-pill">{{ eq.类型 }}</span>
                <span v-if="eq.境界" class="xy-pill xy-pill-soft">{{ eq.境界 }}</span>
                <span v-if="eq.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(eq.五行) }">{{
                  eq.五行 === '混沌' ? '混' : eq.五行
                }}</span>
              </div>
              <div class="xy-eq-stats">
                <span
                  v-if="getEquipStat(eq, '攻击力') !== null || (state.editMode && eq.类型 === '法宝')"
                  class="xy-eq-stat xy-stat-atk"
                >
                  攻
                  <EditableValue
                    :model-value="getEquipStat(eq, '攻击力') ?? 0"
                    type="number"
                    label="攻击力"
                    :min="0"
                    @update:model-value="setEquipStat(eq, '攻击力', Number($event))"
                  />
                </span>
                <span
                  v-if="getEquipStat(eq, '防御力') !== null || (state.editMode && eq.类型 === '护甲')"
                  class="xy-eq-stat xy-stat-def"
                >
                  防
                  <EditableValue
                    :model-value="getEquipStat(eq, '防御力') ?? 0"
                    type="number"
                    label="防御力"
                    :min="0"
                    @update:model-value="setEquipStat(eq, '防御力', Number($event))"
                  />
                </span>
              </div>
              <div v-if="eq.描述 || state.editMode" class="xy-item-desc">
                <EditableValue v-model="eq.描述" label="描述" multiline />
              </div>
              <div v-if="!_.isEmpty(eq.效果) || state.editMode" class="xy-effect-list">
                <EffectList v-model="eq.效果" />
              </div>
            </div>
          </article>
        </div>
      </template>
    </div>

    <!-- 傀儡 -->
    <div v-else-if="state.storageTab === 3">
      <div v-if="_.isEmpty(store.data.傀儡)" class="xy-empty">
        <div class="xy-empty-mark">无</div>
        <p>暂无傀儡</p>
      </div>
      <template v-else>
        <div class="xy-rumor-filter">
          <button
            type="button"
            :class="['xy-chip', { active: state.puppetFilter === 'all' }]"
            @click="state.puppetFilter = 'all'"
          >
            全部 <em>{{ Object.keys(store.data.傀儡).length }}</em>
          </button>
          <template v-for="q in qualityRanks" :key="q">
            <button
              v-if="countField(store.data.傀儡, '品质', q)"
              type="button"
              :class="['xy-chip', { active: state.puppetFilter === q }]"
              @click="state.puppetFilter = q"
            >
              {{ q }}品 <em>{{ countField(store.data.傀儡, '品质', q) }}</em>
            </button>
          </template>
        </div>
        <div v-if="_.isEmpty(filteredPuppets)" class="xy-empty xy-empty-soft">
          <div class="xy-empty-mark">·</div>
          <p>该品阶下暂无傀儡</p>
        </div>
        <div v-else class="xy-item-grid">
          <CombatUnit
            v-for="(u, name) in filteredPuppets"
            :key="name"
            :unit="u"
            :name="String(name)"
            deletable
            @toggle="toggleUnit('傀儡', String(name), $event)"
            @delete="requestDelete('puppet', String(name), String(name))"
          />
        </div>
      </template>
    </div>

    <!-- 灵兽 -->
    <div v-else>
      <div v-if="_.isEmpty(store.data.灵兽)" class="xy-empty">
        <div class="xy-empty-mark">无</div>
        <p>暂无灵兽</p>
      </div>
      <template v-else>
        <div class="xy-rumor-filter">
          <button
            type="button"
            :class="['xy-chip', { active: state.beastFilter === 'all' }]"
            @click="state.beastFilter = 'all'"
          >
            全部 <em>{{ Object.keys(store.data.灵兽).length }}</em>
          </button>
          <template v-for="q in qualityRanks" :key="q">
            <button
              v-if="countField(store.data.灵兽, '品质', q)"
              type="button"
              :class="['xy-chip', { active: state.beastFilter === q }]"
              @click="state.beastFilter = q"
            >
              {{ q }}品 <em>{{ countField(store.data.灵兽, '品质', q) }}</em>
            </button>
          </template>
        </div>
        <div v-if="_.isEmpty(filteredBeasts)" class="xy-empty xy-empty-soft">
          <div class="xy-empty-mark">·</div>
          <p>该品阶下暂无灵兽</p>
        </div>
        <div v-else class="xy-item-grid">
          <CombatUnit
            v-for="(u, name) in filteredBeasts"
            :key="name"
            :unit="u"
            :name="String(name)"
            deletable
            @toggle="toggleUnit('灵兽', String(name), $event)"
            @delete="requestDelete('beast', String(name), String(name))"
          />
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { useDataStore } from '../store';
import CombatUnit from './CombatUnit.vue';
import EditableValue from './EditableValue.vue';
import EffectList from './EffectList.vue';
import PageArts from './PageArts.vue';
import {
  state,
  storageTabs,
  itemTypes,
  equipTypes,
  qualityRanks,
  filteredItems,
  filteredEquips,
  filteredPuppets,
  filteredBeasts,
  countField,
  storageCount,
  requestDelete,
  toggleUnit,
  elColor,
  getEquipStat,
  setEquipStat,
  parseItemTags,
  isMobileCardOpen,
  toggleMobileCard,
} from '../composables';

const store = useDataStore();
</script>
