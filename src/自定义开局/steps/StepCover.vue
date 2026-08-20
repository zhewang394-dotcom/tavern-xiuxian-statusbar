<template>
  <div class="xs-cover">
    <div class="xs-cover-seal">命途</div>
    <h1 class="xs-cover-title">命途之始</h1>
    <div class="xs-cover-subtitle">— 自定义开局 —</div>
    <p class="xs-cover-quote">
      天地玄黄，宇宙洪荒。
      <br />
      诸法万类，皆始于<em>一念</em>。
      <br />
      或为<em>剑修</em>仗剑天涯，或为<em>丹师</em>守炉数十寒暑；
      <br />
      或承宗门厚望踏阶而上，或自凡尘起步独行万里。
      <br />
      —— 是为<em>命途</em>。
    </p>
    <div class="xs-cover-btns">
      <button
        type="button"
        class="xs-btn xs-btn-primary xs-cover-cta"
        @click="onStart"
      >
        开启命途 ▸
      </button>
      <button
        v-if="store.presets.length > 0"
        type="button"
        class="xs-btn"
        @click="store.presetOpen = true"
      >
        读取封存
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStartStore } from '../store';

const store = useStartStore();

function onStart() {
  store.ensureDefaultDifficulty();
  store.next();
}
</script>
