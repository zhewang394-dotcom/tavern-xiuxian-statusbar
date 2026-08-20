/**
 * 物品/功法/法宝/傀儡/灵兽 数值规范化
 *
 * 按 [物品功法生成规则] 系数表:
 *   物品数值 = floor(10^L × 系数 × (1+Q))
 * 提供 normalizeItemForMvu(item) 返回规范化后的 data 字段。
 *
 * UI 卡片(StepInventory.vue) 与 注入(export.ts) 共用此函数,确保所见即所得。
 */

const REALM_L: Record<string, number> = {
  炼气: 1, 练气: 1, 筑基: 2, 金丹: 3, 元婴: 4, 化神: 5,
  返虚: 6, 炼虚: 6, 合体: 7, 大乘: 8, 渡劫: 9, 飞升: 9,
};
const QUALITY_Q: Record<string, number> = {
  凡: 0, 黄: 0.25, 玄: 0.5, 地: 0.75, 天: 1.0,
};

export function calcItemStat(L: number, Q: number, coef: number): number {
  return Math.max(1, Math.floor(Math.pow(10, L) * coef * (1 + Q)));
}

/** d20 数值类(命中/闪避/穿透/减免) 加值: max(1, floor(L/2 + 2Q)) */
function d20Stat(L: number, Q: number): number {
  return Math.max(1, Math.floor(L / 2 + 2 * Q));
}

/** 百分比类(穿透%/减免%) 取值: L×5 + Q×20 */
function pctStat(L: number, Q: number): number {
  return Math.max(0, Math.floor(L * 5 + Q * 20));
}

function stripStatTag(tags: any[], statName: string): string[] {
  if (!Array.isArray(tags)) return [];
  const re = new RegExp(`^\\s*${statName}\\s*[:：]`);
  return tags.filter(t => typeof t === 'string' && !re.test(t));
}

interface ItemLike {
  品质?: string;
  境界?: string;
  类型?: string;
  五行?: string;
  data?: Record<string, any>;
}

/**
 * 玩家覆盖值优先：若 data 上挂着 _override[key] 则使用之，否则走公式。
 * 自创资材通过 data._override 注入用户填的数值，让 normalizer 跳过自动计算。
 */
function pickOverride(d: Record<string, any>, key: string, fallback: number): number {
  const ov = d._override;
  if (ov && typeof ov === 'object' && typeof ov[key] === 'number') return ov[key];
  return fallback;
}

/**
 * 物品 子类型修饰位 (在 data 内显式给出):
 *   - 攻击型: 仅符箓使用,默认 true,false 时 攻击力=0
 *   - 加成型: 仅工具使用,默认 false,true 时入 [加成:N] 标签
 */

/**
 * 按规则规范化某件物品的 data 字段。
 * - 保留:描述 / 效果 / 数量 / 位置 / 使用中 / 消耗 / 完整度 / 描述性标签
 * - 校正/写入:品质 / 境界 / 类型 / 五行 / 数值标签(攻击力/防御力 等仅入标签)
 */
export function normalizeItemForMvu(item: ItemLike): Record<string, any> {
  const d: Record<string, any> = { ...(item.data || {}) };
  const Q = QUALITY_Q[item.品质 || '凡'] ?? 0;
  const L = REALM_L[item.境界 || '炼气'] ?? 1;
  const calc = (coef: number) => calcItemStat(L, Q, coef);

  // 公共元数据
  d.品质 = item.品质 ?? d.品质;
  d.境界 = item.境界 ?? d.境界;
  const rawType = item.类型 || d.类型 || '';
  d.类型 = rawType;
  if (item.五行) d.五行 = item.五行;
  if (
    typeof d.使用中 !== 'boolean' &&
    ['心法', '攻击', '咒法', '身法', '护体', '法宝', '傀儡', '灵兽'].includes(rawType)
  ) {
    d.使用中 = false;
  }
  if (!Array.isArray(d.标签)) d.标签 = [];
  // 删除 items.ts 残留的不规范顶级字段(数值进标签,字符串修行速度淘汰)
  delete (d as any).修行速度;
  delete (d as any).攻击力;
  delete (d as any).防御力;

  switch (rawType) {
    case '法宝': {
      const v = pickOverride(d, '攻击力', calc(0.25));
      d.标签 = [...stripStatTag(d.标签, '攻击力'), `攻击力:${v}`];
      break;
    }
    case '护甲': {
      const v = pickOverride(d, '防御力', calc(0.15));
      d.位置 = d.位置 || '上装';
      d.标签 = [...stripStatTag(d.标签, '防御力'), `防御力:${v}`];
      break;
    }
    case '饰品': {
      d.位置 = d.位置 || '腰间';
      break;
    }
    case '工具': {
      // 工具 仅当显式标记 加成型 (核心生产工具如丹炉/器鼎/符笔) 才入 加成 标签;
      // 收纳类工具 (储物袋/锦囊) 不加
      d.标签 = stripStatTag(d.标签, '加成');
      if ((d as any).加成型 === true) {
        d.标签 = [...d.标签, `加成:${calc(1.0)}`];
      }
      delete (d as any).加成型;
      break;
    }
    case '心法': {
      const v = pickOverride(d, '修行速度', calc(0.3));
      d.标签 = [...stripStatTag(d.标签, '修行速度'), `修行速度:${v}`];
      break;
    }
    case '攻击':
    case '咒法': {
      const hit = pickOverride(d, '命中', d20Stat(L, Q));
      const pen = pickOverride(d, '穿透', pctStat(L, Q));
      const atk = pickOverride(d, '攻击力', calc(0.4));
      d.标签 = [
        ...stripStatTag(d.标签, '命中'),
        ...stripStatTag(d.标签, '穿透%'),
        ...stripStatTag(d.标签, '攻击力'),
        `命中:${hit}`,
        `穿透%:${pen}`,
        `攻击力:${atk}`,
      ];
      break;
    }
    case '身法': {
      const dodge = pickOverride(d, '闪避', d20Stat(L, Q));
      const dun = pickOverride(d, '遁速', calc(1.5));
      d.标签 = [
        ...stripStatTag(d.标签, '闪避'),
        ...stripStatTag(d.标签, '遁速'),
        `闪避:${dodge}`,
        `遁速:${dun}`,
      ];
      break;
    }
    case '护体': {
      // 触发条件：data.护体触发 优先；否则保留已有 灵气受击/气血受击 标签；都没有则补 灵气受击
      const userTrigger = typeof (d as any).护体触发 === 'string' ? (d as any).护体触发 : null;
      const existingTrigger = (d.标签 as any[]).find(
        t => typeof t === 'string' && (t === '灵气受击' || t === '气血受击'),
      );
      const trigger = userTrigger || existingTrigger || '灵气受击';
      const reduce = pickOverride(d, '减免', pctStat(L, Q));
      const defense = pickOverride(d, '防御力', calc(0.3));
      d.标签 = [
        ...(d.标签 as any[]).filter(t => t !== '灵气受击' && t !== '气血受击'),
        ...stripStatTag(d.标签, '减免%'),
        ...stripStatTag(d.标签, '防御力'),
        trigger,
        `减免%:${reduce}`,
        `防御力:${defense}`,
      ];
      delete (d as any).护体触发;
      break;
    }
    case '阵法': {
      const cap = pickOverride(d, '灵气容量', calc(4));
      const atk = pickOverride(d, '攻击力', calc(0.15));
      d.消耗 = '无';
      d.标签 = [
        ...stripStatTag(d.标签, '灵气容量'),
        ...stripStatTag(d.标签, '攻击力'),
        `灵气容量:${cap}`, `攻击力:${atk}`,
      ];
      break;
    }
    case '丹药': {
      // 丹药 无强制标签;恢复值由 效果 描述,不再生成 恢复:N 标签
      d.标签 = stripStatTag(d.标签, '恢复');
      break;
    }
    case '符箓': {
      // 物品 符箓 必含 [灵气消耗:X][攻击力:X] (非攻击型攻击力可=0,由 data.攻击型 显式标记)
      const offensive = (d as any).攻击型 !== false;
      const atkDefault = offensive ? calc(0.4) : 0;
      const atk = pickOverride(d, '攻击力', atkDefault);
      const mana = pickOverride(d, '灵气消耗', calc(0.2));
      d.标签 = [
        ...stripStatTag(d.标签, '灵气消耗'),
        ...stripStatTag(d.标签, '攻击力'),
        `灵气消耗:${mana}`,
        `攻击力:${atk}`,
      ];
      delete (d as any).攻击型;
      break;
    }
    case '秘籍': {
      const Y = Math.max(1, Math.ceil(L / 2));
      d.完整度 = d.完整度 || '抄本';
      d.阅读进度 = `0/${Y}`;
      d.标签 = [
        ...stripStatTag(d.标签, '完整度'),
        ...stripStatTag(d.标签, '阅读进度'),
        `完整度:${d.完整度}`,
        `阅读进度:${d.阅读进度}`,
      ];
      break;
    }
    case '素材': {
      const diff = pickOverride(d, '炼制难度', calc(0.5));
      d.标签 = [
        ...stripStatTag(d.标签, '炼制难度'),
        `炼制难度:${diff}`,
      ];
      break;
    }
    case '傀儡':
    case '灵兽': {
      // 傀儡/灵兽 mvu 顶级:资源池(气血/灵气/遁速) + 防御力 + 技能字典
      const hpCoef = rawType === '灵兽' ? 10 : 0.75;
      const ovRP: any = (d._override && d._override.资源池) || {};
      const hp = typeof ovRP.气血 === 'number' ? ovRP.气血 : calc(hpCoef);
      const mp = typeof ovRP.灵气 === 'number' ? ovRP.灵气 : calc(0.5);
      const dun = typeof ovRP.遁速 === 'number' ? ovRP.遁速 : calc(1.25);
      d.资源池 = {
        气血: { 现值: hp, 上限: hp },
        灵气: { 现值: mp, 上限: mp },
        遁速: dun,
      };
      d.防御力 = pickOverride(d, '防御力', calc(0.125));
      delete (d as any).气血;
      delete (d as any).灵气;
      delete (d as any).遁速;
      // 技能字典：若 data.技能 已是对象则保留（自创可注入），否则给空对象
      if (!d.技能 || typeof d.技能 !== 'object') d.技能 = {};
      d.标签 = stripStatTag(d.标签, '气血');
      d.标签 = stripStatTag(d.标签, '攻击力');
      d.标签 = stripStatTag(d.标签, '遁速');
      break;
    }
  }

  // 清理覆盖标记，避免污染最终 data
  delete (d as any)._override;

  return d;
}

/** 用于 UI 显示:按字段优先级抽取数值/数量/位置/效果. */
export interface NormalizedDisplay {
  品质?: string;
  境界?: string;
  类型?: string;
  五行?: string;
  攻击力?: number;
  防御力?: number;
  气血?: number;
  遁速?: number;
  修行速度?: number;
  恢复?: number;
  加成?: number;
  数量?: number;
  位置?: string;
  消耗?: string;
  使用中?: boolean;
  完整度?: string;
  阅读进度?: string;
  效果?: Record<string, string>;
  /** 数值标签(规则强制),如 ['攻击力:4'] */
  数值标签: string[];
  /** 描述性标签(从 items.ts 原本带的) */
  描述标签: string[];
  /** 资源池(仅 傀儡/灵兽);气血上限/灵气上限/遁速 */
  资源池?: {
    气血?: { 现值: number; 上限: number };
    灵气?: { 现值: number; 上限: number };
    遁速?: number;
  };
  /** 技能字典(仅 傀儡/灵兽) */
  技能?: Record<string, { 攻击力?: number; 消耗?: string; 效果?: Record<string, string> }>;
}

/**
 * 拿规范化后的 data,展平给 UI 卡片显示用。
 * 把 data.标签 拆成"数值标签"(K:V 形式) 与 "描述标签"(纯文本 如:'剑修')。
 */
export function toDisplay(item: ItemLike): NormalizedDisplay {
  const d = normalizeItemForMvu(item);
  const tags: string[] = Array.isArray(d.标签) ? d.标签 : [];
  const numericTags: string[] = [];
  const descTags: string[] = [];
  for (const t of tags) {
    if (typeof t !== 'string') continue;
    if (/[:：]/.test(t)) numericTags.push(t);
    else descTags.push(t);
  }
  // 傀儡/灵兽:从 资源池 抽取数值给 UI
  const rp = d.资源池 && typeof d.资源池 === 'object' ? d.资源池 : null;
  const rpHp = rp?.气血?.上限 ?? rp?.气血?.现值;
  const rpDun = rp?.遁速;

  return {
    品质: d.品质,
    境界: d.境界,
    类型: d.类型,
    五行: d.五行,
    // 装备的攻击力/防御力 仅存在于标签里;傀儡/灵兽 也是
    攻击力: pickNumFromTags(numericTags, '攻击力'),
    防御力: typeof d.防御力 === 'number' ? d.防御力 : pickNumFromTags(numericTags, '防御力'),
    气血: typeof rpHp === 'number' ? rpHp : pickNumFromTags(numericTags, '气血'),
    遁速: typeof rpDun === 'number' ? rpDun : pickNumFromTags(numericTags, '遁速'),
    数量: typeof d.数量 === 'number' ? d.数量 : undefined,
    // 储物袋 = 默认存放态,卡片不展示这条信息以减少噪声
    位置: typeof d.位置 === 'string' && d.位置 !== '储物袋' ? d.位置 : undefined,
    消耗: typeof d.消耗 === 'string' ? d.消耗 : undefined,
    使用中: typeof d.使用中 === 'boolean' ? d.使用中 : undefined,
    完整度: typeof d.完整度 === 'string' ? d.完整度 : undefined,
    阅读进度: typeof d.阅读进度 === 'string' ? d.阅读进度 : undefined,
    效果: d.效果 && typeof d.效果 === 'object' && !Array.isArray(d.效果) ? d.效果 : undefined,
    数值标签: numericTags,
    描述标签: descTags,
    修行速度: pickNumFromTags(numericTags, '修行速度'),
    恢复: pickNumFromTags(numericTags, '恢复'),
    加成: pickNumFromTags(numericTags, '加成'),
    资源池: rp ? {
      气血: rp.气血 && typeof rp.气血 === 'object' ? { 现值: Number(rp.气血.现值) || 0, 上限: Number(rp.气血.上限) || 0 } : undefined,
      灵气: rp.灵气 && typeof rp.灵气 === 'object' ? { 现值: Number(rp.灵气.现值) || 0, 上限: Number(rp.灵气.上限) || 0 } : undefined,
      遁速: typeof rp.遁速 === 'number' ? rp.遁速 : undefined,
    } : undefined,
    技能: d.技能 && typeof d.技能 === 'object' && !Array.isArray(d.技能) ? d.技能 : undefined,
  };
}

function pickNumFromTags(tags: string[], key: string): number | undefined {
  for (const t of tags) {
    const m = t.match(new RegExp(`^${key}\\s*[:：]\\s*(\\d+)`));
    if (m) return Number(m[1]);
  }
  return undefined;
}

// ============================================================
// CardView：初始资材「类型特化卡」统一数据结构
// 预设 / 自创 / 剧情 三种来源都归一到此，交给 ItemCard.vue 渲染。
// ============================================================
export interface CardStat {
  label: string;
  value: string;
  /** 着色类：atk/def/hit/spd/mana/buff/'' */
  cls: string;
}
export interface CardSkill {
  name: string;
  攻击力?: string;
  消耗?: string;
  效果?: Record<string, string>;
}
export interface CardView {
  name: string;
  category: string;
  类型: string;
  品质?: string;
  境界?: string;
  五行?: string;
  数量?: number;
  完整度?: string;
  阅读进度?: string;
  /** 仅 灵石：一份多少下品灵石 */
  灵石?: number;
  stats: CardStat[];
  resources: { name: string; cur: number; max?: number }[];
  descTags: string[];
  effects: { name: string; val: string }[];
  skills: CardSkill[];
  desc?: string;
  消耗?: string;
  位置?: string;
}

const STAT_CLS: Record<string, string> = {
  攻击力: 'atk', 防御力: 'def', 防御: 'def',
  命中: 'hit', 闪避: 'hit',
  修行速度: 'spd', 恢复: 'spd', 遁速: 'spd', 遁: 'spd',
  灵气消耗: 'mana', 灵气受击: 'mana', 灵气容量: 'mana',
  加成: 'buff', '减免%': 'buff', '穿透%': 'buff', 减免: 'buff', 穿透: 'buff',
};
const statCls = (label: string): string => STAT_CLS[label] || '';
const _num = (v: any): number => (Number.isFinite(+v) ? +v : 0);

/**
 * 把「已规范化的 data（normalizeItemForMvu 输出，或剧情物品的最终 data）」+ 元信息
 * 解析为 CardView。标签中的 `名:值` → 数值 chip；纯文本 → 描述标签；完整度/阅读进度 归 meta。
 */
export function dataToCardView(
  name: string,
  category: string,
  meta: { 品质?: string; 境界?: string; 类型?: string; 五行?: string },
  data: Record<string, any>,
): CardView {
  const 标签: any[] = Array.isArray(data.标签) ? data.标签 : [];
  const stats: CardStat[] = [];
  const descTags: string[] = [];
  let 完整度: string | undefined;
  let 阅读进度: string | undefined;
  for (const t of 标签) {
    if (typeof t !== 'string') continue;
    const m = t.match(/^([^:：]+)\s*[:：]\s*(.+)$/);
    if (m) {
      const label = m[1].trim();
      const value = m[2].trim();
      if (label === '完整度') { 完整度 = value; continue; }
      if (label === '阅读进度') { 阅读进度 = value; continue; }
      stats.push({ label, value, cls: statCls(label) });
    } else {
      descTags.push(t);
    }
  }
  // 傀儡/灵兽 顶层 防御力
  if (typeof data.防御力 === 'number') {
    stats.push({ label: '防御', value: String(data.防御力), cls: 'def' });
  }
  // 资源池
  const resources: { name: string; cur: number; max?: number }[] = [];
  const rp = data.资源池;
  if (rp && typeof rp === 'object') {
    if (rp.气血 && typeof rp.气血 === 'object') {
      resources.push({ name: '气血', cur: _num(rp.气血.现值 ?? rp.气血.上限), max: _num(rp.气血.上限) });
    }
    if (rp.灵气 && typeof rp.灵气 === 'object') {
      resources.push({ name: '灵气', cur: _num(rp.灵气.现值 ?? rp.灵气.上限), max: _num(rp.灵气.上限) });
    }
    if (typeof rp.遁速 === 'number') stats.push({ label: '遁', value: String(rp.遁速), cls: 'spd' });
  }
  // 效果
  const effects: { name: string; val: string }[] = [];
  if (data.效果 && typeof data.效果 === 'object' && !Array.isArray(data.效果)) {
    for (const [k, v] of Object.entries(data.效果)) effects.push({ name: k, val: String(v) });
  }
  // 技能
  const skills: CardSkill[] = [];
  if (data.技能 && typeof data.技能 === 'object' && !Array.isArray(data.技能)) {
    for (const [k, v] of Object.entries(data.技能 as Record<string, any>)) {
      skills.push({
        name: k,
        攻击力: v && v.攻击力 != null ? String(v.攻击力) : undefined,
        消耗: v && typeof v.消耗 === 'string' ? v.消耗 : undefined,
        效果: v && v.效果 && typeof v.效果 === 'object' ? v.效果 : undefined,
      });
    }
  }
  return {
    name,
    category,
    类型: meta.类型 || data.类型 || '',
    品质: meta.品质 || data.品质,
    境界: meta.境界 || data.境界,
    五行: meta.五行 || data.五行,
    数量: typeof data.数量 === 'number' && data.数量 > 1 ? data.数量 : undefined,
    完整度: 完整度 || (typeof data.完整度 === 'string' ? data.完整度 : undefined),
    阅读进度: 阅读进度 || (typeof data.阅读进度 === 'string' ? data.阅读进度 : undefined),
    stats,
    resources,
    descTags,
    effects,
    skills,
    desc: typeof data.描述 === 'string' && data.描述 ? data.描述 : undefined,
    消耗: typeof data.消耗 === 'string' && data.消耗 && data.消耗 !== '无' ? data.消耗 : undefined,
    位置: typeof data.位置 === 'string' && data.位置 && data.位置 !== '储物袋' ? data.位置 : undefined,
  };
}

/** 预设资材 ItemOption → CardView（灵石特殊处理，其余走规范化再解析） */
export function itemToCardView(it: ItemLike & {
  name: string; category: string; desc?: string; 灵石?: number;
}): CardView {
  if (it.category === '灵石') {
    return {
      name: it.name, category: '灵石', 类型: '灵石',
      灵石: typeof it.灵石 === 'number' ? it.灵石 : undefined,
      stats: [], resources: [], descTags: [], effects: [], skills: [],
      desc: it.desc,
    };
  }
  const data = normalizeItemForMvu(it);
  const cv = dataToCardView(it.name, it.category, {
    品质: it.品质, 境界: it.境界, 类型: it.类型, 五行: it.五行,
  }, data);
  if (!cv.desc && it.desc) cv.desc = it.desc;
  return cv;
}
