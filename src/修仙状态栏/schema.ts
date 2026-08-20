import { z } from 'zod';

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

const normalizeStringArray = (input: unknown): string[] => {
  if (input == null || input === '') return [];
  let value = input;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) value = parsed;
    } catch {
      /* 按普通分隔字符串处理 */
    }
  }
  const source = Array.isArray(value) ? value.flat(Infinity) : String(value).split(/[,，、;；|]/);
  return [...new Set(source.map(item => String(item).trim()).filter(Boolean))];
};

const normalizeStringRecord = (input: unknown): Record<string, string> => {
  if (input == null || input === '') return {};
  if (typeof input === 'string') return { 说明: input };
  if (Array.isArray(input)) {
    return Object.fromEntries(input.map((value, index) => [`效果${index + 1}`, String(value ?? '')]));
  }
  if (typeof input !== 'object') return { 说明: String(input) };
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value),
    ]),
  );
};

const looseString = (fallback: string) =>
  z.preprocess(value => (value == null ? fallback : typeof value === 'string' ? value : String(value)), z.string());

const looseNonNegativeInteger = (input: unknown): number => {
  if (typeof input === 'number' && Number.isFinite(input)) return Math.max(0, Math.trunc(input));
  const matched = String(input ?? '').match(/-?\d+(?:\.\d+)?/);
  return Math.max(0, Math.trunc(matched ? Number(matched[0]) : 0));
};

// ===== 公用枚举 =====
const FiveElementValues = ['金', '木', '水', '火', '土', '阴', '阳', '混沌'] as const;
type FiveElement = (typeof FiveElementValues)[number];

// AI 有时会把单值五行写成数组、复合字符串或变异属性名；统一取输入中最先出现的可识别属性。
// 变异属性映射遵循世界书《世界设定-灵根与体质》，并补充常见的同义描述。
const FIVE_ELEMENT_ALIAS_MAP: Readonly<Record<string, FiveElement>> = {
  金: '金',
  木: '木',
  水: '水',
  火: '火',
  土: '土',
  阴: '阴',
  阳: '阳',
  混沌: '混沌',
  剑: '金',
  血: '金',
  metal: '金',
  风: '木',
  毒: '木',
  wood: '木',
  冰: '水',
  雾: '水',
  霜: '水',
  雪: '水',
  寒: '水',
  water: '水',
  ice: '水',
  雷: '火',
  冥火: '火',
  炎: '火',
  焰: '火',
  fire: '火',
  磁: '土',
  沙: '土',
  岩: '土',
  earth: '土',
  soil: '土',
  幽: '阴',
  煞: '阴',
  暗: '阴',
  影: '阴',
  冥: '阴',
  yin: '阴',
  龙: '阳',
  梵: '阳',
  光: '阳',
  日: '阳',
  yang: '阳',
  虚空: '混沌',
  混元: '混沌',
  时空: '混沌',
  chaos: '混沌',
};

const FiveElementAliases = Object.entries(FIVE_ELEMENT_ALIAS_MAP).sort(([left], [right]) => right.length - left.length);

const normalizeFiveElement = (input: unknown): FiveElement | undefined => {
  const candidates = Array.isArray(input) ? input.flat(Infinity) : [input];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const normalizedCandidate = candidate.toLowerCase();

    for (let index = 0; index < normalizedCandidate.length; index += 1) {
      const matched = FiveElementAliases.find(([alias]) => normalizedCandidate.startsWith(alias, index));
      if (matched) return matched[1];
    }
  }

  // 完全无法识别时删除这个可选字段，避免一个非法五行导致整个人物或物品更新失败。
  return undefined;
};

const FiveElementsEnum = z.preprocess(normalizeFiveElement, z.enum(FiveElementValues).optional());
const FiveElementsExtEnum = z.enum(['金', '木', '水', '火', '土', '阴', '阳', '混沌', '未知', '无']);
const QualityEnum = z.enum(['凡', '黄', '玄', '地', '天']);
const SpiritualRootRankEnum = z.enum(['无灵根', '未检测', '单灵根', '双灵根', '三灵根', '四灵根', '五灵根']);

// ===== 寿元 Schema =====
const LifespanSchema = z
  .object({
    年龄: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .prefault(0),
    寿命: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .prefault(100),
    外观年龄: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .prefault(18),
  })
  .prefault({ 年龄: 0, 寿命: 100, 外观年龄: 18 });

// ===== 灵根 Schema =====
const SpiritualRootSchema = z
  .object({
    名称: z.string().prefault('未检测'),
    五行: z.array(FiveElementsExtEnum).prefault(['未知']),
    品阶: SpiritualRootRankEnum.prefault('未检测'),
  })
  .prefault({ 名称: '未检测', 五行: ['未知'], 品阶: '未检测' });

// ===== 体质 Schema =====
const PhysiqueSchema = z
  .object({
    名称: z.string().prefault('凡体'),
    效果: z.record(z.string(), z.string()).optional(),
    悟性: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .prefault(0),
    根骨: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .prefault(0),
    气感: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .prefault(0),
    // 元阴/元阳: 性征三态(true 处子 / false 已破 / null 不存在)。null≡该性征不适用;
    //   性别由 (元阴,元阳) 值组合判定(单边成立=女/男, 其余=其他)。
    元阴: z.boolean().nullable().optional(),
    元阳: z.boolean().nullable().optional(),
  })
  .prefault({ 名称: '凡体', 悟性: 0, 根骨: 0, 气感: 0 });

// ===== 修炼进度 Schema =====
const CultivationProgressSchema = z
  .object({
    境界: z.string().prefault('凡人'),
    当前进度: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .prefault(0),
    进度上限: z.coerce
      .number()
      .transform(n => clamp(n, 1, Infinity))
      .prefault(100),
    天谴: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .prefault(0),
    丹毒: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .prefault(0),
  })
  .prefault({ 境界: '凡人', 当前进度: 0, 进度上限: 100, 天谴: 0, 丹毒: 0 });

// ===== 技艺 Schema =====
const SkillSchema = z
  .object({
    生产类: z
      .object({
        炼器: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        驯兽: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        培育: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        医术: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        炼丹: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        制符: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
      })
      .prefault({}),
    战斗类: z
      .object({
        御物: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        咒法: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        幻术: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        阵法: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        神识: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
        炼体: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(0),
      })
      .prefault({}),
  })
  .prefault({});

// ===== 资源池 Schema (气血/灵气/遁速) =====
const ResourcePoolSchema = z
  .object({
    气血: z
      .object({
        现值: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(100),
        上限: z.coerce
          .number()
          .transform(n => clamp(n, 1, Infinity))
          .prefault(100),
      })
      .prefault({ 现值: 100, 上限: 100 }),
    灵气: z
      .object({
        现值: z.coerce
          .number()
          .transform(n => clamp(n, 0, Infinity))
          .prefault(100),
        上限: z.coerce
          .number()
          .transform(n => clamp(n, 1, Infinity))
          .prefault(100),
      })
      .prefault({ 现值: 100, 上限: 100 }),
    遁速: z.coerce
      .number()
      .transform(n => clamp(n, 0, Infinity))
      .describe('单位：m/s')
      .prefault(10),
  })
  .prefault({ 气血: { 现值: 100, 上限: 100 }, 灵气: { 现值: 100, 上限: 100 }, 遁速: 10 });

// ===== 状态效果 Schema =====
const StatusEffectSchema = z.object({
  类型: z.enum(['增益', '减益', '特殊']).prefault('特殊'),
  效果: z.record(z.string(), z.string()).optional(),
  层数: z.coerce
    .number()
    .transform(n => clamp(n, 0, Infinity))
    .prefault(1),
  剩余时间: z.string().prefault('永久'),
  来源: z.string().prefault(''),
});

// ===== 功法 Schema =====
const CultivationArtSchema = z.object({
  使用中: z.boolean().prefault(false),
  品质: QualityEnum.prefault('凡'),
  境界: z.string().prefault('练气期'),
  五行: FiveElementsEnum.optional(),
  类型: z.enum(['心法', '攻击', '幻术', '神识', '咒法', '身法', '护体', '阵法']).prefault('心法'),
  消耗: z.string().optional(),
  标签: z.array(z.string()).prefault([]),
  效果: z.record(z.string(), z.string()).optional(),
  描述: z.string().prefault(''),
});

// ===== 物品 Schema =====
const ItemSchema = z.object({
  品质: QualityEnum.prefault('凡'),
  境界: z.string().optional(),
  类型: z.enum(['秘籍', '配方', '符箓', '丹药', '素材', '工具']).prefault('素材'),
  消耗: z.string().optional(),
  五行: FiveElementsEnum.optional(),
  标签: z.array(z.string()).prefault([]),
  数量: z.coerce
    .number()
    .transform(n => clamp(n, 0, Infinity))
    .prefault(0),
  效果: z.record(z.string(), z.string()).optional(),
  描述: z.string().prefault(''),
});

// ===== 装备 Schema (法宝/护甲/饰品 合并;攻击力/防御力 在 标签中表示) =====
const EquipmentSchema = z.object({
  品质: QualityEnum.prefault('凡'),
  境界: z.string().optional(),
  类型: z.enum(['法宝', '护甲', '饰品']).prefault('法宝'),
  消耗: z.string().optional(),
  五行: FiveElementsEnum.optional(),
  标签: z.array(z.string()).prefault([]), // 法宝→[攻击力:N]、护甲→[防御力:N]
  效果: z.record(z.string(), z.string()).optional(),
  描述: z.string().prefault(''),
  位置: z.string().prefault('储物袋'),
});

// ===== 傀儡/灵兽 技能 Schema =====
const CombatSkillSchema = z.object({
  攻击力: z.coerce
    .number()
    .transform(n => clamp(n, 0, Infinity))
    .prefault(0),
  消耗: z.string().optional(),
  效果: z.record(z.string(), z.string()).optional(),
});

// ===== 傀儡/灵兽 Schema =====
const CombatUnitSchema = z.object({
  使用中: z.boolean().prefault(false),
  品质: QualityEnum.prefault('凡'),
  境界: z.string().prefault('凡人'),
  五行: FiveElementsEnum.optional(),
  标签: z.array(z.string()).prefault([]),
  描述: z.string().prefault(''),
  资源池: ResourcePoolSchema,
  防御力: z.coerce
    .number()
    .transform(n => clamp(n, 0, Infinity))
    .prefault(0),
  技能: z.record(z.string(), CombatSkillSchema).prefault({}),
});

// ===== 储物字段(根级 + NPC 共用,直接 spread 进 z.object) =====
const StorageFields = {
  灵石: z.coerce
    .number()
    .transform(n => clamp(n, 0, Infinity))
    .describe('默认单位为下品灵石')
    .prefault(0),
  物品: z.record(z.string(), ItemSchema).prefault({}),
  装备: z.record(z.string(), EquipmentSchema).prefault({}),
  傀儡: z.record(z.string(), CombatUnitSchema).prefault({}),
  灵兽: z.record(z.string(), CombatUnitSchema).prefault({}),
};

// ===== NPC Schema (类型='人物') =====
const NPCSchema = z.object({
  类型: z.literal('人物').prefault('人物'),
  在场: z.boolean().prefault(false),
  种族: z.string().prefault('人族'),
  身份: z.array(z.string()).prefault([]),
  修炼进度: CultivationProgressSchema,
  寿元: LifespanSchema,
  灵根: SpiritualRootSchema,
  体质: PhysiqueSchema, // 元阴/元阳 已并入 体质
  技艺: SkillSchema,
  资源池: ResourcePoolSchema,
  状态效果: z.record(z.string(), StatusEffectSchema).prefault({}),
  功法: z.record(z.string(), CultivationArtSchema).prefault({}),
  ...StorageFields, // 灵石 / 物品 / 装备 / 傀儡 / 灵兽 直接挂在 NPC 根级,与 user 一致
  性格: z.string().prefault(''),
  外貌: z.string().prefault(''),
  着装: z.string().prefault(''),
  道侣: z.boolean().prefault(false),
  好感度: z.coerce
    .number()
    .transform(n => clamp(n, -100, 100))
    .prefault(0),
  // 细节可见（前端偏好）：默认 true；为 false 时，变量输出 EJS 会把该 NPC 的
  // 物品/功法/装备/傀儡/灵兽 从发送给 AI 的 <status_current_variable> 中隐去。
  细节可见: z.boolean().prefault(true),
  // 性器（外部脚本按五行随机填充，AI 只读不更新；仅 NSFW 基础指导开启时经专属条目发给 AI）。
  // key = 口腔/屄穴/肛门/乳房（或玩家自填）；value = 名器"描述"（不含名器名）。
  性器: z.record(z.string(), z.string()).prefault({}),
});

// ===== 无主战斗单位 (关系列表条目, 类型='傀儡'|'灵兽') =====
// 与 *combat_unit 类似,但用于 关系列表 中表达 "野生妖兽 / 遗弃傀儡 / 临时随从" 等无主形态
const WildPuppetSchema = z.object({
  类型: z.literal('傀儡'),
  在场: z.boolean().prefault(true),
  品质: QualityEnum.prefault('凡'),
  境界: z.string().prefault('凡人'),
  五行: FiveElementsEnum.optional(),
  标签: z.array(z.string()).prefault([]),
  描述: z.string().prefault(''),
  资源池: ResourcePoolSchema,
  防御力: z.coerce
    .number()
    .transform(n => clamp(n, 0, Infinity))
    .prefault(0),
  技能: z.record(z.string(), CombatSkillSchema).prefault({}),
  状态效果: z.record(z.string(), StatusEffectSchema).prefault({}),
  好感度: z.coerce
    .number()
    .transform(n => clamp(n, -100, 100))
    .prefault(-50), // 无主战斗单位默认敌对
});

const WildBeastSchema = WildPuppetSchema.extend({
  类型: z.literal('灵兽'),
});

// ===== 关系列表 条目 = 人物 | 傀儡 | 灵兽 =====
// preprocess: 老数据/AI遗漏 类型 字段时 默认补 '人物',保持向后兼容
const RelationEntrySchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object' && !val.类型) {
      return { ...val, 类型: '人物' };
    }
    return val;
  },
  z.discriminatedUnion('类型', [NPCSchema, WildPuppetSchema, WildBeastSchema]),
);

// ===== 地点 Schema =====
const LocationSchema = z
  .object({
    世界: z.enum(['凡界', '灵界', '仙界']).prefault('凡界'),
    地域: z.string().prefault('中原'),
    具体地点: z.string().prefault('荒野'),
  })
  .prefault({ 世界: '凡界', 地域: '中原', 具体地点: '荒野' });

// ===== 时间 Schema =====
const timePeriods = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const timePeriodValues = [
  '子时',
  '丑时',
  '寅时',
  '卯时',
  '辰时',
  '巳时',
  '午时',
  '未时',
  '申时',
  '酉时',
  '戌时',
  '亥时',
] as const;
const timePeriodAliases: Record<string, (typeof timePeriods)[number]> = {
  夜半: '子',
  子夜: '子',
  午夜: '子',
  鸡鸣: '丑',
  平旦: '寅',
  日出: '卯',
  食时: '辰',
  隅中: '巳',
  日中: '午',
  日昳: '未',
  晡时: '申',
  日入: '酉',
  黄昏: '戌',
  人定: '亥',
};

const normalizeTimePeriod = (input: unknown) => {
  const text = String(input ?? '').trim();
  const period = timePeriods.find(
    item => text === item || ['时', '初', '正', '刻', '中', '末', '半'].some(suffix => text.includes(`${item}${suffix}`)),
  );
  if (period) return `${period}时`;
  const alias = Object.entries(timePeriodAliases).find(([name]) => text.includes(name));
  return alias ? `${alias[1]}时` : '午时';
};

const TimeSchema = z
  .object({
    年: z.coerce.number().prefault(1),
    月: z.coerce
      .number()
      .transform(n => clamp(n, 1, 12))
      .prefault(1),
    日: z.coerce
      .number()
      .transform(n => clamp(n, 1, 30))
      .prefault(1),
    // “子时中 / 子时三刻 / 子初 / 子正”等可理解写法统一收敛到所属时辰。
    时辰: z.preprocess(normalizeTimePeriod, z.enum(timePeriodValues)).prefault('午时'),
  })
  .prefault({ 年: 1, 月: 1, 日: 1, 时辰: '午时' });

// ===== 固定资产 Schema =====
// 固定资产是 AI 高频增量更新字段：允许常见别名、带单位数字、字符串地点/日期与数组式设施，
// 先归一化再校验，避免一个可理解的小格式错误拖垮整批 MVU 更新。
const assetType = (input: unknown): '宗门' | '店铺' | '洞府' => {
  const text = String(input ?? '')
    .trim()
    .toLowerCase();
  if (/宗门|宗派|门派|宗族|sect/.test(text)) return '宗门';
  if (/店铺|商铺|铺面|坊市|商行|商会|store|shop/.test(text)) return '店铺';
  return '洞府';
};

const normalizeAssetLocation = (input: unknown) => {
  if (typeof input === 'string') {
    const parts = input.split(/\s*(?:[·•>＞/／|]|\s+-\s+)\s*/).filter(Boolean);
    const hasWorld = !!parts[0] && /[凡灵仙]界/.test(parts[0]);
    return {
      世界: hasWorld ? parts[0] : '凡界',
      地域: hasWorld ? parts[1] || '中原' : parts.length >= 2 ? parts[0] : '中原',
      具体地点: hasWorld
        ? parts.length >= 3
          ? parts.slice(2).join('·')
          : '荒野'
        : parts.length >= 2
          ? parts.slice(1).join('·')
          : parts[0] || '荒野',
    };
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const value = input as Record<string, unknown>;
  return {
    世界: value.世界 ?? value.界域 ?? value.位面 ?? '凡界',
    地域: value.地域 ?? value.区域 ?? value.州域 ?? '中原',
    具体地点: value.具体地点 ?? value.地点 ?? value.地址 ?? value.位置 ?? '荒野',
  };
};

const AssetLocationSchema = z
  .preprocess(
    normalizeAssetLocation,
    z.object({
      世界: z.preprocess(
        value => (/仙/.test(String(value)) ? '仙界' : /灵/.test(String(value)) ? '灵界' : '凡界'),
        z.enum(['凡界', '灵界', '仙界']),
      ),
      地域: looseString('中原'),
      具体地点: looseString('荒野'),
    }),
  )
  .prefault({ 世界: '凡界', 地域: '中原', 具体地点: '荒野' });

const normalizeAssetTime = (input: unknown) => {
  if (input == null || ['无', '暂无', '从未', '未收取', 'null'].includes(String(input).trim())) return null;
  if (typeof input === 'string') {
    const numbers = input.match(/\d+/g)?.map(Number) ?? [];
    if (numbers.length === 0) return null;
    return { 年: numbers[0], 月: numbers[1] ?? 1, 日: numbers[2] ?? 1, 时辰: normalizeTimePeriod(input) };
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  return {
    年: value.年 ?? value.year ?? 1,
    月: value.月 ?? value.month ?? 1,
    日: value.日 ?? value.day ?? 1,
    时辰: value.时辰 ?? value.时间 ?? '午时',
  };
};

const AssetTimeSchema = z.preprocess(normalizeAssetTime, TimeSchema.nullable()).prefault(null);

const normalizeNamedRecord = (input: unknown, fallbackName: string): Record<string, unknown> => {
  if (input == null || input === '') return {};
  if (!Array.isArray(input)) return typeof input === 'object' ? (input as Record<string, unknown>) : {};
  return Object.fromEntries(
    input.map((entry, index) => {
      const value =
        entry && typeof entry === 'object'
          ? ({ ...(entry as Record<string, unknown>) } as Record<string, unknown>)
          : { 效果: entry };
      const name = String(value.名称 ?? value.设施名 ?? value.资产名 ?? `${fallbackName}${index + 1}`).trim();
      delete value.名称;
      delete value.设施名;
      delete value.资产名;
      return [name || `${fallbackName}${index + 1}`, value];
    }),
  );
};

const AssetFacilitySchema = z.preprocess(
  input => {
    if (typeof input === 'string') return { 效果: input };
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    const value = input as Record<string, unknown>;
    return {
      效果: value.效果 ?? value.效用 ?? value.功能,
      每月产出: value.每月产出 ?? value.月产出 ?? value.产出,
      上次收取日期: value.上次收取日期 ?? value.上次收取 ?? value.收取日期,
    };
  },
  z.object({
    效果: z.preprocess(normalizeStringRecord, z.record(z.string(), z.string())).prefault({}),
    每月产出: looseString('无').prefault('无'),
    上次收取日期: AssetTimeSchema,
  }),
);

const FixedAssetSchema = z.preprocess(
  input => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    const value = input as Record<string, unknown>;
    return {
      类型: value.类型 ?? value.分类 ?? value.资产类型,
      人员规模: value.人员规模 ?? value.人数 ?? value.规模,
      所在地: value.所在地 ?? value.地址 ?? value.位置,
      现状: value.现状 ?? value.状态 ?? value.当前状态,
      设施: normalizeNamedRecord(value.设施 ?? value.建筑 ?? value.功能区, '新设施'),
      所属人物: value.所属人物 ?? value.人员 ?? value.归属人物 ?? value.成员,
    };
  },
  z.object({
    类型: z.preprocess(assetType, z.enum(['宗门', '店铺', '洞府'])).prefault('洞府'),
    人员规模: z.preprocess(looseNonNegativeInteger, z.number().int().min(0)).prefault(0),
    所在地: AssetLocationSchema,
    现状: looseString('正常').prefault('正常'),
    设施: z
      .preprocess(value => normalizeNamedRecord(value, '新设施'), z.record(z.string(), AssetFacilitySchema))
      .prefault({}),
    所属人物: z.preprocess(normalizeStringArray, z.array(z.string())).prefault([]),
  }),
);

const FixedAssetsSchema = z
  .preprocess(value => normalizeNamedRecord(value, '新资产'), z.record(z.string(), FixedAssetSchema))
  .prefault({});

// ===== 传闻 Schema =====
// 内容由前端引擎 src/修仙状态栏/timeline-engine.ts 生成并写回此字段,
// AI 仅读、不写。详见 [mvu_update]变量更新规则.yaml。
const TimelineDateSchema = z.object({
  年: z.coerce.number(),
  月: z.coerce.number(),
  日: z.coerce.number(),
});
const RumorEntrySchema = z.object({
  id: z.string(),
  时间区间: z.object({
    起: TimelineDateSchema,
    止: TimelineDateSchema,
  }),
  世界: z.string(),
  地域: z.string(),
  地点: z.string(),
  类别: z.string(),
  内容: z.string(),
  难度: z.string(),
});

// ===== 自定义开局元数据 =====
// 双下划线字段只供前端与世界书 EJS 读取，AI 不应看见或更新。
// 全部字段保持可选，以兼容普通开局和早期自定义开局存档。
const CustomStartMetadataSchema = z
  .object({
    difficulty: z.string().optional(),
    story: z.string().optional(),
    story_body: z.string().optional(),
    points_total: z.coerce.number().optional(),
    created_at: z.string().optional(),
    flags: z.array(z.string()).prefault([]),
  })
  .prefault({ flags: [] });

// ===== 主 Schema (扁平化:三大类一级目录拆掉) =====
export const CultivationStatusSchema = z.object({
  __custom_start__: CustomStartMetadataSchema,

  // —— 原 基本信息.* (现升至根级) ——
  姓名: z.string().prefault('User'),
  外貌: z.string().prefault(''),
  性格: z.string().prefault(''),
  着装: z.string().prefault(''),
  魅力: z.coerce
    .number()
    .transform(n => clamp(n, 0, 100))
    .prefault(80),
  寿元: LifespanSchema,
  种族: z.string().prefault('人族'),
  身份: z.array(z.string()).prefault([]),
  灵根: SpiritualRootSchema,
  体质: PhysiqueSchema,
  // 性器（外部脚本按五行随机填充，AI 只读不更新；仅 NSFW 基础指导开启时经专属条目发给 AI）。
  // key = 口腔/屄穴/肛门/乳房（或玩家自填）；value = 名器"描述"（不含名器名）。
  性器: z.record(z.string(), z.string()).prefault({}),
  修炼进度: CultivationProgressSchema,
  技艺: SkillSchema,
  资源池: ResourcePoolSchema,
  固定资产: FixedAssetsSchema,
  地点: LocationSchema,
  时间: TimeSchema,
  状态效果: z.record(z.string(), StatusEffectSchema).prefault({}),

  // —— 原 修炼功法.功法 ——
  功法: z.record(z.string(), CultivationArtSchema).prefault({}),

  // —— 原 储物空间.* ——
  ...StorageFields,

  // —— 关系列表 (NPC + 无主 傀儡/灵兽) ——
  关系列表: z.record(z.string(), RelationEntrySchema).prefault({}),

  // —— 传闻 (前端引擎写,AI 仅读) ——
  传闻: z.array(RumorEntrySchema).prefault([]),
});

export type CultivationStatusData = z.infer<typeof CultivationStatusSchema>;

// dump_schema.ts 通过 'Schema' 名称导出生成 schema.json
export { CultivationStatusSchema as Schema };
