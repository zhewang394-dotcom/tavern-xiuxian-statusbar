<template>
  <div class="xs-modal-overlay" @click.self="$emit('close')">
    <div class="xs-modal xs-tut-modal">
      <div class="xs-modal-title">如何开启「额外API输出」</div>

      <div class="xs-modal-section">
        <p class="xs-tut-lead">
          卡片会自动帮你切换世界书与预设里对应的条目，但
          <strong>MVU 扩展的「变量更新方式」以及额外模型的地址 / 密钥</strong>
          需要你在酒馆里手动设置一次（此后长期有效）。按下图操作：
        </p>

        <ol class="xs-tut-steps">
          <li>点开顶栏的 <strong>MVU 变量框架</strong> 扩展面板（方块图标）。</li>
          <li>
            在「<strong>变量更新方式</strong>」下拉框里选择
            <strong>额外模型解析</strong>。
          </li>
          <li>
            展开「<strong>模型来源</strong>」，选择「自定义」，填入额外模型的
            <strong>API 地址</strong> 与 <strong>API 密钥</strong>。
          </li>
          <li>设置完成后即可正常游玩，变量更新将由额外模型独立完成，正文不再被更新指令污染。</li>
        </ol>

        <figure class="xs-tut-figure">
          <img
            v-if="!imgFailed"
            :src="TUTORIAL_IMG_URL"
            alt="MVU 额外模型解析设置示意图"
            class="xs-tut-img"
            loading="lazy"
            @error="imgFailed = true"
          />
          <div v-else class="xs-tut-img-fallback">
            配图加载失败，请参考上方文字步骤。<br />
            （图示位置：MVU 面板 → 变量更新方式 → 额外模型解析 → 模型来源 · 自定义 → API 地址 / 密钥）
          </div>
          <figcaption>MVU 面板：选择「额外模型解析」并填写额外模型的地址与密钥</figcaption>
        </figure>

        <p class="xs-tut-note">
          若你选择「随主AI输出」，则无需这些设置；但正文与变量更新会挤在同一轮，长文时更易出格式错误。
          推荐算力允许的玩家使用额外API输出。
        </p>
      </div>

      <div class="xs-modal-actions">
        <button type="button" class="xs-btn xs-btn-primary" @click="$emit('close')">我知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineEmits<{ close: [] }>();

// 教程配图：放在本仓库 assets/ 下，用 jsdelivr 引用（跟随卡片现有的
// gh/Awene/tavern_helper_template-main 引用路径）。若日后仓库名/分支变动，改此常量即可。
const TUTORIAL_IMG_URL =
  'https://testingcf.jsdelivr.net/gh/Awene/tavern_helper_template-main@master/assets/extra-api-tutorial.png';

const imgFailed = ref(false);
</script>
