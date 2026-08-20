<template>
  <div>
    <h2 class="xs-step-title">配 · 变量更新方式</h2>
    <p class="xs-step-subtitle">
      决定「面板变量」由谁来更新。选择后，卡片会自动开关世界书与预设里对应的条目；
      余下的 MVU 扩展设置见「额外API」旁的图文教程。
    </p>

    <div class="xs-card-grid cols-2">
      <div class="xs-apimode-cell">
        <OptionCard
          title="额外API输出"
          subtitle="推荐"
          glyph="⚙"
          tone="jade"
          :tags="['正文更干净', '需额外模型']"
          :index="0"
          :selected="store.selection.变量更新模式 === '额外API'"
          desc="由一个独立的额外模型在「变量更新轮」单独输出变量更新，主模型只管讲故事——长文时格式更稳、正文不被更新指令污染。需要你在酒馆里为额外模型填一次地址与密钥。"
          @pick="store.setApiMode('额外API')"
        />
        <button type="button" class="xs-btn xs-btn-ghost xs-apimode-tut" @click="tutorialOpen = true">
          ？ 如何开启额外API · 图文教程
        </button>
      </div>

      <div class="xs-apimode-cell">
        <OptionCard
          title="随主AI输出"
          subtitle="开箱即用"
          glyph="✎"
          tone="ink"
          :tags="['无需额外设置', '长文易出错']"
          :index="1"
          :selected="store.selection.变量更新模式 === '随主API'"
          desc="主模型在讲故事的同一轮里顺带输出变量更新，无需任何额外模型或设置。缺点是正文与更新指令挤在一轮，篇幅一长更容易出现格式错误。"
          @pick="store.setApiMode('随主API')"
        />
      </div>
    </div>

    <div class="xs-actions">
      <button type="button" class="xs-btn" @click="store.prev">返回</button>
      <button
        type="button"
        class="xs-btn xs-btn-primary"
        :disabled="applying"
        @click="onContinue"
      >
        {{ applying ? '应用中…' : '继续 ▸' }}
      </button>
    </div>

    <ApiTutorialModal v-if="tutorialOpen" @close="tutorialOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useStartStore } from '../store';
import { applyApiMode } from '../apiMode';
import OptionCard from '../components/OptionCard.vue';
import ApiTutorialModal from '../components/ApiTutorialModal.vue';

const store = useStartStore();
const tutorialOpen = ref(false);
const applying = ref(false);

async function onContinue() {
  if (applying.value) return;
  applying.value = true;
  const mode = store.selection.变量更新模式;
  try {
    const res = await applyApiMode(mode);
    if (res.ok) {
      const label = mode === '额外API' ? '额外API输出' : '随主AI输出';
      store.showToast(`已切换为「${label}」（世界书 ${res.worldbookChanged} 条 / 预设 ${res.presetChanged} 条）`);
    } else {
      store.showToast('切换条目时出错，请检查酒馆环境；可稍后手动开关');
    }
  } catch {
    store.showToast('切换条目失败，可稍后手动开关');
  } finally {
    applying.value = false;
    store.next();
  }
}
</script>
