// 修仙状态栏 · 跨组件共享：状态、常量、辅助函数、computed
// 所有模块级 reactive/ref 在被 import 时构造一次，保持单例语义
import _ from 'lodash';
import { computed, reactive, ref } from 'vue';
import { useDataStore } from './store';

export const store = useDataStore();

// =============== 全局 UI 状态 ===============
export const state = reactive({
  currentTab: 0,
  storageTab: 0,
  openedNPC: null as string | null,
  openedBuff: null as string | null,
  rumorFilter: 'all' as string,
  artFilter: 'all' as string,
  itemFilter: 'all' as string,
  equipFilter: 'all' as string,
  puppetFilter: 'all' as string,
  beastFilter: 'all' as string,
  lightboxImage: null as string | null,
  toast: '' as string,
  appCollapsed: false,
  confirmDelete: null as null | { kind: string; key: string; label: string },
});

// =============== 静态常量 ===============
export const tabs = [
  { label: '技艺', icon: '技' },
  { label: '储物', icon: '囊' },
  { label: '关系', icon: '缘' },
  { label: '资产', icon: '产' },
  { label: '传闻', icon: '闻' },
  { label: '地图', icon: '舆' },
];

export const storageTabs = [
  { key: '功法', label: '功法' },
  { key: '物品', label: '物品' },
  { key: '装备', label: '装备' },
  { key: '傀儡', label: '傀儡' },
  { key: '灵兽', label: '灵兽' },
] as const;

export const rumorGroups = [
  { key: 'world', label: '修仙界要闻', types: ['大派动向', '仙人行迹', '宗门战事', '灵脉异变', '道庭法令'] },
  { key: 'mystic', label: '秘境异闻', types: ['秘境传闻', '高额悬赏', '妖兽异动', '通缉魔修', '宝物现世'] },
  { key: 'jiang', label: '江湖逸闻', types: ['风流韵事', '千里同心', '缘分将至', '邂逅预兆', '恩怨流转'] },
  { key: 'sect', label: '宗门内务', types: ['同门轶事', '师长动向', '门内任务', '资源调配', '内部秘辛'] },
] as const;

export const artTypes = ['心法', '攻击', '咒法', '身法', '护体', '幻术', '神识', '其他'] as const;
export const itemTypes = ['秘籍', '配方', '符箓', '丹药', '素材', '工具', '其他'] as const;
export const equipTypes = ['法宝', '护甲', '饰品'] as const;
export const qualityRanks = ['凡', '黄', '玄', '地', '天'] as const;

// 互斥功法类型（同 NPC/玩家 同类型只能一个生效）
export const EXCLUSIVE_ART_TYPES = ['心法', '护体', '身法'] as const;

// 主境界等级（依《核心系数总表》）
export const MAJOR_RANKS: Record<string, number> = {
  凡人: 0,
  炼气: 1,
  练气: 1,
  筑基: 2,
  金丹: 3,
  元婴: 4,
  化神: 5,
  返虚: 6,
  炼虚: 6,
  合体: 7,
  大乘: 8,
  渡劫: 9,
  飞升: 9,
};
export const SUB_RANKS: Record<string, number> = { 初期: 0, 中期: 1, 后期: 2 };

export const USER_AVATAR_KEY = '__user__';
const NPC_AVATAR_KEY = (name: string) => `xy-npc-avatar::${name}`;
const NPC_AVATAR_HI_KEY = (name: string) => `xy-npc-avatar-hi::${name}`;

// =============== 通用辅助 ===============
export const elColor = (el: string) =>
  (
    ({
      金: 'var(--xy-el-jin)',
      木: 'var(--xy-el-mu)',
      水: 'var(--xy-el-shui)',
      火: 'var(--xy-el-huo)',
      土: 'var(--xy-el-tu)',
      阴: 'var(--xy-el-yin)',
      阳: 'var(--xy-el-yang)',
      混沌: 'var(--xy-el-hundun)',
    }) as Record<string, string>
  )[el] || 'var(--xy-ink)';

export const skillPct = (v: number) => Math.max(2, Math.min(100, v));
export const barPct = (cur: number, total: number) => Math.max(0, Math.min(100, (cur / Math.max(total, 1)) * 100));

export const npcBarPct = (pool?: { 现值?: number; 上限?: number }) => {
  if (!pool) return 0;
  const cur = pool.现值 ?? 0;
  const max = Math.max(pool.上限 ?? 1, 1);
  return Math.max(0, Math.min(100, (cur / max) * 100));
};

export const avatarChar = (name: string) => {
  const m = name.match(/^([^\s【[]+)/);
  return (m ? m[1] : name).slice(0, 1);
};

export const favorLabel = (n: number) => {
  if (n >= 80) return '至交';
  if (n >= 50) return '亲密';
  if (n >= 20) return '友善';
  if (n >= -10) return '中立';
  if (n >= -50) return '提防';
  return '仇敌';
};
export const favorClass = (n: number) => {
  if (n >= 50) return 'xy-favor-high';
  if (n >= 0) return 'xy-favor-mid';
  if (n >= -30) return 'xy-favor-low';
  return 'xy-favor-bad';
};

export const realmScore = (realm: string): number => {
  if (!realm) return 0;
  let major = -1;
  let prefixLen = 0;
  for (const k of Object.keys(MAJOR_RANKS)) {
    if (realm.startsWith(k) && k.length > prefixLen) {
      major = MAJOR_RANKS[k];
      prefixLen = k.length;
    }
  }
  if (major < 0) major = 0;
  const subPart = realm.slice(prefixLen);
  let sub = 0;
  for (const k of Object.keys(SUB_RANKS)) {
    if (subPart.includes(k)) {
      sub = SUB_RANKS[k];
      break;
    }
  }
  return major * 10 + sub;
};

export const countField = (rec: Record<string, any> | undefined, field: string, value: string): number => {
  if (!rec) return 0;
  let n = 0;
  for (const v of Object.values(rec)) if (v?.[field] === value) n++;
  return n;
};

export const filterRecord = <T extends Record<string, any>>(
  rec: T | undefined,
  field: string,
  value: string,
): Record<string, any> => {
  if (!rec) return {};
  if (value === 'all') return rec;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(rec)) {
    if ((v as any)?.[field] === value) out[k] = v;
  }
  return out;
};

export const hasSkills = (npc: any) => !_.isEmpty(npc?.技艺?.生产类) || !_.isEmpty(npc?.技艺?.战斗类);

export const hasStorage = (npc: any) => {
  if (!npc) return false;
  return (
    (npc.灵石 ?? 0) > 0 || !_.isEmpty(npc.物品) || !_.isEmpty(npc.装备) || !_.isEmpty(npc.傀儡) || !_.isEmpty(npc.灵兽)
  );
};

// =============== NPC 详情区折叠 ===============
const npcSectionOpen = reactive<Record<string, Record<string, boolean>>>({});
export const isSectionOpen = (name: string, section: string): boolean => !!npcSectionOpen[name]?.[section];
export const toggleSection = (name: string, section: string) => {
  if (!npcSectionOpen[name]) npcSectionOpen[name] = {};
  npcSectionOpen[name][section] = !npcSectionOpen[name][section];
};

// =============== Toast ===============
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export const showToast = (msg: string) => {
  state.toast = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (state.toast === msg) state.toast = '';
  }, 2800);
};

// =============== Lightbox ===============
export const openLightbox = (url: string) => {
  if (url) state.lightboxImage = url;
};
export const closeLightbox = () => {
  state.lightboxImage = null;
};

// =============== NPC 头像（玩家本地上传） ===============
const npcAvatars = reactive<Record<string, string>>({});
export const avatarFileInput = ref<HTMLInputElement | null>(null);
const pendingAvatarFor = ref<string | null>(null);

export const getNpcAvatar = (name: string): string => {
  if (name in npcAvatars) return npcAvatars[name];
  let v = '';
  try {
    v = localStorage.getItem(NPC_AVATAR_KEY(name)) || '';
  } catch {
    /* localStorage 不可用 */
  }
  npcAvatars[name] = v;
  return v;
};

export const getNpcAvatarHi = (name: string): string => {
  try {
    const hi = localStorage.getItem(NPC_AVATAR_HI_KEY(name));
    if (hi) return hi;
  } catch {
    /* ignore */
  }
  return getNpcAvatar(name);
};

export const triggerAvatarUpload = (name: string) => {
  pendingAvatarFor.value = name;
  avatarFileInput.value?.click();
};

const resizeImageToDataUrl = (file: File, maxSize: number, quality = 0.85): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas context unavailable'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('file read failed'));
    reader.readAsDataURL(file);
  });

export const onAvatarFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  const name = pendingAvatarFor.value;
  input.value = '';
  pendingAvatarFor.value = null;
  if (!file || !name) return;
  try {
    const [thumb, hi] = await Promise.all([
      resizeImageToDataUrl(file, 192, 0.85),
      resizeImageToDataUrl(file, 2048, 0.92),
    ]);
    localStorage.setItem(NPC_AVATAR_KEY(name), thumb);
    try {
      localStorage.setItem(NPC_AVATAR_HI_KEY(name), hi);
    } catch (quotaErr) {
      try {
        localStorage.removeItem(NPC_AVATAR_HI_KEY(name));
      } catch {
        /* */
      }
      console.warn('[修仙状态栏] 高清头像存储失败（容量不足），仅保留缩略图', quotaErr);
    }
    npcAvatars[name] = thumb;
  } catch (err) {
    console.error('[修仙状态栏] 头像上传失败', err);
  }
};

export const clearNpcAvatar = (name: string) => {
  try {
    localStorage.removeItem(NPC_AVATAR_KEY(name));
    localStorage.removeItem(NPC_AVATAR_HI_KEY(name));
  } catch {
    /* ignore */
  }
  npcAvatars[name] = '';
};

export const onAvatarClick = (key: string, ev: MouseEvent) => {
  const thumb = getNpcAvatar(key);
  if (thumb) {
    ev.stopPropagation();
    openLightbox(getNpcAvatarHi(key) || thumb);
  }
};

// =============== 删除确认 ===============
export const requestDelete = (kind: string, key: string, label?: string) => {
  state.confirmDelete = { kind, key, label: label || key };
};
export const cancelDelete = () => {
  state.confirmDelete = null;
};
export const performDelete = () => {
  const c = state.confirmDelete;
  if (!c || !store.data) return;
  const data = store.data as any;
  switch (c.kind) {
    case 'art':
      if (data.功法) delete data.功法[c.key];
      break;
    case 'item':
      if (data.物品) delete data.物品[c.key];
      break;
    case 'equip':
      if (data.装备) delete data.装备[c.key];
      break;
    case 'puppet':
      if (data.傀儡) delete data.傀儡[c.key];
      break;
    case 'beast':
      if (data.灵兽) delete data.灵兽[c.key];
      break;
    case 'npc':
      if (data.关系列表) delete data.关系列表[c.key];
      clearNpcAvatar(c.key);
      if (state.openedNPC === c.key) state.openedNPC = null;
      break;
  }
  state.confirmDelete = null;
};

// =============== 功法切换 ===============
export const canControlNpc = (npc: any): boolean => !!npc?.道侣 || (npc?.好感度 ?? 0) > 80;

export const isArtEffectivelyActive = (npc: any, artName: string, art: any): boolean => {
  if (canControlNpc(npc)) return !!art?.使用中;
  if (!EXCLUSIVE_ART_TYPES.includes(art?.类型)) return !!art?.使用中;
  const arts = npc?.功法 || {};
  let bestName = '';
  let bestRealm = -2;
  let bestQuality = -2;
  for (const [n, a] of Object.entries(arts) as [string, any][]) {
    if (a?.类型 !== art.类型) continue;
    const rs = realmScore(a.境界 || '');
    const qs = qualityRanks.indexOf(a.品质);
    if (rs > bestRealm || (rs === bestRealm && qs > bestQuality)) {
      bestRealm = rs;
      bestQuality = qs;
      bestName = n;
    }
  }
  return bestName === artName;
};

export const toggleArt = (name: string, value: boolean) => {
  const arts = store.data?.功法 as Record<string, any> | undefined;
  if (!arts) return;
  const art = arts[name];
  if (!art) return;
  if (value && (EXCLUSIVE_ART_TYPES as readonly string[]).includes(art.类型)) {
    for (const [k, v] of Object.entries(arts)) {
      if (k !== name && v.使用中 && v.类型 === art.类型) v.使用中 = false;
    }
  }
  art.使用中 = value;
};

export const toggleNpcArt = (npcName: string, artName: string, value: boolean) => {
  const list = store.data?.关系列表 as Record<string, any> | undefined;
  const npc = list?.[npcName];
  if (!npc) return;
  if (!canControlNpc(npc)) {
    showToast(`需与「${npcName}」结为道侣或好感度大于 80，方可调整其功法`);
    return;
  }
  const arts = npc.功法 as Record<string, any> | undefined;
  const art = arts?.[artName];
  if (!arts || !art) return;
  if (value && (EXCLUSIVE_ART_TYPES as readonly string[]).includes(art.类型)) {
    for (const [k, v] of Object.entries(arts)) {
      if (k !== artName && v.使用中 && v.类型 === art.类型) v.使用中 = false;
    }
  }
  art.使用中 = value;
};

export const toggleUnit = (kind: '傀儡' | '灵兽', name: string, value: boolean) => {
  const slot = (store.data as any)?.[kind];
  if (slot && slot[name]) slot[name].使用中 = value;
};

// =============== 储物 / 关系 / 传闻 计算属性 ===============
export const filteredArts = computed(() => filterRecord(store.data?.功法, '类型', state.artFilter));
export const filteredItems = computed(() => filterRecord(store.data?.物品, '类型', state.itemFilter));
export const filteredEquips = computed(() => filterRecord(store.data?.装备, '类型', state.equipFilter));
export const filteredPuppets = computed(() => filterRecord(store.data?.傀儡, '品质', state.puppetFilter));
export const filteredBeasts = computed(() => filterRecord(store.data?.灵兽, '品质', state.beastFilter));

export const sortedRelations = computed(() => {
  const list = store.data?.关系列表;
  if (!list) return [] as { name: string; npc: any; idx: number }[];
  return Object.entries(list)
    .map(([name, npc], idx) => ({ name, npc: npc as any, idx }))
    .sort((a, b) => {
      const pa = a.npc?.在场 ? 0 : a.npc?.道侣 ? 1 : 2;
      const pb = b.npc?.在场 ? 0 : b.npc?.道侣 ? 1 : 2;
      if (pa !== pb) return pa - pb;
      return a.idx - b.idx;
    });
});

export const openedBuffData = computed(() => {
  if (!state.openedBuff) return null;
  const buffs = store.data?.状态效果 as Record<string, any> | undefined;
  return buffs?.[state.openedBuff] || null;
});

export const storageCount = (key: '功法' | '物品' | '装备' | '傀儡' | '灵兽') =>
  Object.keys((store.data as any)?.[key] || {}).length;
