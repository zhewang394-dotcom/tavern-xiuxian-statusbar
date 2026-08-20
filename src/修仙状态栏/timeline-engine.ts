// 时间轴引擎：按玩家(时间, 世界, 地域, 境界)动态拼装传闻事件
//   - 数据：从 timeline.yaml 读取 模板 + 字典
//   - 缓存：按 chat_id 维度存进 localStorage
//   - 触发：composables/App 端监听玩家状态变化，调 ensureTimeline()
//   - 显示：UI 调 displayableEvents() 拿"当前世界+地域+生效中"的事件
//
// 设计参考 timeline.yaml 顶部规则 1~12。

import { ref } from 'vue';
import timelineLib from './timeline.yaml';

// ============ 类型 ============
export type TimelineDate = { 年: number; 月: number; 日: number };

export type GeneratedEvent = {
  id: string;
  时间区间: { 起: TimelineDate; 止: TimelineDate };
  世界: string;
  地域: string;
  地点: string;
  类别: string;
  内容: string;
  难度: string;
};

type Tier = 'low' | 'mid' | 'high';

// ============ 常量 ============
const STORAGE_KEY_PREFIX = 'xy-timeline::';
const MAX_CACHE = 200;

const REALM_TIER_PREFIXES: Array<[string, Tier]> = [
  ['凡人', 'low'],
  ['练气', 'low'],
  ['炼气', 'low'],
  ['筑基', 'low'],
  ['金丹', 'mid'],
  ['元婴', 'mid'],
  ['化神', 'high'],
];

// 目标活跃事件数（依规则 11，按玩家境界档）
const TIER_TARGET_ACTIVE: Record<Tier, number> = {
  low: 2,
  mid: 1,
  high: 1,
};

// 事件持续时长（依规则 4，由引擎自动决定）
const TIER_DURATION_DAYS: Record<Tier, [number, number]> = {
  low: [120, 360], // 4~12 月
  mid: [365, 1095], // 1~3 年
  high: [1095, 3650], // 3~10 年
};

// 难度档候选（依规则 7，凡界事件敌方上限元婴后期）
const TIER_DIFFICULTY: Record<Tier, string[]> = {
  low: ['练气前期-练气后期', '练气后期-筑基前期', '筑基前期-筑基后期'],
  mid: ['金丹前期-金丹后期', '金丹后期-元婴前期', '元婴前期-元婴后期'],
  high: ['元婴后期-化神前期', '化神前期-化神后期'],
};

// 难度→tier 反查（用于显示过滤）
const DIFFICULTY_TO_TIER: Record<string, Tier> = (() => {
  const out: Record<string, Tier> = {};
  for (const tier of Object.keys(TIER_DIFFICULTY) as Tier[]) {
    for (const d of TIER_DIFFICULTY[tier]) out[d] = tier;
  }
  return out;
})();

const TIER_INDEX: Record<Tier, number> = { low: 0, mid: 1, high: 2 };

// 境界 → L 系数（依《核心系数总表》）
const REALM_L: Record<string, number> = {
  凡人: 0,
  炼气前期: 1.0, 炼气中期: 1.2, 炼气后期: 1.4,
  练气前期: 1.0, 练气中期: 1.2, 练气后期: 1.4,
  筑基前期: 2.0, 筑基中期: 2.2, 筑基后期: 2.4,
  金丹前期: 3.0, 金丹中期: 3.2, 金丹后期: 3.4,
  元婴前期: 4.0, 元婴中期: 4.2, 元婴后期: 4.4,
  化神前期: 5.0, 化神中期: 5.2, 化神后期: 5.4,
};

// 类别 → 难度乘数（依《经济系统》"悬赏公式 floor(10^L × 难度乘数)"）
//   通缉魔修        → 死士级 10.0
//   高额悬赏        → 猎杀妖兽级 3.0
//   宝物现世（市价）→ 物品定价基础乘数 2.0（武器/法宝/防具）
//   坊市集会的 {赏格} 偶尔用到 → 跟 高额悬赏 同档
const CATEGORY_REWARD_MULT: Record<string, number> = {
  通缉魔修: 10,
  高额悬赏: 3,
  宝物现世: 2,
  坊市集会: 3,
};
const DEFAULT_REWARD_MULT = 3;

// 化神档强制使用此类别池（依规则 2，100% 偏置；时空裂缝为化神专属）
const HIGH_TIER_CATEGORY_POOL = ['秘境传闻', '宝物现世', '古迹奇谭', '灵气潮汐', '时空裂缝'];

// 世界对应年份硬范围（依规则 9）
const WORLD_YEAR_RANGE: Record<string, [number, number] | null> = {
  凡界: [7000, 10000],
  灵界: null,
  仙界: null,
};

// ============ 模块状态 ============
const eventsRef = ref<GeneratedEvent[]>([]);
let loadedChatId: string | null = null;

// ============ 工具函数 ============
function dateNum(d: TimelineDate): number {
  return d.年 * 10000 + (d.月 || 1) * 100 + (d.日 || 1);
}

// 简化日历：30 天/月、12 月/年
function addDays(d: TimelineDate, days: number): TimelineDate {
  let 年 = d.年;
  let 月 = d.月 || 1;
  let 日 = (d.日 || 1) + days;
  while (日 > 30) {
    日 -= 30;
    月 += 1;
    if (月 > 12) {
      月 = 1;
      年 += 1;
    }
  }
  while (日 < 1) {
    日 += 30;
    月 -= 1;
    if (月 < 1) {
      月 = 12;
      年 -= 1;
    }
  }
  return { 年, 月, 日 };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(lo: number, hi: number, rng: () => number): number {
  return Math.floor(lo + rng() * (hi - lo + 1));
}

function realmTier(realm: string): Tier {
  if (!realm) return 'low';
  for (const [prefix, tier] of REALM_TIER_PREFIXES) {
    if (realm.startsWith(prefix)) return tier;
  }
  return 'low';
}

function getChatId(): string {
  try {
    const w = window as unknown as { SillyTavern?: { getCurrentChatId?: () => string | null } };
    const id = w.SillyTavern?.getCurrentChatId?.();
    if (id) return String(id);
  } catch {
    /* ignore */
  }
  return 'default';
}

function storageKey(): string {
  return STORAGE_KEY_PREFIX + getChatId();
}

function loadCache(): void {
  const chatId = getChatId();
  if (loadedChatId === chatId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + chatId);
    eventsRef.value = raw ? (JSON.parse(raw) as GeneratedEvent[]) : [];
  } catch {
    eventsRef.value = [];
  }
  loadedChatId = chatId;
}

function saveCache(): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(eventsRef.value));
  } catch (err) {
    console.warn('[timeline-engine] localStorage 写入失败', err);
  }
}

// ============ 模板填充 ============
function fillTemplate(
  template: string,
  dicts: Record<string, string[]>,
  slots: Record<string, string>,
  rng: () => number,
): string {
  let result = template;
  for (let depth = 0; depth < 8; depth++) {
    if (!/\{[^}]+\}/.test(result)) break;
    result = result.replace(/\{([^}]+)\}/g, (match, name: string) => {
      if (name in slots) return slots[name];
      const arr = dicts[name];
      if (Array.isArray(arr) && arr.length) {
        return arr[Math.floor(rng() * arr.length)];
      }
      return match; // 留待下一轮或最后清理
    });
  }
  // 清理未解析的占位符
  result = result.replace(/\{[^}]+\}/g, '');
  // 标点收尾
  result = result
    .replace(/，{2,}/g, '，')
    .replace(/；{2,}/g, '；')
    .replace(/，；/g, '；')
    .replace(/，。/g, '。')
    .replace(/；。/g, '。');
  return result;
}

function formatSpiritStone(n: number): string {
  if (n < 100) {
    return `${Math.max(10, Math.round(n / 10) * 10)}灵石`;
  }
  if (n < 1000) {
    return `${Math.round(n / 50) * 50}灵石`;
  }
  if (n < 10000) {
    return `${Math.round(n / 100) * 100}灵石`;
  }
  const wan = n / 10000;
  if (wan < 10) {
    return `${(Math.round(wan * 10) / 10).toFixed(1).replace(/\.0$/, '')}万灵石`;
  }
  return `${Math.round(wan)}万灵石`;
}

// 取难度区间的上界境界（如 "练气前期-练气后期" → "练气后期"）
function difficultyHighEnd(difficulty: string): string {
  const parts = difficulty.split(/[-~—]/).map(s => s.trim());
  return parts[parts.length - 1] || difficulty;
}

// 依《经济系统》悬赏公式 floor(10^L × 难度乘数) 计算奖励灵石
// rule: 取难度区间上界（高者为准）
function rewardStone(difficulty: string, category: string, rng: () => number): number {
  const high = difficultyHighEnd(difficulty);
  const L = REALM_L[high] ?? 1.0;
  const mult = CATEGORY_REWARD_MULT[category] ?? DEFAULT_REWARD_MULT;
  const base = Math.pow(10, L) * mult;
  // ±20% 随机波动，避免每次都一模一样
  const variance = 0.8 + rng() * 0.4;
  return Math.max(10, Math.floor(base * variance));
}

// 事件 tier 反查：用 难度 字符串
function eventTier(difficulty: string): Tier {
  return DIFFICULTY_TO_TIER[difficulty] ?? 'low';
}

// 玩家与事件 tier 距离 ≤ 1 才可见（规则 4）
function isTierVisible(evTier: Tier, playerT: Tier): boolean {
  return Math.abs(TIER_INDEX[evTier] - TIER_INDEX[playerT]) <= 1;
}

// ============ 生态感知槽 ============
// 引擎按 槽位名_<地域> + 槽位名_通用 合并为候选池抽取，避免"凡界·西域 + 老林深处"这种穿模。
// 适用 槽位：地点限定 / 兽群 / 灵植
function pickEcoAware(
  slotName: string,
  region: string,
  dicts: Record<string, string[]>,
  rng: () => number,
): string {
  const regional = dicts[`${slotName}_${region}`] ?? [];
  const universal = dicts[`${slotName}_通用`] ?? [];
  const pool = regional.concat(universal);
  if (pool.length > 0) return pick(pool, rng);
  // 最后回退：旧的扁平字典（向后兼容）
  const flat = dicts[slotName] ?? [];
  return flat.length > 0 ? pick(flat, rng) : '';
}

// ============ 事件生成 ============
function generateOneEvent(
  now: TimelineDate,
  world: string,
  region: string,
  tier: Tier,
  rng: () => number,
): GeneratedEvent | null {
  const lib = timelineLib as {
    模板?: Record<string, string[]>;
    字典?: Record<string, string[]>;
  };
  if (!lib.模板 || !lib.字典) return null;

  // 选类别（规则 2：化神档 100% 落入秘境/时空裂缝池）
  const allCategories = Object.keys(lib.模板);
  let categoryPool: string[];
  if (tier === 'high') {
    categoryPool = HIGH_TIER_CATEGORY_POOL.filter(c => allCategories.includes(c));
    if (categoryPool.length === 0) categoryPool = allCategories; // 兜底
  } else {
    // 非化神 tier 不应抽到化神专属类别（时空裂缝）
    categoryPool = allCategories.filter(c => c !== '时空裂缝');
  }
  if (categoryPool.length === 0) return null;
  const category = pick(categoryPool, rng);

  // 选模板
  const templates = lib.模板[category];
  if (!templates || templates.length === 0) return null;
  const template = pick(templates, rng);

  // 难度 + 境界档（取难度上界字符串作 {境界档} 注入）
  const difficulty = pick(TIER_DIFFICULTY[tier], rng);
  const 境界档 = difficultyHighEnd(difficulty);

  // 灵石数额（规则 1：按悬赏公式 floor(10^L × 难度乘数)）
  const stoneAmount = rewardStone(difficulty, category, rng);

  // 注入固定槽：生态相关槽（地点限定 / 兽群 / 灵植）按地域预先抽，避免穿模。
  // 同一事件内多次引用 → 同一个值，保证叙事一致。
  const 地点限定 = pickEcoAware('地点限定', region, lib.字典, rng);
  const 兽群 = pickEcoAware('兽群', region, lib.字典, rng);
  const 灵植 = pickEcoAware('灵植', region, lib.字典, rng);
  const fixedSlots: Record<string, string> = {
    世界: world,
    地域: region,
    地点: `${world}·${region}`,
    境界档,
    灵石数额: formatSpiritStone(stoneAmount),
    地点限定,
    兽群,
    灵植,
  };

  const content = fillTemplate(template, lib.字典, fixedSlots, rng);

  // 时间区间
  const startOffset = randInt(-15, 15, rng);
  const start = addDays(now, startOffset);
  const [durLo, durHi] = TIER_DURATION_DAYS[tier];
  const end = addDays(start, randInt(durLo, durHi, rng));

  // 规则 9：凡界年份硬范围
  const range = WORLD_YEAR_RANGE[world];
  if (range && (start.年 < range[0] || end.年 >= range[1])) return null;

  return {
    id: `${world}-${region}-${dateNum(now)}-${Math.floor(rng() * 1e9).toString(36)}`,
    时间区间: { 起: start, 止: end },
    世界: world,
    地域: region,
    地点: `${world}·${region}`,
    类别: category,
    内容: content,
    难度: difficulty,
  };
}

// ============ 公共 API ============

/**
 * 校准时间轴缓存：剪掉过期事件、按目标活跃数补足当前 (世界, 地域) 的事件。
 * 幂等：玩家状态没变时，重复调用不会产生新事件。
 */
export function ensureTimeline(
  now: TimelineDate,
  world: string,
  region: string,
  realm: string,
): void {
  if (!world || !region) return;
  loadCache();

  const n = dateNum(now);

  // 1. 剪掉过期事件（所有地域）
  const pruned = eventsRef.value.filter(ev => dateNum(ev.时间区间.止) >= n);

  // 2. 计目标活跃数
  const tier = realmTier(realm);
  const target = TIER_TARGET_ACTIVE[tier];

  // 3. 数当前 (世界, 地域, 难度档匹配) 的活跃事件
  const matching = pruned.filter(ev => {
    if (ev.世界 !== world || ev.地域 !== region) return false;
    if (!TIER_DIFFICULTY[tier].includes(ev.难度)) return false;
    return dateNum(ev.时间区间.起) <= n && dateNum(ev.时间区间.止) >= n;
  });
  const needed = Math.max(0, target - matching.length);

  // 4. 补足（最多尝试 3 倍数避免无限循环 — generateOneEvent 偶尔返回 null）
  const newOnes: GeneratedEvent[] = [];
  const rng = Math.random;
  for (let i = 0; i < needed * 3 && newOnes.length < needed; i++) {
    const ev = generateOneEvent(now, world, region, tier, rng);
    if (ev) newOnes.push(ev);
  }

  // 5. 合并 + 上限
  let next = pruned.concat(newOnes);
  if (next.length > MAX_CACHE) next = next.slice(-MAX_CACHE);

  // 6. 仅当有变化时写回（保持响应式 stable）
  if (newOnes.length > 0 || next.length !== eventsRef.value.length) {
    eventsRef.value = next;
    saveCache();
  }
}

/**
 * 返回 UI 该显示的事件：
 *   - 当前 (世界, 地域)
 *   - 时间区间覆盖 now（规则 12）
 *   - tier 距离玩家境界 ≤ 1（规则 4，差 2 级的事件不显示）
 */
export function displayableEvents(
  now: TimelineDate,
  world: string,
  region: string,
  realm: string,
): GeneratedEvent[] {
  loadCache();
  const n = dateNum(now);
  const playerT = realmTier(realm);
  return eventsRef.value
    .filter(ev => {
      if (ev.世界 !== world || ev.地域 !== region) return false;
      if (dateNum(ev.时间区间.起) > n || dateNum(ev.时间区间.止) < n) return false;
      return isTierVisible(eventTier(ev.难度), playerT);
    })
    .slice()
    .sort((a, b) => dateNum(a.时间区间.起) - dateNum(b.时间区间.起));
}

/** 暴露事件 ref 给 Vue computed 注册依赖 */
export function timelineEventsRef() {
  return eventsRef;
}

/** 调试/重置用 */
export function clearTimelineCache(): void {
  eventsRef.value = [];
  try {
    localStorage.removeItem(storageKey());
  } catch {
    /* ignore */
  }
}
