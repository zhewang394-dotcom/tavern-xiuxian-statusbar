import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  PHYSIQUE_TIER_S,
  canMutate,
  canToggleElement,
  computeCustomItemCost,
  computeRootCost,
  deriveCustomStoryKind,
  difficulties,
  emptyPhysiqueChoice,
  emptyRootChoice,
  findDifficulty,
  findItem,
  isPhysiqueChoiceValid,
  makeDefaultPhysiqueChoice,
  mutationsByElement,
  normalizePhysiqueChoice,
  normalizeRootChoice,
  physiqueCost,
} from './config';
import type { ApiMode, CustomItem, CustomStory, Gender, PhysiqueTier, Preset, RootChoice, Selection } from './types';

const PRESETS_KEY = 'xs-presets-v1';

const emptySelection = (): Selection => ({
  difficultyId: null,
  root: emptyRootChoice(),
  physique: emptyPhysiqueChoice(),
  性别: '男',
  元阳元阴: true,
  locationId: null,
  门派归属: '',
  itemIds: [],
  customItems: [],
  storyId: null,
  customStory: null,
  道号: '',
  变量更新模式: '额外API',
});

const normalizeSelection = (raw: any): Selection => {
  const base = emptySelection();
  if (!raw || typeof raw !== 'object') return base;
  // 兼容老格式 customStories[]：取首个迁移为单值
  let customStory: CustomStory | null = null;
  if (raw.customStory && typeof raw.customStory === 'object') {
    customStory = raw.customStory;
  } else if (Array.isArray(raw.customStories) && raw.customStories.length > 0) {
    customStory = raw.customStories[0];
  }
  // 自创剧本不设「分类」：读取时按宗门字段归一化，清洗历史遗留的「特殊」等值
  if (customStory && typeof customStory.settings?.宗门 === 'string') {
    customStory = { ...customStory, 类型: deriveCustomStoryKind(customStory.settings.宗门) };
  }
  return {
    ...base,
    ...raw,
    root: normalizeRootChoice(raw.root),
    physique: normalizePhysiqueChoice(raw.physique),
    性别: raw.性别 === '女' || raw.性别 === '其他' ? raw.性别 : '男',
    元阳元阴: raw.性别 === '其他' ? false : typeof raw.元阳元阴 === 'boolean' ? raw.元阳元阴 : true,
    门派归属: typeof raw.门派归属 === 'string' ? raw.门派归属 : '',
    itemIds: Array.isArray(raw.itemIds) ? raw.itemIds : [],
    customItems: Array.isArray(raw.customItems) ? raw.customItems : [],
    customStory,
    道号: typeof raw.道号 === 'string' ? raw.道号 : '',
    变量更新模式: raw.变量更新模式 === '随主API' ? '随主API' : '额外API',
  };
};

const loadPresets = (): Preset[] => {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return (parsed as any[]).map(p => ({
        ...p,
        selection: normalizeSelection(p?.selection),
      })) as Preset[];
    }
  } catch {
    /* ignore */
  }
  return [];
};

const writePresets = (list: Preset[]) => {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

export const useStartStore = defineStore('xs-start', () => {
  // 当前步骤索引；0=封面，最大=确认页
  const stepIndex = ref(0);

  // 玩家选择
  const selection = ref<Selection>(emptySelection());

  // 持久化预设
  const presets = ref<Preset[]>(loadPresets());

  // 预设对话框开关（UI 局部，不持久化）
  const presetOpen = ref(false);

  // 通用 toast
  const toast = ref('');
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  function showToast(msg: string, durationMs = 2400) {
    toast.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toast.value === msg) toast.value = '';
    }, durationMs);
  }

  // ============ 当前难度对应的总点数 ============
  const totalPoints = computed(() => {
    const d = findDifficulty(selection.value.difficultyId);
    return d?.points ?? 0;
  });

  // ============ 灵根点数（动态） ============
  const rootCost = computed(() => computeRootCost(selection.value.root));

  // ============ 体质点数（动态） ============
  const physiqueCostValue = computed(() => physiqueCost(selection.value.physique));

  // ============ 自创资材点数（动态） ============
  const customItemsCost = computed(() => {
    let n = 0;
    for (const it of selection.value.customItems) {
      n += computeCustomItemCost({ 品质: it.品质, 境界: it.境界 });
    }
    return n;
  });

  // ============ 已花费点数 ============
  // 出生地、开局故事不计点数（按设定，仅影响世界观与起点）
  const spentPoints = computed(() => {
    const sel = selection.value;
    let n = 0;
    n += rootCost.value;
    n += physiqueCostValue.value;
    for (const itemId of sel.itemIds) n += findItem(itemId)?.cost ?? 0;
    n += customItemsCost.value;
    return n;
  });

  const remainingPoints = computed(() => totalPoints.value - spentPoints.value);

  const overBudget = computed(() => remainingPoints.value < 0);

  // 灵根是否已经选好（至少 1 个属性）
  const rootChosen = computed(() => selection.value.root.elements.length > 0);

  // 体质是否已合法选定
  const physiqueChosen = computed(() => isPhysiqueChoiceValid(selection.value.physique));

  // ============ 步骤切换 ============
  function next() {
    stepIndex.value += 1;
  }
  function prev() {
    if (stepIndex.value > 0) stepIndex.value -= 1;
  }
  function goto(i: number) {
    stepIndex.value = i;
  }

  // ============ 选择助手 ============
  function selectDifficulty(id: string) {
    selection.value.difficultyId = id;
  }

  /** 切换某个属性的选中状态；自动处理互斥与变异联动 */
  function toggleRootElement(el: string) {
    const choice = selection.value.root;
    if (!canToggleElement(choice, el)) return;
    const idx = choice.elements.indexOf(el);
    if (idx >= 0) {
      choice.elements.splice(idx, 1);
    } else {
      choice.elements.push(el);
    }
    // 元素变化后，若不再满足变异条件则关闭变异
    if (!canMutate(choice)) {
      choice.mutation = false;
      choice.mutationId = null;
      choice.customName = '';
    } else {
      // 变异预设若与新的属性不匹配则清空
      ensureMutationConsistency(choice);
    }
  }

  function setMutation(on: boolean) {
    const choice = selection.value.root;
    if (on && !canMutate(choice)) return;
    choice.mutation = on;
    if (!on) {
      choice.mutationId = null;
      choice.customName = '';
    } else {
      ensureMutationConsistency(choice);
    }
  }

  function setMutationId(id: string | null) {
    const choice = selection.value.root;
    if (!choice.mutation) return;
    choice.mutationId = id;
  }

  function setCustomMutationName(name: string) {
    const choice = selection.value.root;
    if (!choice.mutation) return;
    choice.customName = name;
  }

  function ensureMutationConsistency(choice: RootChoice) {
    if (!choice.mutation) return;
    const el = choice.elements[0];
    if (!el) return;
    const presets = mutationsByElement(el);
    if (choice.mutationId && !presets.find(p => p.id === choice.mutationId)) {
      // 当前所选预设属于不同属性 -> 重置
      choice.mutationId = null;
    }
  }

  // ============ 体质选择 ============
  function selectPhysiqueTier(tier: PhysiqueTier) {
    if (selection.value.physique.tier === tier) return;
    selection.value.physique = makeDefaultPhysiqueChoice(tier);
  }
  function selectPhysiquePreset(presetId: string | null) {
    selection.value.physique.presetId = presetId;
    if (presetId === null) {
      // 切到自拟，保留 tier，三维默认均分
      const tier = selection.value.physique.tier;
      const fresh = makeDefaultPhysiqueChoice(tier);
      selection.value.physique.custom悟性 = fresh.custom悟性;
      selection.value.physique.custom根骨 = fresh.custom根骨;
      selection.value.physique.custom气感 = fresh.custom气感;
      // 非凡体若无效果槽则补一个空槽，避免新手看不到编辑器入口
      if (tier !== '凡体' && selection.value.physique.customEffects.length === 0) {
        selection.value.physique.customEffects.push({ name: '', value: '' });
      }
    }
  }
  function setPhysiqueCustomName(name: string) {
    selection.value.physique.customName = name;
  }
  function addPhysiqueCustomEffect() {
    selection.value.physique.customEffects.push({ name: '', value: '' });
  }
  function removePhysiqueCustomEffect(index: number) {
    const arr = selection.value.physique.customEffects;
    if (index < 0 || index >= arr.length) return;
    arr.splice(index, 1);
    // 非凡体至少保留 1 条空槽以便重新填写
    if (selection.value.physique.tier !== '凡体' && arr.length === 0) {
      arr.push({ name: '', value: '' });
    }
  }
  function setPhysiqueCustomEffectAt(index: number, name: string, value: string) {
    const arr = selection.value.physique.customEffects;
    if (index < 0 || index >= arr.length) return;
    arr[index] = { name, value };
  }
  function setPhysiqueCustomStat(key: '悟性' | '根骨' | '气感', value: number) {
    const v = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    if (key === '悟性') selection.value.physique.custom悟性 = v;
    else if (key === '根骨') selection.value.physique.custom根骨 = v;
    else selection.value.physique.custom气感 = v;
  }
  /** 自动把当前差额补到指定维度上，使总和等于 S */
  function autoBalancePhysique(targetKey: '悟性' | '根骨' | '气感') {
    const choice = selection.value.physique;
    const S = PHYSIQUE_TIER_S[choice.tier];
    const sum = choice.custom悟性 + choice.custom根骨 + choice.custom气感;
    const delta = S - sum;
    if (delta === 0) return;
    if (targetKey === '悟性') choice.custom悟性 = Math.max(1, choice.custom悟性 + delta);
    else if (targetKey === '根骨') choice.custom根骨 = Math.max(1, choice.custom根骨 + delta);
    else choice.custom气感 = Math.max(1, choice.custom气感 + delta);
  }
  function selectLocation(id: string) {
    selection.value.locationId = id;
  }
  /** 选择门派归属：''=无 / '散修' / 宗门名（不限出生地，可自由选择全域门派） */
  function selectMenpai(v: string) {
    selection.value.门派归属 = v;
  }
  function toggleItem(id: string) {
    const arr = selection.value.itemIds;
    const idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(id);
  }
  function isItemSelected(id: string): boolean {
    return selection.value.itemIds.includes(id);
  }
  // ============ 自创资材 ============
  function addCustomItem(item: Omit<CustomItem, 'id'>): CustomItem {
    const full: CustomItem = {
      ...item,
      id: 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    };
    selection.value.customItems.push(full);
    return full;
  }
  function updateCustomItem(id: string, patch: Partial<Omit<CustomItem, 'id'>>) {
    const idx = selection.value.customItems.findIndex(c => c.id === id);
    if (idx < 0) return;
    selection.value.customItems[idx] = { ...selection.value.customItems[idx], ...patch };
  }
  function removeCustomItem(id: string) {
    const idx = selection.value.customItems.findIndex(c => c.id === id);
    if (idx >= 0) selection.value.customItems.splice(idx, 1);
  }

  // ============ 性别 / 元阳元阴 ============
  function setGender(g: Gender) {
    selection.value.性别 = g;
    // “其他”不显示尚存/已损选项；导出时会将元阳、元阴都写为 null。
    if (g === '其他') selection.value.元阳元阴 = false;
  }
  function setVirgin(v: boolean) {
    if (selection.value.性别 === '其他') return;
    selection.value.元阳元阴 = v;
  }

  // ============ 自创开局剧本（仅一篇） ============
  /** 写入或替换玩家的自创剧本；返回完整对象 */
  function setCustomStory(story: Omit<CustomStory, 'id'>): CustomStory {
    const existing = selection.value.customStory;
    const full: CustomStory = {
      ...story,
      id: existing?.id || 'cstory-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    };
    selection.value.customStory = full;
    return full;
  }
  function clearCustomStory() {
    const id = selection.value.customStory?.id;
    selection.value.customStory = null;
    if (id && selection.value.storyId === id) selection.value.storyId = null;
  }

  function selectStory(id: string) {
    selection.value.storyId = id;
  }

  // ============ 变量更新模式 ============
  function setApiMode(mode: ApiMode) {
    selection.value.变量更新模式 = mode;
  }

  function resetAll() {
    selection.value = emptySelection();
    stepIndex.value = 0;
  }

  // 选择默认难度后的初始化（仅在还未选时）
  function ensureDefaultDifficulty() {
    if (!selection.value.difficultyId && difficulties.length > 0) {
      const normal = difficulties.find(d => d.id === 'normal');
      selection.value.difficultyId = normal?.id ?? difficulties[0].id;
    }
  }

  // ============ 预设保存 / 读取 ============
  function savePreset(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('请输入命途名');
      return false;
    }
    const preset: Preset = {
      id: 'p-' + Date.now().toString(36),
      name: trimmed,
      createdAt: new Date().toISOString(),
      selection: JSON.parse(JSON.stringify(selection.value)),
    };
    presets.value = [preset, ...presets.value].slice(0, 30); // 最多保留 30 条
    writePresets(presets.value);
    showToast('已封存命途');
    return true;
  }

  function loadPreset(id: string) {
    const p = presets.value.find(x => x.id === id);
    if (!p) return false;
    selection.value = normalizeSelection(JSON.parse(JSON.stringify(p.selection)));
    showToast(`已读取「${p.name}」`);
    return true;
  }

  function deletePreset(id: string) {
    presets.value = presets.value.filter(p => p.id !== id);
    writePresets(presets.value);
  }

  return {
    stepIndex,
    selection,
    presets,
    presetOpen,
    toast,
    totalPoints,
    spentPoints,
    remainingPoints,
    overBudget,
    rootCost,
    rootChosen,
    physiqueCost: physiqueCostValue,
    physiqueChosen,
    next,
    prev,
    goto,
    selectDifficulty,
    toggleRootElement,
    setMutation,
    setMutationId,
    setCustomMutationName,
    selectPhysiqueTier,
    selectPhysiquePreset,
    setPhysiqueCustomName,
    addPhysiqueCustomEffect,
    removePhysiqueCustomEffect,
    setPhysiqueCustomEffectAt,
    setPhysiqueCustomStat,
    autoBalancePhysique,
    selectLocation,
    selectMenpai,
    toggleItem,
    isItemSelected,
    addCustomItem,
    updateCustomItem,
    removeCustomItem,
    customItemsCost,
    setGender,
    setVirgin,
    setCustomStory,
    clearCustomStory,
    selectStory,
    setApiMode,
    resetAll,
    ensureDefaultDifficulty,
    savePreset,
    loadPreset,
    deletePreset,
    showToast,
  };
});
