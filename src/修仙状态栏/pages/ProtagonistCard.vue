<template>
  <div class="xy-protag-card">
    <div class="xy-protag-header">
      <div class="xy-protag-title">
        <span class="xy-protag-icon">🌸</span>
        <span class="xy-protag-name">仙容道体 · 女修风姿</span>
      </div>
      <div class="xy-protag-charm" v-if="store.data.魅力 !== undefined">
        <span class="xy-charm-label">绝色魅力</span>
        <span class="xy-charm-val">{{ store.data.魅力 }}</span>
        <span class="xy-charm-grade">{{ getCharmGrade(store.data.魅力) }}</span>
      </div>
    </div>

    <div class="xy-protag-body">
      <!-- 1. 性格 -->
      <div class="xy-protag-section" v-if="store.data.性格 || editMode">
        <div class="xy-section-header">
          <span class="xy-section-tag">性 格</span>
        </div>
        <div class="xy-section-content">
          <EditableValue
            v-if="editMode"
            v-model="store.data.性格"
            type="textarea"
            :multiline="true"
            :rows="2"
            placeholder="清冷孤高，守贞问月。视宫内规则与传承高于一切..."
          />
          <p v-else class="xy-desc-text">{{ store.data.性格 || '清冷孤高，守贞问月。对门下弟子看似疏离淡漠，实则护短。' }}</p>
        </div>
      </div>

      <!-- 2. 外貌 -->
      <div class="xy-protag-section">
        <div class="xy-section-header">
          <span class="xy-section-tag">外 貌</span>
        </div>
        <div class="xy-section-content">
          <EditableValue
            v-if="editMode"
            v-model="store.data.外貌"
            type="textarea"
            :multiline="true"
            :rows="3"
            placeholder="银白长发曳地犹如倾泻的月河，月华银眸冰寒不可逼视。肌肤如九天寒玉般白皙透明..."
          />
          <p v-else class="xy-desc-text">{{ store.data.外貌 || '银白长发及腰，月眸清冽，肌肤如九天寒玉般白皙细腻，仙姿绝世。' }}</p>
        </div>
      </div>

      <!-- 3. 着装 -->
      <div class="xy-protag-section">
        <div class="xy-section-header">
          <span class="xy-section-tag">着 装</span>
        </div>
        <div class="xy-section-content">
          <EditableValue
            v-if="editMode"
            v-model="store.data.着装"
            type="textarea"
            :multiline="true"
            :rows="2"
            placeholder="月轮悬领衣紧贴锁骨，透明广袖随风轻拂，下身覆着霜花曳尾长裙..."
          />
          <p v-else class="xy-desc-text">{{ store.data.着装 || '月轮素色仙裙紧贴锁骨，透明广袖随风轻拂，冷艳华贵。' }}</p>
        </div>
      </div>

      <!-- 4. 性器 (默认折叠，点击展开查看/编辑4大部位名器详情) -->
      <div class="xy-protag-section xy-genital-section" v-if="!_.isEmpty(store.data.性器) || editMode">
        <div class="xy-section-header xy-genital-header" @click="genitalOpen = !genitalOpen">
          <div class="xy-genital-title">
            <span class="xy-section-tag xy-tag-genital">性 器</span>
            <span class="xy-genital-badge" v-if="!_.isEmpty(store.data.性器)">
              {{ Object.keys(store.data.性器).length }}
            </span>
          </div>
          <button type="button" class="xy-genital-arrow-btn" :title="genitalOpen ? '折叠性器详情' : '展开性器详情'">
            <span class="xy-arrow-icon">{{ genitalOpen ? '▾' : '▸' }}</span>
          </button>
        </div>
        <transition name="xy-expand">
          <div v-show="genitalOpen" class="xy-genital-detail-box">
            <EffectList
              v-model="store.data.性器"
              line-class="xy-genital-effect-line"
              label-name="部位"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { ref } from 'vue';
import { useDataStore } from '../store';
import EditableValue from './EditableValue.vue';
import EffectList from './EffectList.vue';

defineProps<{
  editMode?: boolean;
}>();

const store = useDataStore();
// 默认折叠性器
const genitalOpen = ref(false);

function getCharmGrade(charm: number): string {
  if (charm >= 95) return '倾国倾城 · 祸国仙姿';
  if (charm >= 90) return '天仙化身 · 冰肌玉骨';
  if (charm >= 85) return '绝色出尘 · 顾盼生辉';
  if (charm >= 80) return '清丽脱俗 · 明眸皓齿';
  if (charm >= 70) return '端庄秀丽';
  return '清秀可人';
}
</script>

<style scoped>
.xy-protag-card {
  margin: 12px 0 16px 0;
  padding: 14px 16px;
  background: var(--xy-card-bg, rgba(253, 246, 236, 0.85));
  border: 1px solid var(--xy-card-border, rgba(217, 182, 140, 0.5));
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.xy-protag-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, #d48872, #c86d8c, #b35c75, #934a62);
}

.xy-protag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(200, 160, 120, 0.35);
}

.xy-protag-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.xy-protag-icon {
  font-size: 15px;
}

.xy-protag-name {
  font-family: var(--xy-font-display, 'Noto Serif SC', serif);
  font-weight: bold;
  font-size: 14px;
  color: var(--xy-protag-title-color, #7a3526);
  letter-spacing: 1px;
}

.xy-protag-charm {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.xy-charm-label {
  color: var(--xy-ink-soft, #8c6a58);
}

.xy-charm-val {
  font-family: monospace;
  font-weight: bold;
  color: #b33951;
  font-size: 13px;
}

.xy-charm-grade {
  background: rgba(179, 57, 81, 0.12);
  color: #a32a42;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(179, 57, 81, 0.25);
  letter-spacing: 0.5px;
}

.xy-protag-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.xy-protag-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.xy-section-header {
  display: flex;
  align-items: center;
}

.xy-section-tag {
  font-size: 12px;
  font-weight: 600;
  color: var(--xy-ink-soft, #8c6a58);
  letter-spacing: 2px;
  padding-left: 2px;
}

.xy-section-content {
  padding-left: 2px;
}

.xy-desc-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.68;
  color: var(--xy-ink, #2c2520);
  word-break: break-word;
  white-space: pre-wrap;
  letter-spacing: 0.3px;
}

/* 性器折叠区样式 */
.xy-genital-section {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dotted rgba(200, 160, 120, 0.25);
}

.xy-genital-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.xy-genital-header:hover {
  background: rgba(179, 57, 81, 0.06);
}

.xy-genital-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.xy-tag-genital {
  color: #a32a42;
}

.xy-genital-badge {
  background: rgba(179, 57, 81, 0.18);
  color: #a32a42;
  font-size: 11px;
  font-weight: bold;
  padding: 1px 7px;
  border-radius: 10px;
  line-height: 1.2;
}

.xy-genital-arrow-btn {
  background: none;
  border: none;
  color: #a32a42;
  font-size: 14px;
  cursor: pointer;
  padding: 0 4px;
  display: flex;
  align-items: center;
}

.xy-genital-detail-box {
  margin-top: 8px;
  padding: 10px 12px;
  background: rgba(179, 57, 81, 0.04);
  border: 1px dashed rgba(179, 57, 81, 0.22);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.xy-genital-effect-line) {
  display: flex;
  align-items: flex-start;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--xy-ink, #2c2520);
  word-break: break-word;
  gap: 4px;
}

:deep(.xy-genital-effect-line .xy-effect-name-edit) {
  font-weight: 600;
  color: #934a62;
  flex-shrink: 0;
}

/* 夜间模式 / 暗黑模式兼容 */
:root[data-theme='dark'] .xy-protag-card {
  background: rgba(26, 22, 24, 0.88);
  border-color: rgba(140, 90, 80, 0.45);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

:root[data-theme='dark'] .xy-protag-name {
  color: #e5a796;
}

:root[data-theme='dark'] .xy-desc-text {
  color: #dfd5ce;
}

:root[data-theme='dark'] .xy-section-tag {
  color: #b09586;
}

:root[data-theme='dark'] .xy-tag-genital {
  color: #e8869c;
}

:root[data-theme='dark'] .xy-genital-badge {
  background: rgba(232, 134, 156, 0.2);
  color: #f09cb0;
}

:root[data-theme='dark'] .xy-genital-detail-box {
  background: rgba(179, 57, 81, 0.08);
  border-color: rgba(232, 134, 156, 0.3);
}

:root[data-theme='dark'] :deep(.xy-genital-effect-line) {
  color: #dfd5ce;
}

:root[data-theme='dark'] :deep(.xy-genital-effect-line .xy-effect-name-edit) {
  color: #e8869c;
}
</style>
