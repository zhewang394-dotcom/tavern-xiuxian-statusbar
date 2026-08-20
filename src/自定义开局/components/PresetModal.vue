<template>
  <div class="xs-modal-overlay" @click.self="$emit('close')">
    <div class="xs-modal">
      <div class="xs-modal-title">封存 · 读取命途</div>

      <div class="xs-modal-section">
        <h4>封存当前命途</h4>
        <div style="display: flex; gap: 8px;">
          <input
            v-model="newName"
            type="text"
            placeholder="为这条命途命名（如：剑修起步）"
            style="flex: 1 1 auto;"
            @keydown.enter="onSave"
          />
          <button type="button" class="xs-btn xs-btn-primary" @click="onSave">封存</button>
        </div>
      </div>

      <div class="xs-modal-section">
        <h4>已封存命途</h4>
        <div v-if="store.presets.length === 0" class="xs-empty">尚无任何封存</div>
        <div v-else class="xs-preset-list">
          <div v-for="p in store.presets" :key="p.id" class="xs-preset-item">
            <span class="xs-preset-name">{{ p.name }}</span>
            <span class="xs-preset-time">{{ formatTime(p.createdAt) }}</span>
            <div class="xs-preset-actions">
              <button
                type="button"
                class="xs-icon-btn"
                title="读取"
                @click="onLoad(p.id)"
              >
                ↺
              </button>
              <button
                type="button"
                class="xs-icon-btn"
                title="删除"
                @click="onDelete(p.id)"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="xs-modal-actions">
        <button type="button" class="xs-btn" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useStartStore } from '../store';

const store = useStartStore();

const newName = ref('');

const emit = defineEmits<{
  close: [];
}>();

function onSave() {
  if (store.savePreset(newName.value)) {
    newName.value = '';
  }
}
function onLoad(id: string) {
  store.loadPreset(id);
  emit('close');
}
function onDelete(id: string) {
  store.deletePreset(id);
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yy}/${mm}/${dd} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}
</script>
