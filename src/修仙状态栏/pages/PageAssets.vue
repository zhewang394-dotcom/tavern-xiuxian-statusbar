<template>
  <section class="xy-page xy-page-assets">
    <div v-if="state.editMode" class="xy-asset-toolbar">
      <span>资产名与设施名可直接重命名；空名或重名不会覆盖现有数据。</span>
      <button type="button" class="xy-effect-add" @click="addAsset">＋ 新增资产</button>
    </div>

    <div v-if="_.isEmpty(assets) && !state.editMode" class="xy-empty">
      <div class="xy-empty-mark">无</div>
      <p>暂无固定资产</p>
    </div>

    <div v-else class="xy-assets-grid">
      <article
        v-for="(asset, assetName) in assets"
        :key="assetName"
        class="xy-asset-card"
        :class="{ 'xy-mobile-card-open': isMobileCardOpen('asset', String(assetName)) }"
        :data-seal="assetGlyph(asset.类型)"
      >
        <button
          v-if="state.editMode"
          type="button"
          class="xy-trash"
          title="删除此资产"
          @click.stop="requestDelete('asset', String(assetName), String(assetName))"
        >
          ×
        </button>

        <div
          class="xy-asset-head xy-mobile-card-head"
          :aria-expanded="state.layoutMode === 'mobile' ? isMobileCardOpen('asset', String(assetName)) : undefined"
          @click="toggleMobileCard('asset', String(assetName))"
        >
          <span class="xy-asset-name">
            <EditableValue
              :model-value="String(assetName)"
              label="资产名"
              @update:model-value="renameKey(assets, String(assetName), String($event), '资产')"
            />
          </span>
          <select v-if="state.editMode" v-model="asset.类型" class="xy-asset-select" title="资产类型" @click.stop>
            <option v-for="type in assetTypes" :key="type" :value="type">{{ type }}</option>
          </select>
          <span v-else class="xy-asset-type">{{ asset.类型 }}</span>
          <span class="xy-asset-scale">
            规模：<EditableValue
              :model-value="asset.人员规模"
              type="number"
              label="人员规模"
              :min="0"
              :step="1"
              @update:model-value="asset.人员规模 = normalizeScale($event)"
            />人
          </span>
          <span class="xy-mobile-card-caret" aria-hidden="true">⌄</span>
        </div>

        <div
          v-show="state.layoutMode === 'pc' || state.editMode || isMobileCardOpen('asset', String(assetName))"
          class="xy-mobile-card-body"
        >
          <div class="xy-asset-location">
            <select
              v-if="state.editMode"
              v-model="asset.所在地.世界"
              class="xy-asset-select xy-asset-select-world"
              title="所在世界"
            >
              <option v-for="world in worlds" :key="world" :value="world">{{ world }}</option>
            </select>
            <span v-else>{{ asset.所在地.世界 }}</span>
            <i>·</i>
            <EditableValue v-model="asset.所在地.地域" label="地域" />
            <i>·</i>
            <EditableValue v-model="asset.所在地.具体地点" label="具体地点" />
          </div>

          <div class="xy-asset-status">
            <EditableValue v-model="asset.现状" label="现状" multiline :rows="2" />
          </div>

          <div class="xy-asset-section-title">设施</div>
          <div v-if="_.isEmpty(asset.设施) && !state.editMode" class="xy-asset-empty">暂无设施</div>
          <div v-for="(facility, facilityName) in asset.设施" :key="facilityName" class="xy-facility">
            <button
              v-if="state.editMode"
              type="button"
              class="xy-trash"
              title="删除此设施"
              @click.stop="removeFacility(asset.设施, String(facilityName))"
            >
              ×
            </button>
            <div class="xy-facility-head">
              <strong>
                <EditableValue
                  :model-value="String(facilityName)"
                  label="设施名"
                  @update:model-value="renameKey(asset.设施, String(facilityName), String($event), '设施')"
                />
              </strong>
              <span class="xy-facility-yield">
                每月产出：<EditableValue v-model="facility.每月产出" label="每月产出" />
              </span>
            </div>
            <div v-if="!_.isEmpty(facility.效果) || state.editMode" class="xy-facility-effect">
              <EffectList v-model="facility.效果" />
            </div>
            <div class="xy-facility-date">
              <span>上次收取：</span>
              <template v-if="facility.上次收取日期">
                <span v-if="!state.editMode">{{ formatTime(facility.上次收取日期) }}</span>
                <span v-else class="xy-asset-date-fields">
                  <EditableValue v-model.number="facility.上次收取日期.年" type="number" label="年" :min="1" />年
                  <EditableValue
                    v-model.number="facility.上次收取日期.月"
                    type="number"
                    label="月"
                    :min="1"
                    :max="12"
                  />月
                  <EditableValue
                    v-model.number="facility.上次收取日期.日"
                    type="number"
                    label="日"
                    :min="1"
                    :max="30"
                  />日
                  <select v-model="facility.上次收取日期.时辰" class="xy-asset-select xy-asset-select-time">
                    <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }}</option>
                  </select>
                  <button type="button" class="xy-asset-date-clear" @click="facility.上次收取日期 = null">
                    设为从未收取
                  </button>
                </span>
              </template>
              <template v-else>
                <span>从未收取</span>
                <button
                  v-if="state.editMode"
                  type="button"
                  class="xy-asset-date-clear"
                  @click="facility.上次收取日期 = newTime()"
                >
                  填写日期
                </button>
              </template>
            </div>
          </div>
          <button v-if="state.editMode" type="button" class="xy-effect-add" @click="addFacility(asset.设施)">
            ＋ 新增设施
          </button>

          <div class="xy-asset-section-title">所属人物</div>
          <div class="xy-asset-people">
            <IdentityTags v-model="asset.所属人物" label="所属人物" />
            <span v-if="!state.editMode && asset.所属人物.length === 0" class="xy-asset-empty">暂无</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed } from 'vue';
import { useDataStore } from '../store';
import { isMobileCardOpen, requestDelete, showToast, state, toggleMobileCard } from '../composables';
import EditableValue from './EditableValue.vue';
import EffectList from './EffectList.vue';
import IdentityTags from './IdentityTags.vue';

const store = useDataStore();
const assets = computed(() => store.data.固定资产);
const assetTypes = ['宗门', '店铺', '洞府'] as const;
const worlds = ['凡界', '灵界', '仙界'] as const;
const hours = ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'] as const;

type AssetRecord = Record<string, any>;

function assetGlyph(type: string): string {
  return type === '宗门' ? '宗' : type === '店铺' ? '铺' : '洞';
}

function normalizeScale(value: string | number): number {
  return Math.max(0, Math.trunc(Number(value) || 0));
}

function uniqueName(record: AssetRecord, base: string): string {
  if (!(base in record)) return base;
  let index = 2;
  while (`${base}${index}` in record) index += 1;
  return `${base}${index}`;
}

function renameKey(record: AssetRecord, oldKey: string, rawNewKey: string, label: string) {
  const newKey = rawNewKey.trim();
  if (!newKey || newKey === oldKey) return;
  if (newKey in record) {
    showToast(`${label}“${newKey}”已存在，未覆盖原数据`);
    return;
  }
  const entries = Object.entries(record).map(([key, value]) => [key === oldKey ? newKey : key, value]);
  for (const key of Object.keys(record)) delete record[key];
  for (const [key, value] of entries) record[key] = value;
}

function newTime() {
  const current = store.data.时间;
  return { 年: current.年, 月: current.月, 日: current.日, 时辰: current.时辰 };
}

function addAsset() {
  const name = uniqueName(assets.value, '新资产');
  assets.value[name] = {
    类型: '洞府',
    人员规模: 0,
    所在地: { ...store.data.地点 },
    现状: '正常',
    设施: {},
    所属人物: [],
  };
}

function addFacility(facilities: AssetRecord) {
  const name = uniqueName(facilities, '新设施');
  facilities[name] = { 效果: {}, 每月产出: '无', 上次收取日期: null };
}

function removeFacility(facilities: AssetRecord, name: string) {
  delete facilities[name];
}

function formatTime(time: { 年: number; 月: number; 日: number; 时辰: string }): string {
  return `修仙历${time.年}年${time.月}月${time.日}日 · ${time.时辰}`;
}
</script>
