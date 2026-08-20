/**
 * 自创资材编辑器：按 类型 驱动的字段 schema
 *
 * 公式依据 [[物品功法生成规则].txt]:
 *   - 系数公式: floor(10^L × 系数 × (1+Q))
 *   - d20 公式 (命中/闪避): max(1, floor(L/2 + 2Q))
 *   - 百分比公式 (穿透%/减免%): L × 5 + Q × 20
 *
 * 用户填了就用用户值；没填则交给 itemNormalizer 按公式自动算。
 */

import type { ItemKind, ItemQuality, ItemRealm } from '../types';

export type FieldType =
  | 'number'   // 整数 ≥ 0，按系数公式算推荐区间
  | 'percent'  // 百分比整数 0~100
  | 'integer'  // 普通整数（数量等）
  | 'string'   // 单行文本
  | 'select'   // 下拉
  | 'toggle';  // 布尔开关

/** 范围算法 */
export type FormulaKind = 'coef' | 'd20' | 'pct' | 'fixed';

/** 字段所属分组（决定写回 CustomItem 哪个字段） */
export type FieldGroup = 'top' | '数值' | '资源池';

export interface FieldDef {
  /** CustomItem 上的 key（如 攻击力 / 数量 / 位置 / 加成型） */
  key: string;
  /** 显示名 */
  label: string;
  type: FieldType;
  /** 分组：top 直接挂在 CustomItem，数值/资源池挂在对应子对象 */
  group: FieldGroup;
  /** 仅 type=number 用：系数范围 [lo, hi]，配合 formula=coef 生成推荐区间 */
  coefRange?: [number, number];
  /** 计算方式；不填默认为 coef（前提是 coefRange 存在） */
  formula?: FormulaKind;
  /** 仅 select：可选值 */
  options?: string[];
  /** 默认值（未填时） */
  default?: any;
  /** 占位文本 */
  placeholder?: string;
  /** 自由文本提示，渲染于输入框下方灰字 */
  hint?: string;
  /** 仅 type=string：用于生成动态 placeholder「如:灵气N，留空则无消耗」
   *  N = floor(10^L × placeholderCoef × (1+Q))；不填则用 placeholder 静态值 */
  placeholderCoef?: number;
}

// ============ 系数表（按 [物品功法生成规则] 第 6~28 行） ============

/** 各类型字段 schema */
export const FIELD_SCHEMAS: Partial<Record<ItemKind, FieldDef[]>> = {
  // —— 功法 ——
  心法: [
    { key: '修行速度', label: '修行速度', type: 'number', group: '数值', formula: 'coef', coefRange: [0.1, 0.5] },
    { key: '消耗', label: '消耗', type: 'string', group: 'top', placeholderCoef: 0.25 },
  ],
  攻击: [
    { key: '命中', label: '命中', type: 'number', group: '数值', formula: 'd20' },
    { key: '穿透', label: '穿透%', type: 'percent', group: '数值', formula: 'pct' },
    { key: '攻击力', label: '攻击力', type: 'number', group: '数值', formula: 'coef', coefRange: [0.2, 0.5] },
    { key: '消耗', label: '消耗', type: 'string', group: 'top', placeholderCoef: 0.25 },
  ],
  咒法: [
    { key: '命中', label: '命中', type: 'number', group: '数值', formula: 'd20' },
    { key: '穿透', label: '穿透%', type: 'percent', group: '数值', formula: 'pct' },
    { key: '攻击力', label: '攻击力', type: 'number', group: '数值', formula: 'coef', coefRange: [0.2, 0.5] },
    { key: '消耗', label: '消耗', type: 'string', group: 'top', placeholderCoef: 0.25 },
  ],
  身法: [
    { key: '闪避', label: '闪避', type: 'number', group: '数值', formula: 'd20' },
    { key: '遁速', label: '遁速', type: 'number', group: '数值', formula: 'coef', coefRange: [0.5, 2.5] },
    { key: '消耗', label: '消耗', type: 'string', group: 'top', placeholderCoef: 0.25 },
  ],
  护体: [
    { key: '护体触发', label: '触发条件', type: 'select', group: 'top', options: ['灵气受击', '气血受击'], default: '灵气受击' },
    { key: '减免', label: '减免%', type: 'percent', group: '数值', formula: 'pct' },
    { key: '防御力', label: '防御力', type: 'number', group: '数值', formula: 'coef', coefRange: [0.1, 0.4] },
    { key: '消耗', label: '消耗', type: 'string', group: 'top', placeholderCoef: 0.25 },
  ],
  阵法: [
    { key: '灵气容量', label: '灵气容量', type: 'number', group: '数值', formula: 'coef', coefRange: [2, 6] },
    { key: '攻击力', label: '攻击力', type: 'number', group: '数值', formula: 'coef', coefRange: [0, 0.3], hint: '非攻击类阵法可填 0' },
  ],
  // —— 装备 ——
  法宝: [
    { key: '攻击力', label: '攻击力', type: 'number', group: '数值', formula: 'coef', coefRange: [0.1, 0.3] },
    { key: '消耗', label: '消耗', type: 'string', group: 'top', placeholderCoef: 0.1 },
    { key: '位置', label: '位置', type: 'select', group: 'top', options: ['手部', '腰间', '储物袋'], default: '手部' },
  ],
  护甲: [
    { key: '防御力', label: '防御力', type: 'number', group: '数值', formula: 'coef', coefRange: [0, 0.2], hint: '特殊护甲可填 0' },
    { key: '位置', label: '位置', type: 'select', group: 'top', options: ['上装', '下装', '头部', '足部', '文胸', '内裤', '袜类', '外搭'], default: '上装' },
    { key: '消耗', label: '消耗', type: 'string', group: 'top', placeholderCoef: 0.1 },
  ],
  饰品: [
    { key: '位置', label: '位置', type: 'select', group: 'top', options: ['腰间', '项链', '戒指', '手部', '头部', '足部'], default: '腰间' },
    { key: '消耗', label: '消耗', type: 'string', group: 'top', placeholderCoef: 0.1 },
  ],
  工具: [
    { key: '加成型', label: '核心生产工具', type: 'toggle', group: 'top', default: false, hint: '丹炉/器鼎/符笔等启用后会按品质给出加成数值' },
  ],
  // —— 物品 ——
  丹药: [
    { key: '数量', label: '数量', type: 'integer', group: 'top', default: 1 },
  ],
  符箓: [
    { key: '数量', label: '数量', type: 'integer', group: 'top', default: 1 },
    { key: '攻击型', label: '攻击型', type: 'toggle', group: 'top', default: true, hint: '非攻击符箓关闭后攻击力计为 0' },
    { key: '攻击力', label: '攻击力', type: 'number', group: '数值', formula: 'coef', coefRange: [0, 0.8] },
    { key: '灵气消耗', label: '灵气消耗', type: 'number', group: '数值', formula: 'coef', coefRange: [0.1, 0.3] },
  ],
  秘籍: [
    { key: '完整度', label: '完整度', type: 'select', group: 'top', options: ['残缺', '抄本', '原本'], default: '抄本' },
  ],
  素材: [
    { key: '炼制难度', label: '炼制难度', type: 'number', group: '数值', formula: 'coef', coefRange: [0.5, 0.5], hint: '默认按 0.5 系数自动估算' },
  ],
  // —— 傀儡/灵兽 ——
  傀儡: [
    { key: '气血', label: '气血上限', type: 'number', group: '资源池', formula: 'coef', coefRange: [0.5, 1] },
    { key: '灵气', label: '灵气上限', type: 'number', group: '资源池', formula: 'coef', coefRange: [0.5, 0.5] },
    { key: '遁速', label: '遁速', type: 'number', group: '资源池', formula: 'coef', coefRange: [0.5, 2] },
    { key: '防御力', label: '防御力', type: 'number', group: '数值', formula: 'coef', coefRange: [0, 0.2] },
  ],
  灵兽: [
    { key: '气血', label: '气血上限', type: 'number', group: '资源池', formula: 'coef', coefRange: [5, 15] },
    { key: '灵气', label: '灵气上限', type: 'number', group: '资源池', formula: 'coef', coefRange: [0.5, 0.5] },
    { key: '遁速', label: '遁速', type: 'number', group: '资源池', formula: 'coef', coefRange: [0.5, 2] },
    { key: '防御力', label: '防御力', type: 'number', group: '数值', formula: 'coef', coefRange: [0, 0.2] },
  ],
};

/** 拥有「技能」子编辑器的类型 */
export const SKILL_SUPPORTED_KINDS: ReadonlySet<ItemKind> = new Set<ItemKind>(['傀儡', '灵兽']);

/** 技能内部数值字段的系数范围（按规则表） */
export const SKILL_ATTACK_COEF_RANGE: [number, number] = [0, 0.3];

// ============ 公式计算 ============

const REALM_L: Record<string, number> = {
  炼气: 1, 练气: 1, 筑基: 2, 金丹: 3, 元婴: 4, 化神: 5,
};
const QUALITY_Q: Record<string, number> = {
  凡: 0, 黄: 0.25, 玄: 0.5, 地: 0.75, 天: 1.0,
};

export function realmL(realm: ItemRealm): number {
  return REALM_L[realm] ?? 1;
}
export function qualityQ(quality: ItemQuality): number {
  return QUALITY_Q[quality] ?? 0;
}

export interface SuggestedRange {
  /** 推荐下限 */
  min: number;
  /** 推荐上限 */
  max: number;
  /** 推荐中值（输入框 placeholder 用） */
  suggested: number;
  /** 字段是否为「固定值」（min===max） */
  fixed: boolean;
  /** 字段单位（"" / "%"） */
  unit: string;
}

/** 计算字段的推荐区间；返回 null 表示无公式可算（如纯字符串字段） */
export function computeSuggestedRange(
  def: FieldDef,
  L: number,
  Q: number,
): SuggestedRange | null {
  const unit = def.type === 'percent' ? '%' : '';
  if (def.formula === 'd20') {
    const v = Math.max(1, Math.floor(L / 2 + 2 * Q));
    return { min: v, max: v, suggested: v, fixed: true, unit };
  }
  if (def.formula === 'pct') {
    const v = Math.max(0, Math.floor(L * 5 + Q * 20));
    return { min: v, max: v, suggested: v, fixed: true, unit };
  }
  if (def.formula === 'coef' && def.coefRange) {
    const [lo, hi] = def.coefRange;
    const base = Math.pow(10, L);
    const factor = 1 + Q;
    const min = Math.max(0, Math.floor(base * lo * factor));
    const max = Math.max(0, Math.floor(base * hi * factor));
    const suggested = Math.max(0, Math.floor(base * ((lo + hi) / 2) * factor));
    return { min, max, suggested, fixed: min === max, unit };
  }
  return null;
}

/** 渲染推荐区间提示文本 */
export function rangeHintText(r: SuggestedRange): string {
  if (r.fixed) return `推荐：${r.min}${r.unit}`;
  return `推荐 ${r.min}~${r.max}${r.unit}`;
}

/** 判断当前值是否超过推荐上限（用于黄色警告） */
export function isOverRecommended(value: number, r: SuggestedRange | null): boolean {
  if (!r || r.fixed) return false;
  return value > r.max;
}
