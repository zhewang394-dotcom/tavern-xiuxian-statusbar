import _ from 'lodash';
import { computed, reactive, ref } from 'vue';
import { useDataStore } from './store';
import {
  displayableEvents,
  ensureTimeline,
  timelineEventsRef,
  type GeneratedEvent,
  type TimelineDate,
} from './timeline-engine';
import { readSharedLayout, type SharedLayout } from '../shared/layout';
export type { TimelineDate } from './timeline-engine';

// ============ 共享 UI 状态（模块级单例）============
export const state = reactive({
  layoutMode: readSharedLayout('pc') as SharedLayout,
  currentTab: 0,
  storageTab: 0,
  openedNPC: null as string | null,
  openedBuff: null as string | null,
  artFilter: 'all' as string,
  itemFilter: 'all' as string,
  equipFilter: 'all' as string,
  puppetFilter: 'all' as string,
  beastFilter: 'all' as string,
  lightboxImage: null as string | null,
  toast: '' as string,
  appCollapsed: false,
  editMode: false,
  settingsOpen: false,
  overviewOpen: null as 'root' | 'body' | null,
  // 技艺下挂的配方面板展开状态(按技艺名 key)
  skillRecipeOpen: {} as Record<string, boolean>,
  // 性器折叠状态(按角色 key：'user'=主角 / NPC名=对应NPC；默认 false=折叠)
  genitalOpen: {} as Record<string, boolean>,
  confirmDelete: null as null | { kind: string; key: string; label: string },
  // 人物细化弹窗当前对应的 NPC 名；null 表示关闭。
  characterRefinement: null as string | null,
  // 手机排版下各长卡片默认折叠；key 使用「类型:名称」避免重名冲突。
  mobileCardOpen: {} as Record<string, boolean>,
});

export function isMobileCardOpen(kind: string, name: string): boolean {
  return state.mobileCardOpen[`${kind}:${name}`] === true;
}

export function toggleMobileCard(kind: string, name: string): void {
  if (state.layoutMode !== 'mobile') return;
  const key = `${kind}:${name}`;
  state.mobileCardOpen[key] = !state.mobileCardOpen[key];
}

const npcSectionOpen = reactive<Record<string, Record<string, boolean>>>({});
const npcAvatars = reactive<Record<string, string>>({});

// ============ 常量 ============
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

export const artTypes = ['心法', '攻击', '咒法', '身法', '护体', '幻术', '神识', '其他'] as const;
export const itemTypes = ['秘籍', '配方', '符箓', '丹药', '素材', '工具', '其他'] as const;
export const equipTypes = ['法宝', '护甲', '饰品'] as const;
export const qualityRanks = ['凡', '黄', '玄', '地', '天'] as const;

export const USER_AVATAR_KEY = '__user__';
const NPC_AVATAR_KEY = (name: string) => `xy-npc-avatar::${name}`;
const NPC_AVATAR_HI_KEY = (name: string) => `xy-npc-avatar-hi::${name}`;

// 主境界等级（依《核心系数总表》）
const MAJOR_RANKS: Record<string, number> = {
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
const SUB_RANKS: Record<string, number> = {
  初期: 0,
  中期: 1,
  后期: 2,
};
const EXCLUSIVE_ART_TYPES = ['心法', '护体', '身法'] as const;

// ============ 通用辅助函数（不依赖 store）============
export const barPct = (cur: number, total: number) => Math.max(0, Math.min(100, (cur / Math.max(total, 1)) * 100));

// 主境界 L (0~9)：用于按《领悟规则》计算技艺上限 Max_S = 10^(L+1)
export const realmLevel = (realm: string): number => Math.floor(realmScore(realm) / 10);

export const skillCap = (realm: string): number => Math.pow(10, realmLevel(realm) + 1);

// 技艺进度条百分比：log 刻度，每个数量级占 1/(L+1) 条；v 达到 10^(L+1) 时填满
export const skillPct = (v: number, realm = ''): number => {
  if (v == null || v <= 0) return 2;
  const L = realmLevel(realm);
  return Math.max(2, Math.min(100, (Math.log10(v + 1) / (L + 1)) * 100));
};

// 紧凑数字格式：< 1万 原样；< 1亿 用万；其他用亿，避免溢出
export const formatSkillNum = (v: number): string => {
  if (v == null) return '0';
  const n = Number(v);
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs < 10000) return String(n);
  if (abs < 100000000) {
    const x = n / 10000;
    return (abs < 100000 ? x.toFixed(1) : Math.round(x).toString()) + '万';
  }
  const x = n / 100000000;
  return (abs < 1000000000 ? x.toFixed(2) : x.toFixed(1)) + '亿';
};

export const npcBarPct = (pool?: { 现值?: number; 上限?: number }) => {
  if (!pool) return 0;
  const cur = pool.现值 ?? 0;
  const max = Math.max(pool.上限 ?? 1, 1);
  return Math.max(0, Math.min(100, (cur / max) * 100));
};

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

export const countNonZero = (group?: Record<string, number>): number => {
  if (!group) return 0;
  let n = 0;
  for (const v of Object.values(group)) if (Number(v) > 0) n++;
  return n;
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

export const hasSkills = (npc: any) => !_.isEmpty(npc?.技艺?.生产类) || !_.isEmpty(npc?.技艺?.战斗类);

export const hasStorage = (npc: any) => {
  if (!npc) return false;
  return (
    (npc.灵石 ?? 0) > 0 || !_.isEmpty(npc.物品) || !_.isEmpty(npc.装备) || !_.isEmpty(npc.傀儡) || !_.isEmpty(npc.灵兽)
  );
};

// ============ 元阴/元阳 性征三态（已并入 体质）============
// 值含义: true 处子(尚存) / false 已破(已损) / null|缺失 不存在(该性征不适用)。
// 角色/NPC/玩家通用：均读写 obj.体质.元阴 / obj.体质.元阳。
export const hasEssence = (v: any): boolean => v === true || v === false;
// 性别判定: 据 (体质.元阴, 体质.元阳) 值组合 —— 单边成立=女/男, 其余=其他
export const npcGender = (npc: any): 'female' | 'male' | 'other' => {
  if (!npc || typeof npc !== 'object') return 'other';
  const hasYin = hasEssence(npc.体质?.元阴);
  const hasYang = hasEssence(npc.体质?.元阳);
  if (hasYin && !hasYang) return 'female';
  if (hasYang && !hasYin) return 'male';
  return 'other';
};
// 仅左键循环切换: 尚存(true) → 已损(false) → 无/不存在(null) → …；写入 obj.体质[key]
export const cycleEssence = (obj: any, key: '元阳' | '元阴') => {
  if (!obj || typeof obj !== 'object') return;
  if (!obj.体质 || typeof obj.体质 !== 'object') obj.体质 = {};
  const v = obj.体质[key];
  obj.体质[key] = v === true ? false : v === false ? null : true;
};
export const essenceState = (v: any): string => (v === true ? '尚存' : v === false ? '已损' : '无（不存在）');
export const essenceMark = (v: any): string => (v === true ? '✓' : v === false ? '✗' : '–');

// ============ 物品标签解析 (形如 "所属技艺:炼丹"、"炼制难度:5") ============
// 仅取 K:V 形式的标签;纯描述性标签暂不渲染(避免堆叠噪声)
export const parseItemTags = (tags: any): Array<{ label: string; value: string }> => {
  if (!Array.isArray(tags)) return [];
  const out: Array<{ label: string; value: string }> = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const m = tag.match(/^\s*([^:：]+?)\s*[:：]\s*(.+?)\s*$/);
    if (m) out.push({ label: m[1].trim(), value: m[2].trim() });
  }
  return out;
};

// 从 标签数组中取出指定 label 的 value 字符串(找不到返回 null)
export const getTagValue = (tags: any, label: string): string | null => {
  const parsed = parseItemTags(tags);
  return parsed.find(t => t.label === label)?.value ?? null;
};

// ============ 技艺 - 配方筛选 + 制造按钮 ============
// 给定技艺名(如 '炼丹'), 返回 user.物品 里 类型='配方' 且 标签.所属技艺=该技艺 的所有条目
export const recipesForSkill = (
  items: Record<string, any> | undefined,
  skillName: string,
): Array<{ name: string; it: any }> => {
  if (!items || typeof items !== 'object') return [];
  const out: Array<{ name: string; it: any }> = [];
  for (const [name, it] of Object.entries(items)) {
    if (!it || typeof it !== 'object') continue;
    if (it.类型 !== '配方') continue;
    if (getTagValue(it.标签, '所属技艺') !== skillName) continue;
    out.push({ name, it });
  }
  return out;
};

// 切换某个技艺的配方面板展开状态
export const toggleSkillRecipes = (skillName: string) => {
  state.skillRecipeOpen[skillName] = !state.skillRecipeOpen[skillName];
};

// 配方名末尾可能带的"非成品"后缀(按长度 DESC 排, 长后缀优先匹配避免误剥);
// 仅做"尾部精确匹配"剥离, 因此中段含 残方 的名字(如"天残方圆丹")不会被误伤.
const RECIPE_SUFFIXES = [
  '完整丹方',
  '完整配方',
  '完整图纸',
  '完整阵图',
  '完整方',
  '残丹方',
  '残阵图',
  '残符方',
  '残图纸',
  '残方',
  '丹方',
  '配方',
  '图纸',
  '蓝图',
  '残页',
  '残卷',
  '残图',
  '秘方',
  '阵图',
  '符方',
  '法图',
].sort((a, b) => b.length - a.length);

// 把配方名规范成"成品名": 仅剥末尾配方关键词
//   "玄魔回气散残方"   → "玄魔回气散"   (剥 残方)
//   "回气散完整丹方"   → "回气散"      (优先剥 完整丹方 而非 丹方)
//   "天残方圆丹"       → "天残方圆丹"  (残方 在中段, 不剥)
//   "配方" / "丹方"    → 原样          (剥后为空, 拒绝)
export const stripRecipeSuffix = (name: string): string => {
  if (typeof name !== 'string') return name;
  for (const suffix of RECIPE_SUFFIXES) {
    if (name.endsWith(suffix) && name.length > suffix.length) {
      return name.slice(0, -suffix.length);
    }
  }
  return name;
};

// 依据"剥完后缀的成品名"决定动词:阵法 → 布阵, 其余 → 制造
export const craftVerbForName = (itemName: string): '制造' | '布阵' => {
  return stripRecipeSuffix(itemName).endsWith('阵') ? '布阵' : '制造';
};

// 依据技艺名决定 UI 按钮文案:阵法 → 布阵, 其余 → 制造
export const craftVerbForSkill = (skillName: string): '制造' | '布阵' => {
  return skillName === '阵法' ? '布阵' : '制造';
};

// 把 "制造【物品名】" 或 "布阵【阵法名】" 追加到 ST 输入栏(不直接发送,让玩家自行确认时机)
export const sendCraftCommand = (itemName: string) => {
  const cleanName = stripRecipeSuffix(itemName);
  const verb = craftVerbForName(cleanName);
  const text = `${verb}【${cleanName}】`;
  // ST 输入框: 主页面顶层的 #send_textarea (iframe 内需冒泡到 window.top)
  const doc = (window as any).top?.document || document;
  const ta = doc.querySelector('#send_textarea') as HTMLTextAreaElement | null;
  if (!ta) {
    showToast('未找到 ST 输入栏');
    return;
  }
  const cur = ta.value || '';
  const sep = cur && !/\s$/.test(cur) ? ' ' : '';
  ta.value = cur + sep + text;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.focus();
  showToast(`已追加: ${text}`);
};

// ============ 装备攻防 (存于 标签 数组里, 形如 "攻击力:2500") ============
// schema 把 法宝/护甲 的攻防写在 标签 字符串数组内,这里负责读取与回写.
const STAT_RE = (stat: '攻击力' | '防御力') => new RegExp(`^\\s*${stat}\\s*[:：]\\s*(-?\\d+(?:\\.\\d+)?)`);
export const getEquipStat = (eq: any, stat: '攻击力' | '防御力'): number | null => {
  const tags = eq?.标签;
  if (!Array.isArray(tags)) return null;
  const re = STAT_RE(stat);
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const m = re.exec(tag);
    if (m) return Number(m[1]);
  }
  return null;
};
export const setEquipStat = (eq: any, stat: '攻击力' | '防御力', value: number) => {
  if (!eq) return;
  if (!Array.isArray(eq.标签)) eq.标签 = [];
  const re = STAT_RE(stat);
  const idx = eq.标签.findIndex((t: any) => typeof t === 'string' && re.test(t));
  const newTag = `${stat}:${Number(value) || 0}`;
  if (idx >= 0) eq.标签[idx] = newTag;
  else eq.标签.push(newTag);
};

// ============ NPC 详情区折叠 ============
export const isSectionOpen = (name: string, section: string): boolean => !!npcSectionOpen[name]?.[section];
export const toggleSection = (name: string, section: string) => {
  if (!npcSectionOpen[name]) npcSectionOpen[name] = {};
  npcSectionOpen[name][section] = !npcSectionOpen[name][section];
};

// ============ Toast 提示 ============
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export const showToast = (msg: string) => {
  state.toast = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (state.toast === msg) state.toast = '';
  }, 2800);
};

// ============ 人物细化弹窗 ============
export const openCharacterRefinement = (name: string) => {
  state.characterRefinement = name;
};
export const closeCharacterRefinement = () => {
  state.characterRefinement = null;
};

// ============ 灯箱 ============
export const openLightbox = (url: string) => {
  if (url) state.lightboxImage = url;
};
export const closeLightbox = () => {
  state.lightboxImage = null;
};
// ============ NPC 头像（玩家本地上传）============
// 存储改用 IndexedDB：localStorage 配额只有几 MB，2048px 高清图 base64 常常存不下，
// 会被剪成 192px 缩略图导致点开只有一丁点大。IndexedDB 配额大得多，能稳定保存高清图。
export const avatarFileInput = ref<HTMLInputElement | null>(null);
const pendingAvatarFor = ref<string | null>(null);

// —— 内存缓存（响应式）——
// npcAvatars（文件顶部已声明）只缓存 192px 缩略图。
// 高清图(2048px, 单张 base64 常达数百 KB~1MB)绝不常驻内存: 它只在灯箱打开的那一刻才需要,
// 由 getNpcAvatarHi() 按需从 IndexedDB 读出、存进 state.lightboxImage, 关灯箱即释放。
// (旧实现把高清图一并塞进模块级 map 且从不淘汰, 而模板里 v-for 的每个 NPC 都会调
//  getNpcAvatar(), 于是打开关系页就把所有 NPC 的高清图拉进内存, 是 OOM 的主因。)
// 已发起过异步加载的 key，避免在模板渲染中重复触发加载。
const avatarLoadStarted = new Set<string>();

// —— IndexedDB 封装 —— 任何失败都静默回退到 localStorage，绝不抛错影响渲染。
const AVATAR_DB = 'xy-avatar-db';
const AVATAR_STORE = 'avatars';
type AvatarRecord = { thumb: string; hi: string };
let avatarDbPromise: Promise<IDBDatabase | null> | null = null;

const openAvatarDb = (): Promise<IDBDatabase | null> => {
  if (avatarDbPromise) return avatarDbPromise;
  avatarDbPromise = new Promise(resolve => {
    try {
      const req = indexedDB.open(AVATAR_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(AVATAR_STORE)) db.createObjectStore(AVATAR_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.warn('[修仙状态栏] IndexedDB 打开失败，回退 localStorage', req.error);
        resolve(null);
      };
    } catch (e) {
      console.warn('[修仙状态栏] IndexedDB 不可用，回退 localStorage', e);
      resolve(null);
    }
  });
  return avatarDbPromise;
};

const idbGetAvatar = async (name: string): Promise<AvatarRecord | null> => {
  const db = await openAvatarDb();
  if (!db) return null;
  return new Promise(resolve => {
    try {
      const req = db.transaction(AVATAR_STORE, 'readonly').objectStore(AVATAR_STORE).get(name);
      req.onsuccess = () => resolve((req.result as AvatarRecord) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const idbPutAvatar = async (name: string, rec: AvatarRecord): Promise<boolean> => {
  const db = await openAvatarDb();
  if (!db) return false;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(AVATAR_STORE, 'readwrite');
      tx.objectStore(AVATAR_STORE).put(rec, name);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

const idbDeleteAvatar = async (name: string): Promise<void> => {
  const db = await openAvatarDb();
  if (!db) return;
  await new Promise<void>(resolve => {
    try {
      const tx = db.transaction(AVATAR_STORE, 'readwrite');
      tx.objectStore(AVATAR_STORE).delete(name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
};

// 旧版数据一次性迁移：把 localStorage 里的头像搬进 IndexedDB 并清掉旧键释放配额。
const migrateAvatarFromLocalStorage = async (name: string): Promise<AvatarRecord | null> => {
  let thumb = '';
  let hi = '';
  try {
    thumb = localStorage.getItem(NPC_AVATAR_KEY(name)) || '';
  } catch {
    /* */
  }
  try {
    hi = localStorage.getItem(NPC_AVATAR_HI_KEY(name)) || '';
  } catch {
    /* */
  }
  if (!thumb && !hi) return null;
  const rec: AvatarRecord = { thumb: thumb || hi, hi: hi || thumb };
  if (await idbPutAvatar(name, rec)) {
    try {
      localStorage.removeItem(NPC_AVATAR_KEY(name));
    } catch {
      /* */
    }
    try {
      localStorage.removeItem(NPC_AVATAR_HI_KEY(name));
    } catch {
      /* */
    }
  }
  return rec;
};

// 异步把某个头像的【缩略图】读入内存缓存，响应式更新触发模板重渲染。
// 注意: 只取 thumb, 高清图留在 IndexedDB 里不加载。
const loadNpcAvatarInto = async (name: string): Promise<void> => {
  const rec = (await idbGetAvatar(name)) || (await migrateAvatarFromLocalStorage(name));
  npcAvatars[name] = rec?.thumb || '';
};

// 同步返回缩略图（供模板直接调用）；首次调用时后台异步加载，加载完成后响应式刷新。
export const getNpcAvatar = (name: string): string => {
  if (!avatarLoadStarted.has(name)) {
    avatarLoadStarted.add(name);
    void loadNpcAvatarInto(name);
  }
  return npcAvatars[name] || '';
};

// 异步返回高清图（仅灯箱用）：每次都直接从 IndexedDB 现取，用完即弃，不进任何常驻缓存。
export const getNpcAvatarHi = async (name: string): Promise<string> => {
  const rec = (await idbGetAvatar(name)) || (await migrateAvatarFromLocalStorage(name));
  return rec?.hi || rec?.thumb || '';
};

// 点击头像放大：缩略图存在才响应；高清图异步取，取不到回退缩略图。
export const onAvatarClick = async (key: string, ev: MouseEvent) => {
  const thumb = getNpcAvatar(key);
  if (!thumb) return;
  ev.stopPropagation();
  const hi = await getNpcAvatarHi(key);
  openLightbox(hi || thumb);
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
    const ok = await idbPutAvatar(name, { thumb, hi });
    if (!ok) {
      // IndexedDB 不可用时才回退 localStorage：尽量保住缩略图，高清图存不下就丢弃。
      try {
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
      } catch (err) {
        console.warn('[修仙状态栏] 头像存储失败', err);
      }
    }
    avatarLoadStarted.add(name);
    // 只把缩略图放进内存；高清图已落 IndexedDB，等灯箱要用时再现取。
    npcAvatars[name] = thumb;
  } catch (err) {
    console.error('[修仙状态栏] 头像上传失败', err);
  }
};

export const clearNpcAvatar = (name: string) => {
  void idbDeleteAvatar(name);
  // 一并清理可能残留的旧版 localStorage 数据。
  try {
    localStorage.removeItem(NPC_AVATAR_KEY(name));
  } catch {
    /* */
  }
  try {
    localStorage.removeItem(NPC_AVATAR_HI_KEY(name));
  } catch {
    /* */
  }
  npcAvatars[name] = '';
};

// ============ 删除确认 ============
export const requestDelete = (kind: string, key: string, label?: string) => {
  state.confirmDelete = { kind, key, label: label || key };
};
export const cancelDelete = () => {
  state.confirmDelete = null;
};
export const performDelete = () => {
  const c = state.confirmDelete;
  const store = useDataStore();
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
    case 'asset':
      if (data.固定资产) delete data.固定资产[c.key];
      break;
    case 'npc':
      if (data.关系列表) delete data.关系列表[c.key];
      clearNpcAvatar(c.key);
      if (state.openedNPC === c.key) state.openedNPC = null;
      break;
    case 'user-buff':
      if (data.状态效果) delete data.状态效果[c.key];
      if (state.openedBuff === c.key) state.openedBuff = null;
      break;
    case 'npc-buff': {
      const sep = c.key.indexOf('::');
      if (sep > 0) {
        const npcName = c.key.slice(0, sep);
        const buffName = c.key.slice(sep + 2);
        if (data.关系列表?.[npcName]?.状态效果) {
          delete data.关系列表[npcName].状态效果[buffName];
        }
      }
      break;
    }
    case 'npc-art':
    case 'npc-item':
    case 'npc-equip':
    case 'npc-puppet':
    case 'npc-beast': {
      const sep = c.key.indexOf('::');
      if (sep <= 0) break;
      const npcName = c.key.slice(0, sep);
      const subName = c.key.slice(sep + 2);
      const npc = data.关系列表?.[npcName];
      if (!npc) break;
      if (c.kind === 'npc-art' && npc.功法) {
        delete npc.功法[subName];
      } else if (c.kind === 'npc-item' && npc.物品) {
        delete npc.物品[subName];
      } else if (c.kind === 'npc-equip' && npc.装备) {
        delete npc.装备[subName];
      } else if (c.kind === 'npc-puppet' && npc.傀儡) {
        delete npc.傀儡[subName];
      } else if (c.kind === 'npc-beast' && npc.灵兽) {
        delete npc.灵兽[subName];
      }
      break;
    }
  }
  state.confirmDelete = null;
};

// ============ 切换功法/单位（依赖 store）============
export const toggleArt = (name: string, value: boolean) => {
  const store = useDataStore();
  const arts = store.data.功法 as Record<string, any>;
  const art = arts[name];
  if (!art) return;
  const exclusive = ['心法', '护体', '身法'];
  if (value && exclusive.includes(art.类型)) {
    for (const [k, v] of Object.entries(arts)) {
      if (k !== name && v.使用中 && v.类型 === art.类型) v.使用中 = false;
    }
  }
  art.使用中 = value;
};

export const toggleNpcArt = (npcName: string, artName: string, value: boolean) => {
  const store = useDataStore();
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
  const store = useDataStore();
  const slot = (store.data as any)[kind];
  if (slot && slot[name]) slot[name].使用中 = value;
};

// ============ Computed（依赖 store；惰性求值，挂载后才使用）============
export const filteredArts = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.功法, '类型', state.artFilter);
});
export const filteredItems = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.物品, '类型', state.itemFilter);
});
export const filteredEquips = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.装备, '类型', state.equipFilter);
});
export const filteredPuppets = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.傀儡, '品质', state.puppetFilter);
});
export const filteredBeasts = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.灵兽, '品质', state.beastFilter);
});

export const sortedRelations = computed(() => {
  const store = useDataStore();
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
  const store = useDataStore();
  const buffs = store.data?.状态效果 as Record<string, any> | undefined;
  return buffs?.[state.openedBuff] || null;
});

// 传闻渲染源：直接读 MVU 变量树。引擎把 displayable 子集写到此处后，
// PageRumors 自然看到；同时 <status_current_variable> 也会带它进 AI 提示词。
export const activeTimelineEvents = computed<GeneratedEvent[]>(() => {
  const store = useDataStore();
  const data = store.data as { 传闻?: GeneratedEvent[] } | undefined;
  return data?.传闻 ?? [];
});

// 引擎同步入口：被 App.vue watch 调用。
// 流程：剪枝 + 补足缓存 → 取当前可见子集 → 浅比较后写回 store.data.传闻。
// 一切 mvu 写入由 store 自身的 watchEffect 自动同步到酒馆变量。
export function syncTimeline(): void {
  const store = useDataStore();
  const t = store.data?.时间;
  const loc = store.data?.地点;
  const realm = store.data?.修炼进度?.境界;
  if (!t || !loc || !realm) return;
  if (t.年 == null || !loc.世界 || !loc.地域) return;

  const now: TimelineDate = { 年: t.年, 月: t.月, 日: t.日 };
  ensureTimeline(now, loc.世界, loc.地域, realm);
  void timelineEventsRef().value;
  const visible = displayableEvents(now, loc.世界, loc.地域, realm);

  const data = store.data as { 传闻?: GeneratedEvent[] };
  const prev = data.传闻 ?? [];
  // 浅比较 id 序列，避免无变化时多次触发 mvu 写入
  if (prev.length === visible.length && prev.every((e, i) => e.id === visible[i].id)) {
    return;
  }
  data.传闻 = visible;
}

export const storageCount = (key: '功法' | '物品' | '装备' | '傀儡' | '灵兽') => {
  const store = useDataStore();
  return Object.keys((store.data as any)[key] || {}).length;
};
