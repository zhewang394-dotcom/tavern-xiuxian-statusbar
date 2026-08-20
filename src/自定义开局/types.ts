// =============== 通用选项 ===============
export interface Option {
  id: string;
  name: string;
  /** 简短副标题 */
  subtitle?: string;
  /** 详细描述（鼠标悬浮或选中后显示） */
  desc?: string;
  /** 占用点数；负数表示赠送点数 */
  cost: number;
  /** 选项标签，用于过滤/分组 */
  tags?: string[];
  /** 选项底部小图标/装饰字（如「水」「金丹」） */
  glyph?: string;
}

// =============== 难度 ===============
export interface DifficultyOption extends Option {
  /** 总可分配点数（开局预算） */
  points: number;
  /** 难度等级序号；越大越难 */
  level: number;
  /** 颜色基调，用于卡片高亮 */
  tone: 'jade' | 'gold' | 'cinnabar' | 'ink';
}

// =============== 灵根变异预设 ===============
export interface RootMutation {
  id: string;
  /** 显示名（如「剑灵根」「血灵根」） */
  name: string;
  /** 适用属性（金/木/水/火/土/阴/阳/混沌） */
  element: string;
  desc: string;
}

// =============== 灵根选择（多选 + 变异） ===============
export interface RootChoice {
  /** 已选属性集合（金/木/水/火/土/阴/阳/混沌/无） */
  elements: string[];
  /** 是否启用变异；仅 elements 长度为 1 时有效 */
  mutation: boolean;
  /** 选用的预设变异 id；null 表示采用自定义命名 */
  mutationId: string | null;
  /** 自定义变异名称（mutationId 为 null 时使用） */
  customName: string;
}

// =============== 体质 ===============
/** 体质等级：参考世界设定 凡 / 灵 / 道 / 仙(神)四阶 */
export type PhysiqueTier = '凡体' | '灵体' | '道体' | '仙体';

/** 预设体质的用途分类；仅用于自定义开局中的筛选与管理。 */
export type PhysiqueCategory = '无特效' | '战斗' | '生产' | '修炼' | '突破' | '领悟' | '综合' | '叙述' | 'NSFW';

export interface PhysiqueEffect {
  name: string;
  value: string;
}

export interface PhysiqueOption extends Option {
  /** 体质等级，决定 S 与点数消耗 */
  tier: PhysiqueTier;
  /** 用途分类，只参与界面筛选，不改变规则效果 */
  category: PhysiqueCategory;
  /** 清单中的单一五行分类，不代表体质效果必然与该五行挂钩 */
  五行: string;
  /** 三维基准（悟性/根骨/气感） */
  悟性: number;
  根骨: number;
  气感: number;
  /** 效果列表；无特效体质可缺省 */
  效果?: PhysiqueEffect[];
}

/** 体质选择（预设或玩家自拟） */
export interface PhysiqueChoice {
  /** 选定等级 */
  tier: PhysiqueTier;
  /** 选用的预设 id；null = 玩家自拟 */
  presetId: string | null;
  /** 自拟体质名称 */
  customName: string;
  /** 自拟体质效果列表（凡体可空；非凡体至少 1 条且首条名号非空） */
  customEffects: PhysiqueEffect[];
  /** 自拟三维分配（总和等于该等级 S） */
  custom悟性: number;
  custom根骨: number;
  custom气感: number;
}

// =============== 出生地 ===============
/** 生态卡上展示的凡国/宗门条目 */
export interface EcoEntity {
  /** 名称（如「沧澜王朝」「血莲密教」） */
  name: string;
  /** 一行简介 */
  brief: string;
  /** 标签（如「正道」「魔道」「商邦」） */
  tags?: string[];
}

/** 树形地点节点：内部节点（地域）或可选叶节点（生态） */
export interface LocationNode {
  id: string;
  name: string;
  /** 简短描述 */
  description?: string;
  /** 子节点；叶节点（生态）不写或为空 */
  children?: LocationNode[];
  /** 仅生态叶节点：所属凡人国度/势力 */
  kingdoms?: EcoEntity[];
  /** 仅生态叶节点：境内宗门/组织 */
  sects?: EcoEntity[];
  /** 标签（叶节点） */
  tags?: string[];
}

export interface LocationOption {
  id: string;
  name: string;
  desc?: string;
  世界: string;
  地域: string;
  /** 生态区块名（既用作 UI 展示，也写入 stat_data.地点.具体地点） */
  生态: string;
  /** 等同于 `生态`，保留以兼容旧持久化字段 */
  具体地点: string;
  kingdoms?: EcoEntity[];
  sects?: EcoEntity[];
  tags?: string[];
}

// =============== 物品（含功法/装备/傀儡/灵兽） ===============
export type ItemQuality = '凡' | '黄' | '玄' | '地' | '天';
/** 境界范围限定到化神；本游戏中"凡人"指非修仙者，故不作为物品境界 */
export type ItemRealm = '炼气' | '筑基' | '金丹' | '元婴' | '化神';
export type ItemCategory = '功法' | '物品' | '装备' | '灵石' | '傀儡' | '灵兽';
export type ItemKind =
  // 功法
  | '心法'
  | '攻击'
  | '咒法'
  | '身法'
  | '护体'
  | '阵法'
  // 装备
  | '法宝'
  | '护甲'
  | '饰品'
  | '工具'
  // 物品
  | '丹药'
  | '符箓'
  | '秘籍'
  | '素材'
  // 战斗实体
  | '傀儡'
  | '灵兽'
  // 资源
  | '灵石';

export interface ItemOption extends Option {
  /** 大类 */
  category: ItemCategory;
  /** 子类型，用于筛选 */
  类型: ItemKind;
  /** 品质（无品质则记 '凡'，灵石可省略） */
  品质?: ItemQuality;
  /** 适用境界（无境界则不填，灵石不填） */
  境界?: ItemRealm;
  /** 五行（可选） */
  五行?: string;
  /** 仅当 category=灵石 时使用：一份多少灵石 */
  灵石?: number;
  /** 卡片附加数据（按 MVU schema 给出） */
  data?: Record<string, any>;
}

/** 傀儡/灵兽 的单条技能 */
export interface CustomSkill {
  /** 技能名 */
  name: string;
  /** 攻击力（数值）；可空 */
  攻击力?: number;
  /** 消耗描述（如 "气血:30" / "灵气:50" / "无"） */
  消耗?: string;
  /** 效果 key-value */
  效果?: Record<string, string>;
}

/** 玩家自创资材：可携带多件，依品质 / 境界计费
 *
 * 所有 ?? 字段都是「玩家覆盖值」：
 * - 已填则 normalizer 用此值
 * - 未填则 normalizer 按公式自动算
 */
export interface CustomItem {
  /** 运行时 id，使用时间戳生成 */
  id: string;
  name: string;
  desc?: string;
  category: ItemCategory;
  类型: ItemKind;
  品质: ItemQuality;
  境界: ItemRealm;
  /** 五行属性必填 */
  五行: string;
  /** 自创效果（key=效果名 / value=效果描述，可空） */
  效果?: Record<string, string>;
  /** 数值类覆盖（攻击力/防御力/命中/闪避/穿透%/减免%/修行速度/遁速/灵气消耗/灵气容量/炼制难度 等） */
  数值?: {
    攻击力?: number;
    防御力?: number;
    命中?: number;
    闪避?: number;
    遁速?: number;
    修行速度?: number;
    /** 百分比整数 */
    穿透?: number;
    /** 百分比整数 */
    减免?: number;
    灵气消耗?: number;
    灵气容量?: number;
    炼制难度?: number;
  };
  /** 资源池覆盖（傀儡/灵兽） */
  资源池?: {
    气血?: number;
    灵气?: number;
    遁速?: number;
  };
  /** 通用顶层覆盖 */
  消耗?: string;
  位置?: string;
  数量?: number;
  /** 符箓：攻击型；false 时攻击力=0 */
  攻击型?: boolean;
  /** 工具：是否为核心生产工具（启用加成数值） */
  加成型?: boolean;
  /** 秘籍：完整度 */
  完整度?: string;
  /** 护体功法：触发条件 */
  护体触发?: string;
  /** 技能列表（仅傀儡/灵兽） */
  技能?: CustomSkill[];
}

// =============== 剧情物品（随剧本解锁的固定携带物） ===============
/**
 * 剧情物品：与某个开局剧本绑定，仅当选中该剧本时才出现在「初始资材」步骤中。
 * - 固定携带（锁定选中，无法取消）、固定 0 点。
 * - `data` 为完整的 MVU 面板数据（直接注入，不再走 itemNormalizer 公式），
 *   以便精确控制这类"剧情/独特"物品的面板，避免自动战斗数值污染。
 */
export interface PlotItem {
  id: string;
  /** 绑定的剧本 id：仅当 Selection.storyId === 此值时显示并携带 */
  storyId: string;
  name: string;
  /** 归入的储物大类（决定注入到 功法/物品/装备 哪个桶） */
  category: ItemCategory;
  /** 子类型：直接采用 MVU schema 的枚举（如 神识/秘籍/工具），故为自由字符串 */
  类型: string;
  品质?: ItemQuality;
  境界?: ItemRealm;
  五行?: string;
  /** 卡片描述 */
  desc?: string;
  /** 卡片装饰字 */
  glyph?: string;
  /** 卡片展示用标签 */
  tags?: string[];
  /** 完整 MVU 面板数据（直接注入 stat_data.<桶>[name]） */
  data: Record<string, any>;
}

// =============== 性别 / 元阳元阴 ===============
/** 仅供男/女选择元阳或元阴是否尚存；其他性别导出时两者均为 null */
export type Gender = '男' | '女' | '其他';

// =============== 开局故事 ===============
export type StoryKind = '宗门' | '散修' | '特殊';
export type SmallRealm = '初期' | '中期' | '后期';

/** 故事可选条件：未满足则禁选 */
export interface StoryConstraints {
  /** 必须为这些叶节点 id 之一（出生地） */
  locationIds?: string[];
  /** 必须落在这些大地域 id 之一 */
  regionIds?: string[];
  /** 必须为该性别 */
  性别?: Gender;
  /** 不可为这些性别（用于“非女性”等复合条件） */
  性别禁止?: Gender[];
  /** 元阳/元阴必须尚存 */
  元阳元阴必须?: boolean;
  /** 灵根至少含以下任一五行 */
  灵根五行任意?: string[];
  /** 灵根品阶子串匹配（如「单灵根」「双灵根」） */
  灵根品阶?: string[];
  /** 灵根不能含以下任一五行（如：'无'） */
  灵根禁止?: string[];
  /** 体质等级须为以下任一；不设则任意 */
  physiqueTier?: PhysiqueTier[];
  /** 门派归属须为以下任一（值同 Selection.门派归属：''=无 / '散修' / 宗门名）；不设则任意 */
  门派归属?: string[];
}

/** 故事开局设定：年份必须 ≥ 7000 */
export interface StorySettings {
  时间: { 年: number; 月: number; 日: number; 时辰?: string };
  /** 宗门名称；散修则填 '散修' */
  宗门: string;
  /** 初始境界 = 大境界 + 小境界 */
  初始境界: { 大境界: string; 小境界: SmallRealm };
}

export interface StoryOption extends Option {
  /** 故事正文（Markdown / 纯文本） */
  body: string;
  /** 推荐难度（仅作 UI 提示） */
  recommend?: string;
  /** 故事大类 */
  类型?: StoryKind;
  /** 是否为「剧情剧本」（特殊开局：绑定剧情物品、专属 UI、列表置顶） */
  剧情?: boolean;
  /** 注入 stat_data.__custom_start__.flags，供世界书 EJS 切换专属设定。 */
  flags?: string[];
  /** 选取条件 */
  constraints?: StoryConstraints;
  /** 开局设定（必填） */
  settings: StorySettings;
}

/** 玩家自创开局故事 */
export interface CustomStory {
  id: string;
  name: string;
  desc?: string;
  body: string;
  类型: StoryKind;
  settings: StorySettings;
}

// =============== 变量更新模式 ===============
/**
 * 变量更新方式（'额外API' | '随主API'）。类型与开关逻辑统一在 src/shared/apiMode.ts，
 * 此处仅重导出以便本模块与 Selection 使用。
 */
export type { ApiMode } from '../shared/apiMode';
import type { ApiMode } from '../shared/apiMode';

// =============== 玩家选择快照 ===============
export interface Selection {
  difficultyId: string | null;
  /** 自定义灵根：多选属性 + 可选变异 */
  root: RootChoice;
  /** 自定义体质：等级 + 预设或自拟 */
  physique: PhysiqueChoice;
  /** 性别 */
  性别: Gender;
  /** 元阳（男）/元阴（女）是否尚存（处子之身） */
  元阳元阴: boolean;
  locationId: string | null;
  /** 门派归属（决定生成时的「身份」标签）：''=无(不加身份) / '散修'(身份=散修) / 宗门名(身份=「XX弟子」) */
  门派归属: string;
  itemIds: string[];
  /** 玩家自创的资材（可多件） */
  customItems: CustomItem[];
  storyId: string | null;
  /** 玩家自创的开局剧本（仅一篇；为 null 表示未自创） */
  customStory: CustomStory | null;
  /** 道号（玩家自行输入） */
  道号: string;
  /** 变量更新方式（开关对应世界书/预设条目）；默认推荐「额外API」 */
  变量更新模式: ApiMode;
}

// =============== 持久化预设 ===============
export interface Preset {
  /** 持久化 id（时间戳生成） */
  id: string;
  /** 显示名 */
  name: string;
  /** 创建时间 ISO */
  createdAt: string;
  selection: Selection;
}
