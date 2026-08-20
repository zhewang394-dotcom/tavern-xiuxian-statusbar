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
      <!-- 容貌 -->
      <div class="xy-protag-row">
        <span class="xy-field-tag">仙颜</span>
        <div class="xy-field-content">
          <EditableValue
            v-if="editMode"
            v-model="store.data.外貌"
            type="textarea"
            placeholder="暂无容貌外貌描述..."
          />
          <span v-else class="xy-field-text">{{ store.data.外貌 || '暂无容貌描述（随剧情自然演化）' }}</span>
        </div>
      </div>

      <!-- 性格与特质 -->
      <div class="xy-protag-row" v-if="store.data.性格 || editMode">
        <span class="xy-field-tag">道心</span>
        <div class="xy-field-content">
          <EditableValue
            v-if="editMode"
            v-model="store.data.性格"
            type="text"
            placeholder="如：清冷孤傲、杀伐果断..."
          />
          <span v-else class="xy-field-text">{{ store.data.性格 || '未定' }}</span>
        </div>
      </div>

      <!-- 当前着装 -->
      <div class="xy-protag-row">
        <span class="xy-field-tag">霓裳</span>
        <div class="xy-field-content">
          <EditableValue
            v-if="editMode"
            v-model="store.data.着装"
            type="textarea"
            placeholder="暂无当前着装与饰品描述..."
          />
          <span v-else class="xy-field-text">{{ store.data.着装 || '一袭青色素雅道袍' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import EditableValue from './EditableValue.vue';

defineProps<{
  editMode?: boolean;
}>();

const store = useDataStore();

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
  margin: 10px 0;
  padding: 10px 14px;
  background: rgba(253, 246, 236, 0.75);
  border: 1px solid rgba(217, 182, 140, 0.45);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(90, 60, 30, 0.04);
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;
}

.xy-protag-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(to bottom, #d48872, #c86d8c, #b35c75);
}

.xy-protag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(200, 160, 120, 0.3);
}

.xy-protag-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.xy-protag-icon {
  font-size: 13px;
}

.xy-protag-name {
  font-family: var(--font-kai, 'Noto Serif SC', serif);
  font-weight: bold;
  font-size: 13px;
  color: #6a392b;
  letter-spacing: 0.5px;
}

.xy-protag-charm {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.xy-charm-label {
  color: #8c6a58;
}

.xy-charm-val {
  font-family: monospace;
  font-weight: bold;
  color: #b33951;
  font-size: 12px;
}

.xy-charm-grade {
  background: rgba(179, 57, 81, 0.1);
  color: #a32a42;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10.5px;
  border: 1px solid rgba(179, 57, 81, 0.2);
}

.xy-protag-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.xy-protag-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.xy-field-tag {
  flex-shrink: 0;
  background: rgba(139, 90, 60, 0.12);
  color: #5c3b28;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

.xy-field-content {
  flex: 1;
  min-width: 0;
}

.xy-field-text {
  color: #3d342d;
  word-break: break-word;
  display: block;
}

/* 夜间模式 / 暗黑模式兼容 */
:root[data-theme='dark'] .xy-protag-card {
  background: rgba(30, 26, 24, 0.75);
  border-color: rgba(140, 100, 70, 0.35);
}

:root[data-theme='dark'] .xy-protag-name {
  color: #d9a896;
}

:root[data-theme='dark'] .xy-field-text {
  color: #d1c8c0;
}

:root[data-theme='dark'] .xy-field-tag {
  background: rgba(180, 120, 80, 0.2);
  color: #e0b89b;
}
</style>
