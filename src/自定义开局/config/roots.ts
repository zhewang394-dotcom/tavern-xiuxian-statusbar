import type { RootChoice, RootMutation } from '../types';

// ============ 灵根属性常量 ============
export const ELEMENT_NORMAL = ['金', '木', '水', '火', '土'] as const;
export const ELEMENT_POLAR = ['阴', '阳'] as const;
/** 与其他属性互斥；只能单独存在或带变异 */
export const ELEMENT_EXCLUSIVE = ['混沌', '无'] as const;

/** 多选区可见的属性（金木水火土 + 阴阳） */
export const ELEMENT_COMBINABLE: readonly string[] = [...ELEMENT_NORMAL, ...ELEMENT_POLAR];

/** 显示在小色环里的字（限制 1 字以避免溢出） */
export const ELEMENT_GLYPH: Record<string, string> = {
  金: '金',
  木: '木',
  水: '水',
  火: '火',
  土: '土',
  阴: '阴',
  阳: '阳',
  混沌: '混',
  无: '无',
};

/** 单属性的简介（用于多选拼装时的多元素描述） */
export const ELEMENT_INTRO: Record<string, string> = {
  金: '锋锐利落，与金属相亲，剑修首选；攻势犀利。',
  木: '生发不息，与木相亲，灵植医道之路坦途。',
  水: '柔中带韧，与水相亲，丹师与符修青睐。',
  火: '烈焰焚天，与火相亲，炼器炼丹效率倍增。',
  土: '厚德载物，与土相亲，体魄稳健，护体功法事半功倍。',
  阴: '幽玄难测，神鬼莫测；幻术、心法皆有奇效。',
  阳: '至刚至烈，正法神通彰显气运。',
  混沌: '十方俱通，万法俱全；亘古难得一遇。',
  无: '凡骨之躯，自身无法引气入体；唯有借秘法接续灵根，或夺舍他人灵根，方有一线修真之机。',
};

// ============ 变异灵根预设 ============
export const ELEMENT_MUTATIONS: RootMutation[] = [
  // 金
  { id: 'mut-jian', name: '剑灵根', element: '金', desc: '锋锐凝炼，剑意自生，斩相绝伦。' },
  { id: 'mut-xue', name: '血灵根', element: '金', desc: '锐器淬血，攻伐凶悍，杀机弥漫。' },
  // 木
  { id: 'mut-feng', name: '风灵根', element: '木', desc: '生发为风，飘忽难测，疾如奔雷。' },
  { id: 'mut-du', name: '毒灵根', element: '木', desc: '草木藏毒，潜行噬命，忌惮重重。' },
  // 水
  { id: 'mut-bing', name: '冰灵根', element: '水', desc: '寒水成冰，封锁万物，肃杀凛冽。' },
  { id: 'mut-wu', name: '雾灵根', element: '水', desc: '水化为雾，藏身遁形，神识难辨。' },
  // 火
  { id: 'mut-lei', name: '雷灵根', element: '火', desc: '雷火并行，刚猛震慑，正煞两宜。' },
  { id: 'mut-mh', name: '冥火灵根', element: '火', desc: '阴冥之火，焚魂蚀魄，幽冷诡谲。' },
  // 土
  { id: 'mut-ci', name: '磁灵根', element: '土', desc: '操控金石，磁场缚敌，攻防一体。' },
  { id: 'mut-sha', name: '沙灵根', element: '土', desc: '飞沙走石，掩天蔽日，苍茫无际。' },
  // 阴
  { id: 'mut-you', name: '幽灵根', element: '阴', desc: '幽冥之气，鬼魅之姿，魂行无形。' },
  { id: 'mut-shaq', name: '煞灵根', element: '阴', desc: '煞气凝形，破煞伤魂，剑走偏锋。' },
  // 阳
  { id: 'mut-long', name: '龙灵根', element: '阳', desc: '阳气化龙，生威赫赫，万邪退避。' },
  { id: 'mut-fan', name: '梵灵根', element: '阳', desc: '梵音净心，光明炽炽，可降百魔。' },
  // 混沌
  { id: 'mut-xukong', name: '虚空灵根', element: '混沌', desc: '虚空之力，吞吐万象，超然物外。' },
  { id: 'mut-hunyuan', name: '混元灵根', element: '混沌', desc: '混元一气，万法同源，包罗万有。' },
  { id: 'mut-shikong', name: '时空灵根', element: '混沌', desc: '时空交错，超脱因果，逆乱纲常。' },
];

export const findMutation = (id: string | null): RootMutation | undefined =>
  id ? ELEMENT_MUTATIONS.find(m => m.id === id) : undefined;

export const mutationsByElement = (element: string): RootMutation[] =>
  ELEMENT_MUTATIONS.filter(m => m.element === element);

// ============ 选择校验 ============
export function isElementChosen(choice: RootChoice, el: string): boolean {
  return choice.elements.includes(el);
}

/** 灵根属性最大可选数（六/七灵根禁止） */
export const ELEMENT_MAX_PICK = 5;

/** 该属性是否可点（在当前选择下） */
export function canToggleElement(choice: RootChoice, el: string): boolean {
  const has = choice.elements.includes(el);
  if (has) return true;
  // 互斥属性：选中互斥时其它互斥与所有可组合都禁用
  if (ELEMENT_EXCLUSIVE.includes(el as any)) {
    return choice.elements.length === 0;
  }
  // 当前已选互斥属性，则禁止其它属性
  if (choice.elements.some(e => ELEMENT_EXCLUSIVE.includes(e as any))) {
    return false;
  }
  // 五行属性最多选 5 项（六灵根 / 七灵根 不开放）
  if (choice.elements.length >= ELEMENT_MAX_PICK) return false;
  // 五灵根（5 元素）必须恰为 金木水火土：阴阳不可参与凑齐五灵根
  if (choice.elements.length === 4) {
    const allNormal = choice.elements.every(e => (ELEMENT_NORMAL as readonly string[]).includes(e));
    if (!allNormal) return false;
    if (!(ELEMENT_NORMAL as readonly string[]).includes(el)) return false;
  }
  return true;
}

// ============ 变异是否可用 ============
export function canMutate(choice: RootChoice): boolean {
  if (choice.elements.length !== 1) return false;
  const el = choice.elements[0];
  if (el === '无') return false;
  return true;
}

// ============ 点数计算 ============
/**
 * 灵根越少 ≡ 资质越高 ≡ 越贵。
 * 对应世界设定中的稀有度：
 *   1 元素 → 单灵根（天灵根，绝世天骄）8
 *   1 元素 + 变异 → 变异灵根（最为罕见）10
 *   2 元素 → 双灵根（地灵根，天才之列）6
 *   3 元素 → 三灵根（真灵根，内门弟子门槛）2
 *   4 元素 → 四灵根（伪灵根/杂灵根，最常见）0
 *   5 元素 → 五灵根（全灵根，更罕见但修行极慢）2
 *   六/七灵根 不开放
 */
const TIER_BASE_COST: Record<number, number> = {
  1: 8,
  2: 6,
  3: 2,
  4: 0,
  5: 2,
};
const MUTATION_COST = 2;
const CHAOS_COST = 16;

export function computeRootCost(choice: RootChoice): number {
  const els = choice.elements;
  if (els.length === 0) return 0;
  if (els.includes('无')) return 0;
  if (els.includes('混沌')) {
    return CHAOS_COST + (choice.mutation ? MUTATION_COST : 0);
  }
  // 阴/阳 视同五行属性，计入元素数即可，不再额外加成
  const base = TIER_BASE_COST[els.length] ?? 0;
  let total = base;
  if (choice.mutation && els.length === 1) total += MUTATION_COST;
  return total;
}

// ============ 名称 / 品阶 / 描述 推导 ============
const TIER_LABEL: Record<number, string> = {
  2: '双灵根',
  3: '三灵根',
  4: '四灵根',
  5: '五灵根',
  6: '六灵根',
  7: '七灵根',
};

const TIER_HONOR: Record<number, string> = {
  1: '单灵根 · 天灵根',
  2: '双灵根 · 地灵根',
  3: '三灵根 · 真灵根',
  4: '四灵根 · 杂灵根',
  5: '五灵根 · 全灵根',
};

export function rootTierLabel(choice: RootChoice): string {
  const els = choice.elements;
  if (els.length === 0) return '未择';
  if (els.includes('无')) return '无灵根 · 凡骨';
  if (els.includes('混沌')) return choice.mutation ? '上品变异灵根' : '上品灵根';
  if (choice.mutation && els.length === 1) return '变异天灵根';
  return TIER_HONOR[els.length] || '混合灵根';
}

/**
 * MVU schema 合法品阶（不含尊称后缀）：
 *   无灵根 / 单灵根 / 双灵根 / 三灵根 / 四灵根 / 五灵根
 *
 * 规则：
 *   - 无灵根 → 无灵根
 *   - 混沌（不论是否变异） → 单灵根（混沌只存在单灵根或单灵根变异）
 *   - 单灵根 + 变异 → 单灵根（变异灵根本质仍是单灵根）
 *   - 其余按元素数量映射
 */
export function rootTierCanonical(choice: RootChoice): string {
  const els = choice.elements;
  if (els.length === 0) return '无灵根';
  if (els.includes('无')) return '无灵根';
  if (els.includes('混沌')) return '单灵根';
  const map: Record<number, string> = {
    1: '单灵根',
    2: '双灵根',
    3: '三灵根',
    4: '四灵根',
    5: '五灵根',
  };
  return map[els.length] || '单灵根';
}

export function rootDisplayName(choice: RootChoice): string {
  const els = choice.elements;
  if (els.length === 0) return '未择灵根';
  if (els.includes('无')) return '凡品灵根';
  if (els.includes('混沌')) {
    if (choice.mutation) {
      const fallback = findMutation(choice.mutationId)?.name || '混沌变异灵根';
      const name = (choice.customName || '').trim();
      return name || fallback;
    }
    return '混沌灵根';
  }
  if (els.length === 1) {
    if (choice.mutation) {
      const fallback = findMutation(choice.mutationId)?.name || `${els[0]}变异灵根`;
      const name = (choice.customName || '').trim();
      return name || fallback;
    }
    return `${els[0]}灵根`;
  }
  return `${els.join('')}${TIER_LABEL[els.length] || '灵根'}`;
}

export function rootDescription(choice: RootChoice): string {
  const els = choice.elements;
  if (els.length === 0) return '请于上方择取灵根属性。';
  if (els.includes('无')) return ELEMENT_INTRO['无'];
  if (els.includes('混沌')) {
    if (choice.mutation) {
      const m = findMutation(choice.mutationId);
      if (m) return m.desc;
      return '混沌之上更生变异，玄妙难以言传。';
    }
    return ELEMENT_INTRO['混沌'];
  }
  if (choice.mutation && els.length === 1) {
    const m = findMutation(choice.mutationId);
    if (m) return m.desc;
    return `${els[0]}属性的变异灵根，玄机自在心知。`;
  }
  if (els.length === 1) return ELEMENT_INTRO[els[0]] || '';
  return els.map(e => `「${e}」${ELEMENT_INTRO[e] || ''}`).join(' ');
}

/** 在小圆环中显示的字（保证 1 字宽） */
export function elementGlyph(el: string): string {
  return ELEMENT_GLYPH[el] || el;
}

/** 工厂：默认空选择 */
export function emptyRootChoice(): RootChoice {
  return { elements: [], mutation: false, mutationId: null, customName: '' };
}

/** 工厂：用于兼容老预设（缺字段或异常时回退） */
export function normalizeRootChoice(raw: any): RootChoice {
  if (!raw || typeof raw !== 'object') return emptyRootChoice();
  const elements = Array.isArray(raw.elements) ? raw.elements.filter((e: any) => typeof e === 'string') : [];
  const mutation = !!raw.mutation;
  const mutationId = typeof raw.mutationId === 'string' ? raw.mutationId : null;
  const customName = typeof raw.customName === 'string' ? raw.customName : '';
  return { elements, mutation, mutationId, customName };
}
