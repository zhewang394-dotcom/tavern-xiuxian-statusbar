<template>
  <div class="xy-refine-overlay" @click="close" @contextmenu.prevent>
    <section
      class="xy-refine-dialog"
      :class="{ 'has-preview': refinementPreview }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="xy-refine-title"
      @click.stop
    >
      <header class="xy-refine-head" :class="{ 'has-preview': refinementPreview }">
        <span v-if="refinementPreview" class="xy-refine-character-avatar">{{ previewName.slice(0, 1) }}</span>
        <div class="xy-refine-title-copy">
          <p class="xy-refine-kicker">{{ refinementPreview ? '人物细化 · AI REFINEMENT' : '人物细化' }}</p>
          <div class="xy-refine-title-row">
            <h3 id="xy-refine-title">{{ characterName }}</h3>
            <template v-if="refinementPreview">
              <span class="xy-refine-preview-realm">{{ refinementPreview.修炼进度?.境界 || '凡人' }}</span>
              <span class="xy-refine-prototype-badge">AI 细化预览</span>
            </template>
          </div>
          <small v-if="refinementPreview">逐项核对 AI 建议；卡片展示的是写入后的完整值。</small>
        </div>
        <div v-if="refinementPreview" class="xy-refine-change-summary">
          <strong>{{ changedPreviewCount }} 项</strong><small>可修改</small><i></i>
          <strong>{{ unchangedPreviewCount }} 项</strong><small>无变化</small>
        </div>
        <button type="button" class="xy-refine-close" title="关闭" @click="close">×</button>
      </header>

      <div v-if="refinementPreview" class="xy-refine-preview">
        <div class="xy-refine-review-bar">
          <div class="xy-refine-filter-tabs">
            <button
              v-for="filter in previewFilters"
              :key="filter.key"
              type="button"
              :class="{ active: activePreviewFilter === filter.key }"
              @click="activePreviewFilter = filter.key"
            >
              {{ filter.label }} <b>{{ filter.count }}</b>
            </button>
          </div>
          <button
            type="button"
            class="xy-refine-select-all"
            :disabled="previewSelectionKeys.length === 0"
            @click="toggleAllPreviewFields"
          >
            <span>{{ allPreviewFieldsSelected ? '✓' : '' }}</span>
            {{ allPreviewFieldsSelected ? '取消全选' : '全选可修改项' }}
          </button>
        </div>

        <div class="xy-refine-preview-scroll">
          <section v-if="showPreviewGroup('base')" class="xy-refine-preview-group">
            <header class="xy-refine-section-title">
              <span>壹</span>
              <div>
                <h4>资质与数值</h4>
                <p>对照原变量，完整呈现结构与数值变化</p>
              </div>
            </header>

            <div class="xy-refine-full-grid">
              <button
                type="button"
                class="xy-refine-full-card is-gold"
                :class="previewCardClasses('寿元')"
                :disabled="!previewFieldChanged('寿元')"
                @click="togglePreviewField('寿元')"
              >
                <span class="xy-refine-card-check">{{ previewFieldCheck('寿元') }}</span>
                <header>
                  <div>
                    <small>基础信息</small>
                    <h5>寿元</h5>
                  </div>
                  <em>{{ previewFieldStatus('寿元', '有调整') }}</em>
                </header>
                <p v-if="previewFieldChanged('寿元')" class="xy-refine-compare">
                  <b>当前</b>寿命 {{ refinementBaseline?.寿元?.寿命 ?? '?' }} 年 <i>→</i
                  ><b class="is-ai">AI 建议</b>寿命 {{ refinementPreview.寿元?.寿命 ?? '?' }} 年
                </p>
                <p v-else class="xy-refine-same-banner">AI 返回值与人物当前变量完全相同，无需重复写入</p>
                <div class="xy-refine-metrics">
                  <span
                    ><small>年龄</small><strong>{{ refinementPreview.寿元?.年龄 ?? '?' }}</strong
                    ><em :class="deltaClass(refinementBaseline?.寿元?.年龄, refinementPreview.寿元?.年龄)">{{
                      formatDelta(refinementBaseline?.寿元?.年龄, refinementPreview.寿元?.年龄)
                    }}</em></span
                  >
                  <span
                    ><small>寿命</small><strong>{{ refinementPreview.寿元?.寿命 ?? '?' }}</strong
                    ><em :class="deltaClass(refinementBaseline?.寿元?.寿命, refinementPreview.寿元?.寿命)">{{
                      formatDelta(refinementBaseline?.寿元?.寿命, refinementPreview.寿元?.寿命)
                    }}</em></span
                  >
                  <span
                    ><small>外观年龄</small><strong>{{ refinementPreview.寿元?.外观年龄 ?? '?' }}</strong
                    ><em :class="deltaClass(refinementBaseline?.寿元?.外观年龄, refinementPreview.寿元?.外观年龄)">{{
                      formatDelta(refinementBaseline?.寿元?.外观年龄, refinementPreview.寿元?.外观年龄)
                    }}</em></span
                  >
                </div>
              </button>

              <button
                type="button"
                class="xy-refine-full-card is-jade"
                :class="previewCardClasses('体质')"
                :disabled="!previewFieldChanged('体质')"
                @click="togglePreviewField('体质')"
              >
                <span class="xy-refine-card-check">{{ previewFieldCheck('体质') }}</span>
                <header>
                  <div>
                    <small>先天禀赋</small>
                    <h5>体质 · {{ refinementPreview.体质?.名称 || '未填写' }}</h5>
                  </div>
                  <em>{{ previewFieldStatus('体质', '重新细化') }}</em>
                </header>
                <p v-if="previewFieldChanged('体质')" class="xy-refine-compare">
                  <b>当前</b>{{ refinementBaseline?.体质?.名称 || '未填写' }} <i>→</i><b class="is-ai">AI 建议</b
                  >{{ refinementPreview.体质?.名称 || '未填写' }}
                </p>
                <p v-else class="xy-refine-same-banner">AI 返回值与人物当前变量完全相同，无需重复写入</p>
                <div class="xy-refine-metrics is-compact">
                  <span
                    ><small>悟性</small><strong>{{ refinementPreview.体质?.悟性 ?? '?' }}</strong
                    ><em :class="deltaClass(refinementBaseline?.体质?.悟性, refinementPreview.体质?.悟性)">{{
                      formatDelta(refinementBaseline?.体质?.悟性, refinementPreview.体质?.悟性)
                    }}</em></span
                  >
                  <span
                    ><small>根骨</small><strong>{{ refinementPreview.体质?.根骨 ?? '?' }}</strong
                    ><em :class="deltaClass(refinementBaseline?.体质?.根骨, refinementPreview.体质?.根骨)">{{
                      formatDelta(refinementBaseline?.体质?.根骨, refinementPreview.体质?.根骨)
                    }}</em></span
                  >
                  <span
                    ><small>气感</small><strong>{{ refinementPreview.体质?.气感 ?? '?' }}</strong
                    ><em :class="deltaClass(refinementBaseline?.体质?.气感, refinementPreview.体质?.气感)">{{
                      formatDelta(refinementBaseline?.体质?.气感, refinementPreview.体质?.气感)
                    }}</em></span
                  >
                </div>
                <div class="xy-refine-effect-box">
                  <b>体质效果</b>
                  <p v-for="[name, effect] in recordEntries(refinementPreview.体质?.效果)" :key="name">
                    <span>{{ name }}</span
                    >{{ effect }}
                  </p>
                  <p v-if="recordEntries(refinementPreview.体质?.效果).length === 0"><span>特殊效果</span>无</p>
                  <p v-if="refinementPreview.体质?.元阴 != null">
                    <span>元阴</span>{{ refinementPreview.体质.元阴 ? '尚存' : '已失' }}
                  </p>
                  <p v-if="refinementPreview.体质?.元阳 != null">
                    <span>元阳</span>{{ refinementPreview.体质.元阳 ? '尚存' : '已失' }}
                  </p>
                </div>
              </button>

              <button
                type="button"
                class="xy-refine-full-card is-root"
                :class="previewCardClasses('灵根')"
                :disabled="!previewFieldChanged('灵根')"
                @click="togglePreviewField('灵根')"
              >
                <span class="xy-refine-card-check">{{ previewFieldCheck('灵根') }}</span>
                <header>
                  <div>
                    <small>先天禀赋</small>
                    <h5>灵根 · {{ refinementPreview.灵根?.名称 || '未填写' }}</h5>
                  </div>
                  <em>{{ previewFieldStatus('灵根', '有调整') }}</em>
                </header>
                <p v-if="previewFieldChanged('灵根')" class="xy-refine-compare">
                  <b>当前</b>{{ refinementBaseline?.灵根?.名称 || '未填写' }} <i>→</i><b class="is-ai">AI 建议</b
                  >{{ refinementPreview.灵根?.名称 || '未填写' }}
                </p>
                <p v-else class="xy-refine-same-banner">AI 返回值与人物当前变量完全相同，无需重复写入</p>
                <div class="xy-refine-root-display">
                  <span v-for="element in refinementPreview.灵根?.五行 || []" :key="element" :class="`is-${element}`">{{
                    element === '混沌' ? '混' : element
                  }}</span>
                  <div>
                    <small>品阶</small><strong>{{ refinementPreview.灵根?.品阶 || '未检测' }}</strong>
                  </div>
                </div>
              </button>

              <button
                type="button"
                class="xy-refine-full-card is-cinnabar is-wide"
                :class="previewCardClasses('修炼进度')"
                :disabled="!previewFieldChanged('修炼进度')"
                @click="togglePreviewField('修炼进度')"
              >
                <span class="xy-refine-card-check">{{ previewFieldCheck('修炼进度') }}</span>
                <header>
                  <div>
                    <small>修行状态</small>
                    <h5>修炼进度</h5>
                  </div>
                  <em>{{ previewFieldStatus('修炼进度', '有调整') }}</em>
                </header>
                <p v-if="!previewFieldChanged('修炼进度')" class="xy-refine-same-banner">
                  AI 返回值与人物当前变量完全相同，无需重复写入
                </p>
                <div class="xy-refine-progress-layout">
                  <div class="xy-refine-realm-seal">
                    <small>境界</small><strong>{{ refinementPreview.修炼进度?.境界 || '凡人' }}</strong
                    ><em>{{
                      valueChangeText(refinementBaseline?.修炼进度?.境界, refinementPreview.修炼进度?.境界)
                    }}</em>
                  </div>
                  <div class="xy-refine-progress-main">
                    <div>
                      <span
                        >当前进度 <b>{{ refinementPreview.修炼进度?.当前进度 ?? 0 }}</b> /
                        {{ refinementPreview.修炼进度?.进度上限 ?? 1 }}</span
                      ><em>{{
                        formatDelta(refinementBaseline?.修炼进度?.当前进度, refinementPreview.修炼进度?.当前进度)
                      }}</em>
                    </div>
                    <span class="xy-refine-progress-track"
                      ><i :style="{ width: progressPercent(refinementPreview.修炼进度) }"></i
                    ></span>
                    <p>
                      <span
                        >天谴 <b>{{ refinementPreview.修炼进度?.天谴 ?? 0 }}</b></span
                      >
                      <span
                        >丹毒 <b>{{ refinementPreview.修炼进度?.丹毒 ?? 0 }}</b></span
                      >
                      <span
                        >进度上限 <b>{{ refinementPreview.修炼进度?.进度上限 ?? 1 }}</b></span
                      >
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                class="xy-refine-full-card is-blue is-wide"
                :class="previewCardClasses('资源池')"
                :disabled="!previewFieldChanged('资源池')"
                @click="togglePreviewField('资源池')"
              >
                <span class="xy-refine-card-check">{{ previewFieldCheck('资源池') }}</span>
                <header>
                  <div>
                    <small>战斗资源</small>
                    <h5>资源池</h5>
                  </div>
                  <em>{{ previewFieldStatus('资源池', '数值重算') }}</em>
                </header>
                <p v-if="!previewFieldChanged('资源池')" class="xy-refine-same-banner">
                  AI 返回值与人物当前变量完全相同，无需重复写入
                </p>
                <div class="xy-refine-resource-grid">
                  <div class="xy-refine-resource">
                    <div>
                      <span>气血</span
                      ><strong
                        >{{ refinementPreview.资源池?.气血?.现值 ?? 0 }} /
                        {{ refinementPreview.资源池?.气血?.上限 ?? 1 }}</strong
                      ><em
                        >原 {{ refinementBaseline?.资源池?.气血?.现值 ?? 0 }} /
                        {{ refinementBaseline?.资源池?.气血?.上限 ?? 1 }}</em
                      >
                    </div>
                    <span class="xy-refine-resource-track is-hp"
                      ><i :style="{ width: resourcePercent(refinementPreview.资源池?.气血) }"></i
                    ></span>
                    <p>
                      现值 {{ formatDelta(refinementBaseline?.资源池?.气血?.现值, refinementPreview.资源池?.气血?.现值)
                      }}<span
                        >上限
                        {{
                          formatDelta(refinementBaseline?.资源池?.气血?.上限, refinementPreview.资源池?.气血?.上限)
                        }}</span
                      >
                    </p>
                  </div>
                  <div class="xy-refine-resource">
                    <div>
                      <span>灵气</span
                      ><strong
                        >{{ refinementPreview.资源池?.灵气?.现值 ?? 0 }} /
                        {{ refinementPreview.资源池?.灵气?.上限 ?? 1 }}</strong
                      ><em
                        >原 {{ refinementBaseline?.资源池?.灵气?.现值 ?? 0 }} /
                        {{ refinementBaseline?.资源池?.灵气?.上限 ?? 1 }}</em
                      >
                    </div>
                    <span class="xy-refine-resource-track is-mp"
                      ><i :style="{ width: resourcePercent(refinementPreview.资源池?.灵气) }"></i
                    ></span>
                    <p>
                      现值 {{ formatDelta(refinementBaseline?.资源池?.灵气?.现值, refinementPreview.资源池?.灵气?.现值)
                      }}<span
                        >上限
                        {{
                          formatDelta(refinementBaseline?.资源池?.灵气?.上限, refinementPreview.资源池?.灵气?.上限)
                        }}</span
                      >
                    </p>
                  </div>
                  <div class="xy-refine-speed-orb">
                    <small>遁速</small><strong>{{ refinementPreview.资源池?.遁速 ?? 0 }}</strong
                    ><span>m/s</span><em>原 {{ refinementBaseline?.资源池?.遁速 ?? 0 }}</em>
                  </div>
                </div>
              </button>

              <button
                type="button"
                class="xy-refine-full-card is-purple is-wide"
                :class="previewCardClasses('技艺')"
                :disabled="!previewFieldChanged('技艺')"
                @click="togglePreviewField('技艺')"
              >
                <span class="xy-refine-card-check">{{ previewFieldCheck('技艺') }}</span>
                <header>
                  <div>
                    <small>能力谱系</small>
                    <h5>技艺</h5>
                  </div>
                  <em>{{ previewFieldStatus('技艺', `${changedSkillCount} 项调整`) }}</em>
                </header>
                <p v-if="!previewFieldChanged('技艺')" class="xy-refine-same-banner">
                  AI 返回值与人物当前变量完全相同，无需重复写入
                </p>
                <div class="xy-refine-skill-columns">
                  <div v-for="category in ['生产类', '战斗类']" :key="category">
                    <h6>{{ category }}</h6>
                    <div>
                      <span
                        v-for="[name, value] in recordEntries(refinementPreview.技艺?.[category])"
                        :key="name"
                        :class="{ 'is-raised': skillChanged(category, name) }"
                      >
                        {{ name }} <b>{{ value }}</b
                        ><em v-if="skillChanged(category, name)">{{
                          formatDelta(refinementBaseline?.技艺?.[category]?.[name], value)
                        }}</em>
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section v-if="showPreviewGroup('text')" class="xy-refine-preview-group">
            <header class="xy-refine-section-title">
              <span>贰</span>
              <div>
                <h4>人物描写</h4>
                <p>长文本不再截断，可直接阅读写入后的完整内容</p>
              </div>
            </header>

            <div class="xy-refine-full-grid">
              <button
                type="button"
                class="xy-refine-full-card is-text"
                :class="previewCardClasses('性格')"
                :disabled="!previewFieldChanged('性格')"
                @click="togglePreviewField('性格')"
              >
                <span class="xy-refine-card-check">{{ previewFieldCheck('性格') }}</span>
                <header>
                  <div>
                    <small>人物内核</small>
                    <h5>性格</h5>
                  </div>
                  <em>{{ previewFieldStatus('性格', '细节补全') }}</em>
                </header>
                <p v-if="!previewFieldChanged('性格')" class="xy-refine-same-banner">AI 未对原有性格设定作出任何修改</p>
                <div v-else class="xy-refine-text-compare">
                  <b>当前</b>
                  <p>{{ refinementBaseline?.性格 || '未填写' }}</p>
                </div>
                <div class="xy-refine-text-compare is-ai">
                  <b>AI 建议 · 完整值</b>
                  <p>{{ refinementPreview.性格 || '未填写' }}</p>
                </div>
              </button>

              <button
                type="button"
                class="xy-refine-full-card is-rose"
                :class="previewCardClasses('外貌')"
                :disabled="!previewFieldChanged('外貌')"
                @click="togglePreviewField('外貌')"
              >
                <span class="xy-refine-card-check">{{ previewFieldCheck('外貌') }}</span>
                <header>
                  <div>
                    <small>人物外观</small>
                    <h5>外貌</h5>
                  </div>
                  <em>{{ previewFieldStatus('外貌', '细节补全') }}</em>
                </header>
                <p v-if="!previewFieldChanged('外貌')" class="xy-refine-same-banner">AI 未对原有外貌设定作出任何修改</p>
                <div v-else class="xy-refine-text-compare">
                  <b>当前</b>
                  <p>{{ refinementBaseline?.外貌 || '未填写' }}</p>
                </div>
                <div class="xy-refine-text-compare is-ai">
                  <b>AI 建议 · 完整值</b>
                  <p>{{ refinementPreview.外貌 || '未填写' }}</p>
                </div>
              </button>

              <button
                type="button"
                class="xy-refine-full-card is-indigo is-wide"
                :class="previewCardClasses('着装')"
                :disabled="!previewFieldChanged('着装')"
                @click="togglePreviewField('着装')"
              >
                <span class="xy-refine-card-check">{{ previewFieldCheck('着装') }}</span>
                <header>
                  <div>
                    <small>人物外观</small>
                    <h5>着装</h5>
                  </div>
                  <em>{{ previewFieldStatus('着装', '结构补全') }}</em>
                </header>
                <p v-if="!previewFieldChanged('着装')" class="xy-refine-same-banner">AI 未对原有着装设定作出任何修改</p>
                <div v-else class="xy-refine-text-compare">
                  <b>当前</b>
                  <p>{{ refinementBaseline?.着装 || '未填写' }}</p>
                </div>
                <div class="xy-refine-text-compare is-ai">
                  <b>AI 建议 · 完整值</b>
                  <p>{{ refinementPreview.着装 || '未填写' }}</p>
                </div>
              </button>
            </div>
          </section>

          <section v-if="showPreviewGroup('inventory')" class="xy-refine-preview-group">
            <header class="xy-refine-section-title">
              <span>叁</span>
              <div>
                <h4>新增库存</h4>
                <p>仅列出 AI 新增条目；原有库存不会重复显示或覆盖</p>
              </div>
            </header>
            <div v-if="inventoryPreviewEntries.length" class="xy-refine-inventory-grid">
              <ItemCard
                v-for="entry in inventoryPreviewEntries"
                :key="entry.key"
                :view="entry.view"
                :selected="selectedPreviewFields.includes(entry.key)"
                clickable
                badge="新增"
                badge-type="custom"
                @pick="togglePreviewField(entry.key)"
              />
            </div>
            <p v-else class="xy-refine-empty">AI 本次没有生成新的物品、功法、装备、傀儡或灵兽。</p>
          </section>
        </div>

        <div class="xy-refine-preview-actions">
          <div class="xy-refine-selection-state">
            <span>✓</span>
            <div>
              <strong
                >已选 <b>{{ selectedPreviewFields.length }}</b> /
                <b>{{ previewSelectionKeys.length }}</b> 项可修改内容</strong
              ><small>灰色卡片不会写回变量，也不会计入全选</small>
            </div>
          </div>
          <button type="button" class="xy-btn xy-btn-cancel" :disabled="busy" @click="discardPreview">全部放弃</button>
          <button
            type="button"
            class="xy-btn xy-btn-subtle"
            :disabled="busy || selectedPreviewFields.length === 0"
            @click="acceptSelectedPreview"
          >
            接受所选
          </button>
          <button
            type="button"
            class="xy-btn xy-btn-primary"
            :disabled="busy || previewSelectionKeys.length === 0"
            @click="acceptAllPreview"
          >
            全部接受
          </button>
        </div>
      </div>

      <div v-else class="xy-refine-actions">
        <button type="button" class="xy-refine-action" :disabled="busy" @click="refineCharacter">
          <span class="xy-refine-action-icon">◇</span>
          <span><strong>人物信息细化</strong><small>细化人物资料与库存；已有条目保留并补充。</small></span>
        </button>
        <button type="button" class="xy-refine-action" :disabled="busy" @click="generateWorldbook">
          <span class="xy-refine-action-icon">卷</span>
          <span>
            <strong>世界书生成</strong>
            <small :class="{ 'xy-refine-action-warning': duplicateWarning }">
              {{ duplicateWarning || '为已设定的人物生成独特的绿灯世界书。' }}
            </small>
          </span>
        </button>
      </div>

      <p v-if="busy" class="xy-refine-progress">{{ progress }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, onMounted, ref } from 'vue';
// 编入构建产物，运行时无需访问本地文件。
// 静态规则变量安全兜底
const characterPromptExample = '';
const mvuUpdateRules = '';
const nonCombatRules = '';
const coreCoefficientTable = '';
const refinementCharacterRules = '';
const comprehensionRules = '';
const productionRules = '';
const timeAdvanceRules = '';
const breakthroughRules = '';
const itemCultivationRules = '';
const cultivationGainRules = '';
const battleRules = '';
const statusRules = '';
const worldHierarchy = '';
const worldSkills = '';
const worldEconomy = '';
const worldRoots = '';
const worldEthics = '';
const worldSpecies = '';
const worldOverview = '';
const worldElements = '';
const worldItems = '';
const worldRealms = '';
import ItemCard from '../../自定义开局/components/ItemCard.vue';
import { dataToCardView } from '../../自定义开局/itemNormalizer';
import { CultivationStatusSchema } from '../schema';
import { useDataStore } from '../store';
import { closeCharacterRefinement, showToast, state } from '../composables';

// 与「【本格修仙】总结」脚本共用的聊天世界书绑定。
const SUMMARY_WORLDBOOK_PREFIX = '本格修仙总结世界书';
const SUMMARY_WORLDBOOK_VAR_KEY = 'summary_assistant_worldbook';
const store = useDataStore();
const busy = ref(false);
const progress = ref('');
const duplicateWarning = ref('');
const refinementPreview = ref<Record<string, any> | null>(null);
const refinementBaseline = ref<Record<string, any> | null>(null);
const refinementAdditions = ref<Record<string, Record<string, any>>>({});
const selectedPreviewFields = ref<string[]>([]);
const previewName = ref('');
const activePreviewFilter = ref<'all' | 'base' | 'text' | 'inventory'>('all');
const characterName = computed(() => state.characterRefinement || '未知人物');
const npc = computed(() => store.data.关系列表?.[characterName.value] as Record<string, any> | undefined);
const REFINEMENT_INPUT_FIELDS = [
  '寿元',
  '体质',
  '灵根',
  '修炼进度',
  '物品',
  '功法',
  '装备',
  '傀儡',
  '灵兽',
  '资源池',
  '技艺',
  '性格',
  '外貌',
  '着装',
] as const;
const REFINEMENT_CARD_FIELDS = ['寿元', '体质', '灵根', '修炼进度', '资源池', '技艺', '性格', '外貌', '着装'] as const;
const REFINEMENT_NPC_FIELDS = REFINEMENT_INPUT_FIELDS;
const PRESERVE_AND_EXTEND_FIELDS = ['物品', '功法', '装备', '傀儡', '灵兽'] as const;
const BASE_PREVIEW_FIELDS = ['寿元', '体质', '灵根', '修炼进度', '资源池', '技艺'] as const;
const TEXT_PREVIEW_FIELDS = ['性格', '外貌', '着装'] as const;

function previewFieldChanged(key: string): boolean {
  if (!REFINEMENT_CARD_FIELDS.includes(key as (typeof REFINEMENT_CARD_FIELDS)[number])) return true;
  return !_.isEqual(refinementBaseline.value?.[key], refinementPreview.value?.[key]);
}

const scalarPreviewCards = computed(() => {
  if (!refinementPreview.value) return [];
  return REFINEMENT_CARD_FIELDS.map(key => ({ key, changed: previewFieldChanged(key) }));
});

const inventoryPreviewEntries = computed(() =>
  PRESERVE_AND_EXTEND_FIELDS.flatMap(field =>
    Object.entries(refinementAdditions.value[field] || {}).map(([name, rawValue]) => {
      const value = rawValue as Record<string, any>;
      const type = field === '傀儡' || field === '灵兽' ? field : value.类型;
      return {
        key: `${field}:${name}`,
        field,
        name,
        value,
        view: dataToCardView(name, field, { 品质: value.品质, 境界: value.境界, 类型: type, 五行: value.五行 }, value),
      };
    }),
  ),
);

const previewSelectionKeys = computed(() => [
  ...scalarPreviewCards.value.filter(field => field.changed).map(field => field.key),
  ...inventoryPreviewEntries.value.map(entry => entry.key),
]);
const allPreviewFieldsSelected = computed(
  () =>
    previewSelectionKeys.value.length > 0 &&
    previewSelectionKeys.value.every(field => selectedPreviewFields.value.includes(field)),
);
const changedPreviewCount = computed(() => previewSelectionKeys.value.length);
const unchangedPreviewCount = computed(() => scalarPreviewCards.value.filter(field => !field.changed).length);
const previewFilters = computed(() => [
  { key: 'all' as const, label: '全部', count: scalarPreviewCards.value.length + inventoryPreviewEntries.value.length },
  { key: 'base' as const, label: '资质与数值', count: BASE_PREVIEW_FIELDS.length },
  { key: 'text' as const, label: '人物描写', count: TEXT_PREVIEW_FIELDS.length },
  { key: 'inventory' as const, label: '新增库存', count: inventoryPreviewEntries.value.length },
]);
const changedSkillCount = computed(() =>
  ['生产类', '战斗类'].reduce(
    (count, category) =>
      count +
      recordEntries(refinementPreview.value?.技艺?.[category]).filter(([name]) => skillChanged(category, name)).length,
    0,
  ),
);

function showPreviewGroup(group: 'base' | 'text' | 'inventory'): boolean {
  return activePreviewFilter.value === 'all' || activePreviewFilter.value === group;
}

function previewCardClasses(key: string) {
  return {
    'is-selected': selectedPreviewFields.value.includes(key),
    'is-disabled': !previewFieldChanged(key),
  };
}

function previewFieldCheck(key: string): string {
  if (!previewFieldChanged(key)) return '—';
  return selectedPreviewFields.value.includes(key) ? '✓' : '';
}

function previewFieldStatus(key: string, changedLabel: string): string {
  return previewFieldChanged(key) ? changedLabel : '与原值一致';
}

function formatDelta(before: unknown, after: unknown): string {
  const previous = Number(before);
  const next = Number(after);
  if (!Number.isFinite(previous) || !Number.isFinite(next)) return _.isEqual(before, after) ? '不变' : '有调整';
  const delta = next - previous;
  if (delta === 0) return '不变';
  return delta > 0 ? `+${delta}` : String(delta);
}

function deltaClass(before: unknown, after: unknown): string {
  const delta = Number(after) - Number(before);
  if (!Number.isFinite(delta) || delta === 0) return '';
  return delta > 0 ? 'is-up' : 'is-down';
}

function valueChangeText(before: unknown, after: unknown): string {
  return _.isEqual(before, after) ? '未改变境界' : `原 ${String(before || '未填写')}`;
}

function progressPercent(value: Record<string, any> | undefined): string {
  const current = Number(value?.当前进度) || 0;
  const maximum = Math.max(1, Number(value?.进度上限) || 1);
  return `${_.clamp((current / maximum) * 100, 0, 100).toFixed(1)}%`;
}

function resourcePercent(value: Record<string, any> | undefined): string {
  const current = Number(value?.现值) || 0;
  const maximum = Math.max(1, Number(value?.上限) || 1);
  return `${_.clamp((current / maximum) * 100, 0, 100).toFixed(1)}%`;
}

function skillChanged(category: string, name: string): boolean {
  return !_.isEqual(
    refinementBaseline.value?.技艺?.[category]?.[name],
    refinementPreview.value?.技艺?.[category]?.[name],
  );
}

function close() {
  if (!busy.value) closeCharacterRefinement();
}

function boundWorldbookNames(): string[] {
  if (typeof getCharWorldbookNames !== 'function') return [];
  const bound = getCharWorldbookNames('current');
  return [bound.primary, ...bound.additional].filter(
    (name): name is string => typeof name === 'string' && name.length > 0,
  );
}

async function readBoundWorldbooks(): Promise<Array<{ name: string; entries: WorldbookEntry[] }>> {
  if (typeof getWorldbook !== 'function') return [];
  const worldbooks = await Promise.all(
    boundWorldbookNames().map(async name => {
      try {
        return { name, entries: await getWorldbook(name) };
      } catch {
        return null;
      }
    }),
  );
  return worldbooks.filter((book): book is { name: string; entries: WorldbookEntry[] } => book !== null);
}

async function getCharacterRule(): Promise<string> {
  const rule = (await readBoundWorldbooks())
    .flatMap(book => book.entries)
    .find(entry => entry.enabled && entry.name.includes('角色生成规则'));
  if (!rule?.content?.trim()) {
    throw new Error('当前绑定世界书中没有启用的《角色生成规则》条目，无法进行人物细化。');
  }
  return rule.content;
}

function refinementFormatSample(): string {
  const start = mvuUpdateRules.indexOf('变量更新规则:');
  const end = mvuUpdateRules.indexOf('  关系列表:', start);
  return start >= 0 ? mvuUpdateRules.slice(start, end >= 0 ? end : undefined) : mvuUpdateRules;
}

function refinementReferences(): string {
  const entries = [
    ['非战斗判定规则', nonCombatRules],
    ['核心系数总表', coreCoefficientTable],
    ['角色生成规则', refinementCharacterRules],
    ['领悟规则', comprehensionRules],
    ['生产制作规则', productionRules],
    ['时间推进规则', timeAdvanceRules],
    ['突破规则', breakthroughRules],
    ['物品功法生成规则', itemCultivationRules],
    ['修为获取规则', cultivationGainRules],
    ['战斗规则', battleRules],
    ['状态规则', statusRules],
    ['世界层级', worldHierarchy],
    ['世界设定-技艺', worldSkills],
    ['世界设定-经济系统', worldEconomy],
    ['世界设定-灵根与体质', worldRoots],
    ['世界设定-伦理', worldEthics],
    ['世界设定-生命种族', worldSpecies],
    ['世界设定-世界观', worldOverview],
    ['世界设定-五行生克', worldElements],
    ['世界设定-物品功法', worldItems],
    ['世界设定-修为境界', worldRealms],
  ] as const;
  return `${entries.map(([name, content]) => `<${name}>\n${content}\n</${name}>`).join('\n\n')}\n\n<MVU变量格式样例>\n${refinementFormatSample()}\n</MVU变量格式样例>`;
}

function basePrompts(systemPrompt: string) {
  // 只列出世界书与专用提示词，未列出的酒馆原预设提示词不会发送。
  return [
    'world_info_before' as const,
    { role: 'system' as const, content: systemPrompt },
    'world_info_after' as const,
    'user_input' as const,
  ];
}

function refinementPrompts(systemPrompt: string) {
  // 人物细化是独立任务：不附带任何世界书背景条目、聊天上下文或酒馆预设。
  return [{ role: 'system' as const, content: systemPrompt }, 'user_input' as const];
}

function requestRuleRouterControl(mode: 'bypass' | 'forceRoute', reason: string): (() => void) | undefined {
  const router = (window.top as any)?.CultivationRuleRouter || (window as any).CultivationRuleRouter;
  const request =
    typeof router?.requestRoute === 'function'
      ? () => router.requestRoute(mode, reason)
      : mode === 'bypass' && typeof router?.requestBypass === 'function'
        ? () => router.requestBypass(reason)
        : mode === 'forceRoute' && typeof router?.requestForceRoute === 'function'
          ? () => router.requestForceRoute(reason)
          : undefined;
  const cancel = router?.cancelRequest || router?.cancelBypass || router?.cancelForceRoute;
  if (!request || typeof cancel !== 'function') return undefined;
  const id = request();
  return () => cancel(id);
}

function requestRuleRouterBypass(reason: string): (() => void) | undefined {
  return requestRuleRouterControl('bypass', reason);
}

function requestRuleRouterForceRoute(reason: string): (() => void) | undefined {
  return requestRuleRouterControl('forceRoute', reason);
}

function assertTextResult(result: string | GenerateToolCallResult): string {
  if (typeof result !== 'string') throw new Error('主 API 返回了工具调用而非所需的结构化结果。');
  return result;
}

function parseGeneratedJson(result: string): Record<string, any> {
  const trimmed = result.trim();
  // 参考 MVU 的脏数据容错：解开代码块、截取完整对象、清除尾随逗号，
  // 再兼容 JSON5 风格的引号/键名；最终仍由 Zod 校验并按白名单取值。
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  const start = candidate.indexOf('{');
  if (start < 0) throw new Error('主 API 返回的结构化数据无法解析，请重试。');
  let depth = 0;
  let quote = '';
  let escaped = false;
  let objectText = '';
  for (let index = start; index < candidate.length; index++) {
    const char = candidate[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}') depth--;
    if (depth === 0) {
      objectText = candidate.slice(start, index + 1);
      break;
    }
  }
  if (!objectText) throw new Error('主 API 返回的结构化数据不完整，请重试。');
  const attempts = [
    objectText,
    objectText
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, '$1'),
  ];
  for (const text of attempts) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // 尝试下一种修复形式。
    }
  }
  // 与 MVU 的 tryParseValue 一致，最后兼容 JavaScript 对象字面量。
  try {
    const parsed = new Function(`"use strict"; return (${attempts[1]});`)();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // 由下方统一报错。
  }
  throw new Error('主 API 返回的结构化数据无法解析，请重试。');
}

function refinementCharacterInput() {
  if (!npc.value) throw new Error(`未找到「${characterName.value}」的人物变量。`);
  const selected = _.pick(_.cloneDeep(npc.value), REFINEMENT_NPC_FIELDS);
  return JSON.stringify({ 名称: characterName.value, 境界: selected.修炼进度?.境界, ...selected }, null, 2);
}

const WORLDBOOK_VARIABLE_FIELDS = [
  '种族',
  '身份',
  '修炼进度',
  '寿元',
  '灵根',
  '体质',
  '技艺',
  '功法',
  '性格',
  '外貌',
  '着装',
] as const;

function worldbookCharacterInput() {
  if (!npc.value) throw new Error(`未找到「${characterName.value}」的人物变量。`);
  // 世界书生成只需要人物的稳定设定，避免把关系、装备、物品等动态变量交给模型。
  const selected = _.pick(_.cloneDeep(npc.value), WORLDBOOK_VARIABLE_FIELDS);
  return JSON.stringify({ 名称: characterName.value, ...selected }, null, 2);
}

function recordEntries(value: unknown): Array<[string, any]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, any>);
}

const characterVariableSchema = {
  name: 'cultivation_refined_npc',
  description: '一个完整的修仙 NPC 变量对象。',
  strict: false,
  value: {
    type: 'object',
    properties: { npc: { type: 'object' } },
    required: ['npc'],
    additionalProperties: false,
  },
};

async function refreshDuplicateWarning() {
  const name = characterName.value;
  if (!name) return;
  const books = await readBoundWorldbooks();
  const hit = books.find(book =>
    book.entries.some(
      entry =>
        entry.name === name ||
        entry.strategy?.keys?.some(key => String(key) === name) ||
        entry.content?.includes(`### ${name}`),
    ),
  );
  duplicateWarning.value = hit
    ? `警告：当前世界书「${hit.name}」已存在与「${name}」相关的人物条目；不会阻止本次生成。`
    : '';
}

async function refineCharacter() {
  if (busy.value) return;
  busy.value = true;
  progress.value = '正在读取细化规则并请求主 API…';
  try {
    const current = _.cloneDeep(npc.value);
    if (!current) throw new Error(`未找到「${characterName.value}」的人物变量。`);
    const systemPrompt = `你是修仙人物变量细化器。遵循下方列出的规则条目与变量格式样例。\n\n${refinementReferences()}\n\n任务：细化用户给出的一个 NPC 变量。只返回 JSON 对象中的 npc；不得输出推理、Markdown、EJS、剧情正文或代码。\n\n允许读取和更新的字段仅限：名称、寿元、体质、灵根、修炼进度（其中包含境界）、物品、功法、装备、傀儡、灵兽、资源池、技艺、性格、外貌、着装。名称只用于识别人物；境界只能写入修炼进度.境界，不能另建境界字段。\n\n硬性要求：\n1. 不得返回或改动其他字段。\n2. 物品、功法、装备、傀儡、灵兽必须是以名称为键的对象，不能是数组；根据规则补足合理的新条目。\n3. 输入中已有的物品、功法、装备、傀儡、灵兽必须完整保留：不得删除、改名、改数量或改字段。仅可新增不重名的条目。\n4. 输出严格遵循上方 MVU 变量格式样例；资源池不得超过上限，物品数量为合理非负数。\n5. 输出前必须自行验算所有数值：境界与进度上限、资源池当前值与上限、寿元、技艺数值、物品数量及新增条目数量均须符合所给规则与系数表；发现不一致时修正后再输出。\n6. 必须核验体质.效果：它必须是以效果名为键、数值化加成为值的对象，且至少有一条合规效果。每个值只能是明确的数值修正词条，如 "+25%"、"-10%"、"+3"、"+500 年"；禁止“恢复更快”“体魄强健”等无量化的自然语言描述。若效果缺失、为空、不是对象、含任一不合规值，或与体质不相称，则结合体质名称、三维、灵根及规则中的既有词条，为该体质确定并输出合规效果；不得重复悟性、根骨、气感本身已经表达的加成，也不得凭空编造规则外的机制。\n7. 只输出一个可被 JSON.parse 直接解析的对象，形如 {"npc":{"寿元":{...},"修炼进度":{"境界":"..."},...}}，禁止代码块。`;
    const cancelRouteBypass = requestRuleRouterBypass('人物细化');
    let result: string;
    try {
      result = assertTextResult(
        await generateRaw({
          user_input: `请细化以下人物变量：\n${refinementCharacterInput()}`,
          ordered_prompts: refinementPrompts(systemPrompt),
          // 保持酒馆停止按钮可中断；路由跳过由上方的一次性桥接标记处理。
          should_silence: false,
          max_chat_history: 0,
          json_schema: characterVariableSchema,
        }),
      );
    } finally {
      cancelRouteBypass?.();
    }
    const generated = parseGeneratedJson(result).npc;
    if (!generated || typeof generated !== 'object' || Array.isArray(generated))
      throw new Error('主 API 没有返回 npc 对象。');
    const generatedFields = _.pick(_.cloneDeep(generated), REFINEMENT_NPC_FIELDS);
    const candidate = { ...current, ...generatedFields };
    const additions: Record<string, Record<string, any>> = {};
    for (const field of PRESERVE_AND_EXTEND_FIELDS) {
      additions[field] = _.pickBy(generatedFields[field] || {}, (_entry, name) => !(name in (current[field] || {})));
      candidate[field] = { ...(generatedFields[field] || {}), ...(current[field] || {}) };
    }
    const next = _.cloneDeep(store.data) as Record<string, any>;
    next.关系列表 = { ...next.关系列表, [characterName.value]: candidate };
    const checked = CultivationStatusSchema.safeParse(next);
    if (!checked.success) throw new Error('细化结果不符合人物变量结构，已取消写入。');
    refinementBaseline.value = current;
    refinementPreview.value = checked.data.关系列表[characterName.value] as Record<string, any>;
    refinementAdditions.value = additions;
    previewName.value = characterName.value;
    activePreviewFilter.value = 'all';
    selectedPreviewFields.value = [...previewSelectionKeys.value];
    showToast(
      previewSelectionKeys.value.length
        ? '细化结果已生成，请在预览面板中确认是否写入。'
        : '细化结果已生成，但 AI 返回值与现有变量一致，无需写入。',
    );
  } catch (error) {
    console.error('[人物细化] 人物信息细化失败：', error);
    showToast(error instanceof Error ? error.message : '人物信息细化失败，请重试。');
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

function discardPreview() {
  refinementPreview.value = null;
  refinementBaseline.value = null;
  refinementAdditions.value = {};
  selectedPreviewFields.value = [];
  previewName.value = '';
  activePreviewFilter.value = 'all';
  showToast('已全部放弃本次人物细化结果。');
}

function toggleAllPreviewFields() {
  selectedPreviewFields.value = allPreviewFieldsSelected.value ? [] : [...previewSelectionKeys.value];
}

function togglePreviewField(key: string) {
  if (!previewSelectionKeys.value.includes(key)) return;
  selectedPreviewFields.value = selectedPreviewFields.value.includes(key)
    ? selectedPreviewFields.value.filter(field => field !== key)
    : [...selectedPreviewFields.value, key];
}

function acceptSelectedPreview(fields = selectedPreviewFields.value) {
  if (!refinementPreview.value) return;
  if (fields.length === 0) {
    showToast('请至少勾选一个要接受的变量。');
    return;
  }
  const current = _.cloneDeep(store.data.关系列表[characterName.value]) as Record<string, any>;
  if (!current) return;
  const scalarFields = fields.filter(field => REFINEMENT_CARD_FIELDS.includes(field as any));
  const accepted = _.pick(refinementPreview.value, scalarFields);
  const nextNpc = { ...current, ..._.cloneDeep(accepted) };
  for (const field of PRESERVE_AND_EXTEND_FIELDS) {
    const selectedNames = fields.filter(key => key.startsWith(`${field}:`)).map(key => key.slice(field.length + 1));
    if (selectedNames.length) {
      nextNpc[field] = { ...current[field], ..._.pick(refinementAdditions.value[field] || {}, selectedNames) };
    }
  }
  const next = _.cloneDeep(store.data) as Record<string, any>;
  next.关系列表 = { ...next.关系列表 };
  next.关系列表[characterName.value] = nextNpc;
  const checked = CultivationStatusSchema.safeParse(next);
  if (!checked.success) {
    showToast('所选细化结果不符合人物变量结构，未写入。');
    return;
  }
  store.data.关系列表 = checked.data.关系列表 as any;
  refinementPreview.value = null;
  refinementBaseline.value = null;
  refinementAdditions.value = {};
  selectedPreviewFields.value = [];
  previewName.value = '';
  activePreviewFilter.value = 'all';
  showToast(`已写入 ${fields.length} 项人物细化结果。`);
}

function acceptAllPreview() {
  acceptSelectedPreview([...previewSelectionKeys.value]);
}

const worldbookSchema = {
  name: 'cultivation_greenlight_entry',
  description: '一段按人物提示词模板写成、可直接写入酒馆世界书的绿灯人物设定。',
  strict: false,
  value: {
    type: 'object',
    properties: {
      keywords: { type: 'array', items: { type: 'string' } },
      content: { type: 'string' },
    },
    required: ['keywords', 'content'],
    additionalProperties: false,
  },
};

// === 可手动修改：世界书生成的人物模板、字段长度与 JSON 输出协议 ===
function worldbookTemplateInstructions(): string {
  return `

<人物模板>
${characterPromptExample}
</人物模板>

上方《人物模板》是 content 的唯一排版模板，必须完整保留其标题、字段、方括号性格小节及编号层级，并以当前人物的实际名称和设定替换全部占位符。不得照搬模板中的占位符、人名、势力或任何示例内容。

填写规范：
1. 标题固定为“### 人物名 (体型或年龄气质)”。“角色魅力”“着装(外)”“着装(内)”“法宝”“底色”五项逐项填写，字数遵守模板要求。
2. 将两个性格特征替换为最能表现该人物的具体短语；每个性格小节均保留①②③三条不同的生活细节，道侣相处保留①至④四条。各细节须与人物身份、境界、性格、势力和已知经历一致，不能重复。
3. “表白”“道侣相处”写该人物会如何主动表达爱意、如何经营亲密关系；没有既定道侣时也写其假设进入亲密关系后的稳定行为模式，不得把未出现的具体人物写成既定事实。
4. 不要额外添加模板外的字段，也不要删减模板已有字段；性别、体型、修为、灵根、法宝等事实应自然融入对应模板内容。

严格输出协议：只输出一个可被 JSON.parse 直接解析的 JSON 对象，禁止 Markdown 代码块、解释、前后缀或推理文字。输出形状必须严格如下：
{"keywords":["人物名","所属势力"],"content":"### 人物名 (少女)\\n角色魅力: ……\\n着装(外): ……\\n着装(内): ……\\n法宝: ……\\n底色: ……\\n\\n[性格特征A]\\n① ……\\n② ……\\n③ ……\\n\\n[性格特征B]\\n① ……\\n② ……\\n③ ……\\n\\n[表白]\\n……\\n\\n[道侣相处]\\n① ……\\n② ……\\n③ ……\\n④ ……"}`;
}

function uniqueKeywords(value: unknown): string[] {
  const fromModel = Array.isArray(value) ? value : [];
  return _.uniq(
    [characterName.value, ...fromModel]
      .filter((keyword): keyword is string => typeof keyword === 'string')
      .map(keyword => keyword.trim())
      .filter(Boolean),
  ).slice(0, 12);
}

function generateSummaryWorldbookName(): string {
  return `${SUMMARY_WORLDBOOK_PREFIX}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function readSummaryWorldbookBinding(): string | null {
  try {
    const value = getVariables({ type: 'chat' })?.[SUMMARY_WORLDBOOK_VAR_KEY];
    return typeof value === 'string' && value.trim() ? value : null;
  } catch {
    return null;
  }
}

function writeSummaryWorldbookBinding(name: string) {
  try {
    insertOrAssignVariables({ [SUMMARY_WORLDBOOK_VAR_KEY]: name }, { type: 'chat' });
  } catch (error) {
    console.warn('[人物细化] 无法写入总结世界书绑定：', error);
  }
}

async function ensureSummaryWorldbook(): Promise<string> {
  if (typeof createWorldbook !== 'function' || typeof createWorldbookEntries !== 'function') {
    throw new Error('当前酒馆助手缺少世界书写入接口。');
  }
  const names = getWorldbookNames();
  let name = readSummaryWorldbookBinding();
  if (!name || !names.includes(name)) {
    name = names.find(item => item.startsWith(SUMMARY_WORLDBOOK_PREFIX)) || generateSummaryWorldbookName();
    if (!names.includes(name)) await createWorldbook(name, []);
    writeSummaryWorldbookBinding(name);
  }
  if (typeof getGlobalWorldbookNames === 'function' && typeof rebindGlobalWorldbooks === 'function') {
    const globalNames = getGlobalWorldbookNames();
    if (!globalNames.includes(name)) await rebindGlobalWorldbooks([...new Set([...globalNames, name])]);
  }
  return name;
}

async function nextGeneratedEntryName(worldbookName: string): Promise<string> {
  const baseName = `人物-细化-${characterName.value}`;
  if (typeof getWorldbook !== 'function') return baseName;
  const entries = await getWorldbook(worldbookName);
  const hasBaseEntry = entries.some(entry => entry.name === baseName);
  if (!hasBaseEntry) return baseName;

  const prefix = `${baseName}(`;
  const suffixes = entries
    .map(entry => entry.name)
    .filter((name): name is string => typeof name === 'string' && name.startsWith(prefix) && name.endsWith(')'))
    .map(name => Number(name.slice(prefix.length, -1)))
    .filter(Number.isSafeInteger);
  return `${baseName}(${Math.max(0, ...suffixes) + 1})`;
}

function openSummaryWorldbook(worldbookName: string) {
  // 酒馆助手没有“打开某本世界书编辑器”的高层接口，兼容常见 ST 控件作最佳努力打开。
  const document = window.top?.document;
  document
    ?.querySelector<HTMLElement>('#world_button, #world_info_button, [data-target="#world_info"], [href="#world_info"]')
    ?.click();
  window.setTimeout(() => {
    const select = document?.querySelector<HTMLSelectElement>(
      '#world_editor_select, #world_info_select, select[name="worldbook"]',
    );
    const option = Array.from(select?.options || []).find(item => item.text === worldbookName);
    if (!select || !option) return;
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, 80);
}

async function generateWorldbook() {
  if (busy.value) return;
  busy.value = true;
  progress.value = '正在依当前世界书生成绿灯人物设定…';
  try {
    const rule = await getCharacterRule();
    // === 可手动修改：世界书生成的主提示词 ===
    const systemPrompt = `你是修仙世界书条目生成器。当前激活的世界书会随本请求提供；以世界观、上下文、当前人物变量、《角色生成规则》共同确定人物设定。\n\n<角色生成规则>\n${rule}\n</角色生成规则>\n\n任务：为尚未拥有绿灯条目的 NPC 补全一段可长期复用的人物设定。content 必须严格采用后附《人物模板》的完整结构；人物变量和当前世界书中已有的事实优先，不得相互矛盾。变量未给出的生活细节、性格表现、关系模式可依身份、修为、势力和修仙世界观合理创作，但不能写成会改变主线的既定事件。\n\n硬性要求：\n1. content 是可直接写入世界书的纯设定，不是剧情续写、人物卡 YAML 或变量面板；不得包含 EJS、JavaScript、模板标签（如 <% %>、{{ }}）、YAML 字段、关键字标题或代码，也不要编写动态分支。\n2. 必须完整填满人物模板的所有栏目、性格小节和编号条目；保持模板规定的字数范围、段落顺序和中文标点。\n3. keywords 返回 2~5 个应触发该人物的纯关键词，必须包含人物名；可补充道号、所属势力、稳定身份、常驻地点等，但不能使用泛词或整句。\n4. 允许情色表达(修仙世界的外貌与年龄无关，常有童颜修仙者)；不得出现疤痕、脏污或大规模纹身。`;
    const cancelForceRoute = requestRuleRouterForceRoute('人物世界书生成');
    let result: string;
    try {
      result = assertTextResult(
        await generateRaw({
          user_input: `请生成世界书人物条目：\n${worldbookCharacterInput()}`,
          ordered_prompts: basePrompts(`${systemPrompt}${worldbookTemplateInstructions()}`),
          should_silence: false,
          max_chat_history: 0,
          json_schema: worldbookSchema,
        }),
      );
    } finally {
      cancelForceRoute?.();
    }
    const generated = parseGeneratedJson(result);
    const content = typeof generated.content === 'string' ? generated.content.trim() : '';
    const keywords = uniqueKeywords(generated.keywords);
    if (!content || keywords.length === 0) throw new Error('主 API 返回的世界书条目不完整。');
    if (/<%|%>|{{|}}/.test(content)) throw new Error('生成内容包含 EJS 或模板语法，已拒绝写入。');

    progress.value = '正在写入总结世界书…';
    const worldbookName = await ensureSummaryWorldbook();
    const entryName = await nextGeneratedEntryName(worldbookName);
    const created = await createWorldbookEntries(
      worldbookName,
      [
        {
          name: entryName,
          enabled: true,
          strategy: {
            type: 'selective',
            keys: keywords,
            keys_secondary: { logic: 'and_any', keys: [] },
            scan_depth: 'same_as_global',
          },
          position: { type: 'before_character_definition', role: 'system', depth: 4, order: 200 },
          content,
          probability: 100,
          recursion: { prevent_incoming: false, prevent_outgoing: true, delay_until: null },
          effect: { sticky: null, cooldown: null, delay: null },
        },
      ],
      { render: 'immediate' },
    );
    if (!created.new_entries?.length) {
      throw new Error('世界书条目写入接口未返回新条目，已停止后续操作。');
    }
    openSummaryWorldbook(worldbookName);
    showToast(`已写入总结世界书「${worldbookName}」的条目「${created.new_entries[0].name}」，并已尝试打开世界书面板。`);
    await refreshDuplicateWarning();
  } catch (error) {
    console.error('[人物细化] 世界书生成失败：', error);
    showToast(error instanceof Error ? error.message : '世界书生成失败，请重试。');
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

onMounted(() => {
  void refreshDuplicateWarning();
});
</script>

<style scoped>
.xy-refine-overlay {
  position: fixed;
  inset: 0;
  z-index: 10003;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: var(--xy-overlay-mask, rgba(25, 21, 17, 0.48));
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
.xy-refine-dialog {
  width: min(660px, 100%);
  max-height: calc(100vh - 36px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 8px;
  background: var(--xy-paper, #f7f1e5);
  box-shadow: 0 18px 48px rgba(30, 24, 17, 0.28);
  color: var(--xy-ink, #332c25);
  overflow: hidden;
}
.xy-refine-dialog.has-preview {
  width: min(980px, 100%);
}
.xy-refine-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 11px;
  border-bottom: 1px solid transparent;
}
.xy-refine-head.has-preview {
  border-bottom-color: var(--xy-line, rgba(125, 103, 66, 0.24));
  background: linear-gradient(
    90deg,
    var(--xy-tint-gold-faint, rgba(177, 138, 66, 0.08)),
    transparent 55%,
    var(--xy-tint-jade-faint, rgba(91, 138, 114, 0.08))
  );
}
.xy-refine-kicker {
  margin: 0 0 2px;
  color: var(--xy-gold-deep, #806027);
  font-size: 10px;
  letter-spacing: 2px;
}
.xy-refine-head h3 {
  margin: 0;
  font-family: var(--xy-font-title);
  font-size: 19px;
  font-weight: 600;
}
.xy-refine-title-copy {
  min-width: 0;
  flex: 1;
}
.xy-refine-title-copy > small {
  display: block;
  margin-top: 2px;
  color: var(--xy-ink-mute);
  font-size: 10px;
}
.xy-refine-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}
.xy-refine-prototype-badge,
.xy-refine-preview-realm {
  padding: 2px 7px;
  border: 1px solid var(--xy-tint-cinnabar-mid, rgba(143, 44, 44, 0.28));
  border-radius: 9px;
  background: var(--xy-tint-cinnabar-faint, rgba(143, 44, 44, 0.08));
  color: var(--xy-cinnabar-deep, #8f2c2c);
  font-size: 9px;
  white-space: nowrap;
}
.xy-refine-prototype-badge {
  border-color: var(--xy-tint-jade-mid, rgba(91, 138, 114, 0.3));
  background: var(--xy-tint-jade-faint, rgba(91, 138, 114, 0.08));
  color: var(--xy-jade-deep, #3d6b54);
}
.xy-refine-change-summary {
  display: grid;
  grid-template-columns: auto auto 1px auto auto;
  align-items: baseline;
  gap: 5px;
  color: var(--xy-ink-mute);
  font-size: 9px;
}
.xy-refine-change-summary strong {
  color: var(--xy-ink, #332c25);
  font-size: 12px;
}
.xy-refine-change-summary i {
  width: 1px;
  height: 20px;
  margin: 0 3px;
  background: var(--xy-line, rgba(125, 103, 66, 0.24));
}
.xy-refine-close {
  flex: 0 0 auto;
  margin-left: 4px;
  border: 0;
  background: transparent;
  color: var(--xy-ink-mute);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}
.xy-refine-progress {
  margin: 0;
  padding: 0 16px 16px;
  font-size: 11px;
  color: var(--xy-jade-deep, #3d6b54);
}
.xy-refine-preview {
  --xs-line-gold: var(--xy-line-gold, #b89c65);
  --xs-line: var(--xy-line, rgba(125, 103, 66, 0.24));
  --xs-glass: var(--xy-glass, rgba(255, 255, 255, 0.35));
  --xs-paper-warm: var(--xy-paper-soft, rgba(255, 255, 255, 0.35));
  --xs-ink: var(--xy-ink, #332c25);
  --xs-ink-soft: var(--xy-ink-soft, #5f554b);
  --xs-ink-mute: var(--xy-ink-mute, #7c7064);
  --xs-gold: var(--xy-gold, #b18a42);
  --xs-gold-deep: var(--xy-gold-deep, #806027);
  --xs-jade: var(--xy-jade, #5b8a72);
  --xs-jade-deep: var(--xy-jade-deep, #3d6b54);
  --xs-cinnabar: var(--xy-cinnabar, #a94444);
  --xs-cinnabar-glow: rgba(169, 68, 68, 0.28);
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  border-top: 0;
  overflow: hidden;
  background: var(--xy-glass, rgba(255, 255, 255, 0.18));
}
.xy-refine-character-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 50%;
  color: var(--xy-gold-deep, #806027);
  font-family: var(--xy-font-title);
  font-size: 19px;
  box-shadow: inset 0 0 0 3px var(--xy-tint-gold-faint, rgba(177, 138, 66, 0.08));
}
.xy-refine-review-bar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
  background: rgba(255, 255, 255, 0.22);
}
.xy-refine-filter-tabs {
  display: flex;
  min-width: 0;
  gap: 4px;
  overflow-x: auto;
}
.xy-refine-filter-tabs button,
.xy-refine-select-all {
  padding: 5px 8px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--xy-ink-mute);
  font-size: 10px;
  white-space: nowrap;
  cursor: pointer;
}
.xy-refine-filter-tabs button b {
  display: inline-grid;
  min-width: 16px;
  height: 16px;
  margin-left: 3px;
  place-items: center;
  border-radius: 8px;
  background: rgba(80, 65, 48, 0.07);
  font-size: 9px;
}
.xy-refine-filter-tabs button.active {
  border-color: var(--xy-line-gold, #b89c65);
  background: var(--xy-paper-soft, rgba(255, 255, 255, 0.45));
  color: var(--xy-gold-deep, #806027);
}
.xy-refine-select-all {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  border-color: var(--xy-tint-jade-mid, rgba(91, 138, 114, 0.3));
  background: var(--xy-tint-jade-faint, rgba(91, 138, 114, 0.08));
  color: var(--xy-jade-deep, #3d6b54);
}
.xy-refine-select-all span {
  display: inline-grid;
  width: 14px;
  height: 14px;
  margin-right: 4px;
  place-items: center;
  border: 1px solid var(--xy-jade, #5b8a72);
  border-radius: 4px;
  color: #fff;
  background: var(--xy-jade, #5b8a72);
  font-size: 8px;
}
.xy-refine-select-all:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.xy-refine-preview-scroll {
  flex: 1 1 auto;
  min-height: 0;
  padding: 5px 14px 16px;
  overflow-y: auto;
  scrollbar-color: var(--xy-line-gold, #b89c65) transparent;
  scrollbar-width: thin;
}
.xy-refine-preview-group {
  padding-top: 11px;
}
.xy-refine-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.xy-refine-section-title > span {
  display: grid;
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 50%;
  color: var(--xy-gold-deep, #806027);
  font-size: 10px;
}
.xy-refine-section-title h4 {
  margin: 0;
  font-size: 13px;
  letter-spacing: 1px;
}
.xy-refine-section-title p {
  margin: 1px 0 0;
  color: var(--xy-ink-mute);
  font-size: 9px;
}
.xy-refine-full-grid,
.xy-refine-inventory-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.xy-refine-full-card {
  position: relative;
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
  border-left: 4px solid var(--xy-gold, #b18a42);
  border-radius: 8px;
  background: var(--xy-paper-soft, rgba(255, 255, 255, 0.35));
  color: var(--xy-ink, #332c25);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}
.xy-refine-full-card:hover:not(.is-disabled) {
  transform: translateY(-1px);
  border-color: var(--xy-line-gold, #b89c65);
  box-shadow: 0 7px 18px -13px rgba(60, 42, 24, 0.55);
}
.xy-refine-full-card.is-selected {
  outline: 2px solid var(--xy-cinnabar, #a94444);
  outline-offset: 1px;
  background: rgba(255, 252, 246, 0.78);
  box-shadow: inset 0 0 0 1px var(--xy-tint-cinnabar-faint, rgba(169, 68, 68, 0.12));
}
.xy-refine-full-card.is-disabled {
  opacity: 0.56;
  filter: grayscale(0.62);
  cursor: not-allowed;
}
.xy-refine-full-card.is-wide {
  grid-column: 1 / -1;
}
.xy-refine-full-card.is-jade {
  border-left-color: var(--xy-jade, #5b8a72);
}
.xy-refine-full-card.is-root {
  border-left-color: #8b927f;
}
.xy-refine-full-card.is-cinnabar {
  border-left-color: var(--xy-cinnabar, #a94444);
}
.xy-refine-full-card.is-blue {
  border-left-color: #4f7fa2;
}
.xy-refine-full-card.is-purple {
  border-left-color: #765b8d;
}
.xy-refine-full-card.is-rose {
  border-left-color: #b16774;
}
.xy-refine-full-card.is-indigo {
  border-left-color: #626c9b;
}
.xy-refine-card-check {
  position: absolute;
  top: 9px;
  right: 9px;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 5px;
  color: transparent;
  font-size: 10px;
  font-weight: 700;
}
.xy-refine-full-card.is-selected .xy-refine-card-check {
  border-color: var(--xy-cinnabar, #a94444);
  background: var(--xy-cinnabar, #a94444);
  color: #fff;
}
.xy-refine-full-card.is-disabled .xy-refine-card-check {
  border-color: #999;
  background: rgba(255, 255, 255, 0.25);
  color: #777;
}
.xy-refine-full-card > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 7px;
  padding-right: 26px;
  margin-bottom: 7px;
}
.xy-refine-full-card > header small {
  display: block;
  color: var(--xy-ink-mute);
  font-size: 8px;
  letter-spacing: 1.2px;
}
.xy-refine-full-card h5 {
  margin: 1px 0 0;
  font-size: 13px;
}
.xy-refine-full-card > header > em {
  flex: 0 0 auto;
  padding: 2px 7px;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 9px;
  background: var(--xy-tint-gold-faint, rgba(177, 138, 66, 0.08));
  color: var(--xy-gold-deep, #806027);
  font-size: 8px;
  font-style: normal;
}
.xy-refine-compare,
.xy-refine-same-banner {
  margin: 0 0 7px;
  padding: 5px 7px;
  border-radius: 5px;
  background: var(--xy-tint-gold-faint, rgba(177, 138, 66, 0.07));
  color: var(--xy-ink-mute);
  font-size: 9px;
}
.xy-refine-compare b {
  margin-right: 4px;
  color: var(--xy-ink-soft, #5f554b);
}
.xy-refine-compare b.is-ai {
  margin-left: 4px;
  color: var(--xy-jade-deep, #3d6b54);
}
.xy-refine-compare i {
  margin-left: 5px;
  color: var(--xy-cinnabar-deep, #8f2c2c);
  font-style: normal;
}
.xy-refine-same-banner {
  border: 1px dashed #aaa;
  background: rgba(255, 255, 255, 0.22);
  color: #777;
}
.xy-refine-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
}
.xy-refine-metrics > span {
  position: relative;
  padding: 6px;
  border: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.28);
}
.xy-refine-metrics small,
.xy-refine-metrics strong {
  display: block;
}
.xy-refine-metrics small {
  color: var(--xy-ink-mute);
  font-size: 8px;
}
.xy-refine-metrics strong {
  margin-top: 1px;
  font-size: 15px;
}
.xy-refine-metrics em {
  position: absolute;
  right: 5px;
  bottom: 5px;
  color: #999;
  font-size: 8px;
  font-style: normal;
}
.xy-refine-metrics em.is-up {
  color: var(--xy-jade-deep, #3d6b54);
}
.xy-refine-metrics em.is-down {
  color: var(--xy-cinnabar-deep, #8f2c2c);
}
.xy-refine-effect-box {
  margin-top: 7px;
  padding: 5px 8px;
  border-left: 2px solid var(--xy-gold, #b18a42);
  border-radius: 0 4px 4px 0;
  background: var(--xy-tint-gold-faint, rgba(177, 138, 66, 0.07));
}
.xy-refine-effect-box > b {
  color: var(--xy-gold-deep, #806027);
  font-size: 9px;
  letter-spacing: 1px;
}
.xy-refine-effect-box p {
  display: flex;
  gap: 6px;
  margin: 3px 0;
  color: var(--xy-ink-mute);
  font-size: 9px;
  line-height: 1.45;
}
.xy-refine-effect-box p span {
  flex: 0 0 auto;
  color: var(--xy-ink, #332c25);
  font-weight: 700;
}
.xy-refine-root-display {
  display: flex;
  align-items: center;
  gap: 5px;
}
.xy-refine-root-display > span {
  display: grid;
  width: 23px;
  height: 23px;
  place-items: center;
  border-radius: 50%;
  background: #888;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}
.xy-refine-root-display > span.is-金 {
  background: #c3a84f;
}
.xy-refine-root-display > span.is-木 {
  background: #68a469;
}
.xy-refine-root-display > span.is-水 {
  background: #5b91bf;
}
.xy-refine-root-display > span.is-火 {
  background: #be624e;
}
.xy-refine-root-display > span.is-土 {
  background: #9a744d;
}
.xy-refine-root-display > span.is-阴 {
  background: #755376;
}
.xy-refine-root-display > span.is-阳 {
  background: #d09a48;
}
.xy-refine-root-display > div {
  margin-left: auto;
  text-align: right;
}
.xy-refine-root-display small,
.xy-refine-root-display strong {
  display: block;
}
.xy-refine-root-display small {
  color: var(--xy-ink-mute);
  font-size: 8px;
}
.xy-refine-root-display strong {
  font-size: 10px;
}
.xy-refine-progress-layout {
  display: grid;
  grid-template-columns: 145px 1fr;
  gap: 10px;
}
.xy-refine-realm-seal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 10px;
  border: 1px solid var(--xy-tint-cinnabar-mid, rgba(143, 44, 44, 0.24));
  border-radius: 6px;
  background: var(--xy-tint-cinnabar-faint, rgba(143, 44, 44, 0.06));
}
.xy-refine-realm-seal small,
.xy-refine-realm-seal em {
  color: var(--xy-ink-mute);
  font-size: 8px;
  font-style: normal;
}
.xy-refine-realm-seal strong {
  color: var(--xy-cinnabar-deep, #8f2c2c);
  font-size: 15px;
}
.xy-refine-progress-main {
  padding: 5px 0;
}
.xy-refine-progress-main > div {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
}
.xy-refine-progress-main > div em {
  color: var(--xy-jade-deep, #3d6b54);
  font-style: normal;
}
.xy-refine-progress-track,
.xy-refine-resource-track {
  display: block;
  height: 6px;
  margin: 6px 0;
  overflow: hidden;
  border-radius: 4px;
  background: rgba(50, 40, 32, 0.1);
}
.xy-refine-progress-track i,
.xy-refine-resource-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--xy-gold, #b18a42), var(--xy-cinnabar, #a94444));
}
.xy-refine-progress-main p {
  display: flex;
  gap: 5px;
  margin: 0;
}
.xy-refine-progress-main p span {
  padding: 2px 7px;
  border: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
  border-radius: 8px;
  color: var(--xy-ink-mute);
  font-size: 8px;
}
.xy-refine-progress-main p b {
  color: var(--xy-ink, #332c25);
}
.xy-refine-resource-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 82px;
  gap: 7px;
}
.xy-refine-resource {
  padding: 7px 8px;
  border: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.28);
}
.xy-refine-resource > div {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 9px;
}
.xy-refine-resource > div strong {
  font-size: 12px;
}
.xy-refine-resource > div em {
  margin-left: auto;
  color: var(--xy-ink-mute);
  font-size: 8px;
  font-style: normal;
}
.xy-refine-resource-track.is-hp i {
  background: linear-gradient(90deg, #ce7474, #a94444);
}
.xy-refine-resource-track.is-mp i {
  background: linear-gradient(90deg, #71a0c5, #4f7fa2);
}
.xy-refine-resource p {
  display: flex;
  justify-content: space-between;
  margin: 0;
  color: var(--xy-jade-deep, #3d6b54);
  font-size: 8px;
}
.xy-refine-speed-orb {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(118, 91, 141, 0.26);
  border-radius: 6px;
  background: rgba(118, 91, 141, 0.06);
}
.xy-refine-speed-orb small,
.xy-refine-speed-orb span,
.xy-refine-speed-orb em {
  color: var(--xy-ink-mute);
  font-size: 8px;
  font-style: normal;
}
.xy-refine-speed-orb strong {
  color: #765b8d;
  font-size: 18px;
}
.xy-refine-skill-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}
.xy-refine-skill-columns h6 {
  margin: 0 0 5px;
  color: var(--xy-gold-deep, #806027);
  font-size: 9px;
  letter-spacing: 1px;
}
.xy-refine-skill-columns > div > div {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}
.xy-refine-skill-columns span {
  position: relative;
  padding: 5px 6px;
  border: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.28);
  color: var(--xy-ink-mute);
  font-size: 9px;
}
.xy-refine-skill-columns span b {
  float: right;
  color: var(--xy-ink, #332c25);
}
.xy-refine-skill-columns span.is-raised {
  border-color: var(--xy-tint-jade-mid, rgba(91, 138, 114, 0.3));
  background: var(--xy-tint-jade-faint, rgba(91, 138, 114, 0.08));
}
.xy-refine-skill-columns span em {
  position: absolute;
  top: -6px;
  right: 3px;
  padding: 0 3px;
  border-radius: 4px;
  background: var(--xy-jade, #5b8a72);
  color: #fff;
  font-size: 7px;
  font-style: normal;
}
.xy-refine-text-compare {
  padding: 6px 8px;
  border-radius: 5px;
  background: rgba(90, 75, 60, 0.04);
}
.xy-refine-text-compare + .xy-refine-text-compare {
  margin-top: 5px;
}
.xy-refine-text-compare > b {
  color: var(--xy-ink-mute);
  font-size: 8px;
  letter-spacing: 1px;
}
.xy-refine-text-compare p {
  margin: 3px 0 0;
  color: var(--xy-ink-mute);
  font-size: 9.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.xy-refine-text-compare.is-ai {
  border-left: 2px solid #b16774;
  background: rgba(177, 103, 116, 0.06);
}
.xy-refine-text-compare.is-ai > b {
  color: #964d5a;
}
.xy-refine-empty {
  margin: 0;
  padding: 16px;
  border: 1px dashed var(--xy-line-gold, #b89c65);
  border-radius: 7px;
  color: var(--xy-ink-mute);
  font-size: 10px;
  text-align: center;
}
.xy-refine-preview-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  border-top: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
  background: var(--xy-paper, rgba(247, 241, 229, 0.92));
}
.xy-refine-selection-state {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 7px;
}
.xy-refine-selection-state > span {
  display: grid;
  width: 27px;
  height: 27px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--xy-tint-jade-mid, rgba(91, 138, 114, 0.3));
  border-radius: 50%;
  background: var(--xy-tint-jade-faint, rgba(91, 138, 114, 0.08));
  color: var(--xy-jade-deep, #3d6b54);
}
.xy-refine-selection-state strong,
.xy-refine-selection-state small {
  display: block;
}
.xy-refine-selection-state strong {
  font-size: 10px;
}
.xy-refine-selection-state strong b {
  color: var(--xy-cinnabar-deep, #8f2c2c);
}
.xy-refine-selection-state small {
  margin-top: 2px;
  color: var(--xy-ink-mute);
  font-size: 8px;
}
@media (max-width: 720px) {
  .xy-refine-overlay {
    padding: 10px;
  }
  .xy-refine-dialog {
    max-height: calc(100vh - 20px);
  }
  .xy-refine-head {
    padding: 10px;
  }
  .xy-refine-change-summary {
    display: none;
  }
  .xy-refine-review-bar,
  .xy-refine-preview-scroll,
  .xy-refine-preview-actions {
    padding-right: 10px;
    padding-left: 10px;
  }
  .xy-refine-full-grid,
  .xy-refine-inventory-grid {
    grid-template-columns: 1fr;
  }
  .xy-refine-full-card.is-wide {
    grid-column: auto;
  }
  .xy-refine-progress-layout,
  .xy-refine-skill-columns {
    grid-template-columns: 1fr;
  }
  .xy-refine-resource-grid {
    grid-template-columns: 1fr 1fr;
  }
  .xy-refine-speed-orb {
    grid-column: 1 / -1;
    flex-direction: row;
    gap: 5px;
    padding: 6px;
  }
  .xy-refine-preview-actions {
    flex-wrap: wrap;
  }
  .xy-refine-selection-state {
    flex-basis: 100%;
  }
}
@media (max-width: 480px) {
  .xy-refine-character-avatar,
  .xy-refine-prototype-badge,
  .xy-refine-title-copy > small {
    display: none;
  }
  .xy-refine-review-bar {
    align-items: stretch;
    flex-direction: column;
  }
  .xy-refine-select-all {
    align-self: flex-end;
  }
  .xy-refine-resource-grid {
    grid-template-columns: 1fr;
  }
  .xy-refine-speed-orb {
    grid-column: auto;
  }
  .xy-refine-preview-actions .xy-btn {
    flex: 1;
  }
}
.xy-btn-subtle {
  border-color: var(--xy-line-gold, #b89c65);
  background: transparent;
  color: var(--xy-gold-deep, #806027);
}
.xy-btn-primary {
  border-color: var(--xy-jade, #5b8a72);
  background: var(--xy-jade, #5b8a72);
  color: #fff;
}
.xy-btn-primary:hover:not(:disabled) {
  filter: brightness(1.08);
}
.xy-refine-actions {
  display: grid;
  gap: 9px;
  padding: 0 16px 16px;
}
.xy-refine-action {
  display: flex;
  gap: 11px;
  align-items: center;
  width: 100%;
  padding: 11px;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 5px;
  background: var(--xy-glass, rgba(255, 255, 255, 0.35));
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: 0.16s ease;
}
.xy-refine-action:hover:not(:disabled) {
  border-color: var(--xy-gold, #b18a42);
  background: var(--xy-tint-gold-mid, rgba(177, 138, 66, 0.14));
  transform: translateY(-1px);
}
.xy-refine-action:disabled {
  opacity: 0.55;
  cursor: wait;
}
.xy-refine-action-icon {
  display: inline-flex;
  width: 25px;
  height: 25px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 50%;
  color: var(--xy-gold-deep, #806027);
  font-family: var(--xy-font-display);
}
.xy-refine-action strong,
.xy-refine-action small {
  display: block;
}
.xy-refine-action strong {
  margin-bottom: 2px;
  font-size: 12px;
}
.xy-refine-action small {
  color: var(--xy-ink-mute);
  font-size: 10px;
  line-height: 1.45;
}
.xy-refine-action small.xy-refine-action-warning {
  color: var(--xy-cinnabar-deep, #8f2c2c);
}
</style>
