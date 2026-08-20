/**
 * 把玩家选择组装成 MVU 的 stat_data，并写入当前消息的酒馆变量。
 * 输出形状对齐 src/修仙状态栏/schema.ts。
 */
import {
  LOCATION_WORLD,
  customStoryToOption,
  findDifficulty,
  findItem,
  findLocation,
  findStory,
  physiqueResolved,
  plotItemsForStory,
  rootDescription,
  rootDisplayName,
  rootTierCanonical,
} from './config';
import { applyApiMode } from './apiMode';
import { normalizeItemForMvu } from './itemNormalizer';
import type { Selection, StoryOption } from './types';

function resolveStory(sel: Selection): StoryOption | undefined {
  const id = sel.storyId;
  if (!id) return undefined;
  const custom = sel.customStory;
  if (custom && custom.id === id) return customStoryToOption(custom);
  return findStory(id);
}

// 物品规范化逻辑已抽到 ./itemNormalizer.ts(UI 卡片与此处共用)

export function buildInitialStatData(sel: Selection): Record<string, any> {
  const physique = physiqueResolved(sel.physique);
  const location = findLocation(sel.locationId);
  const difficulty = findDifficulty(sel.difficultyId);
  const story = resolveStory(sel);
  const rootName = rootDisplayName(sel.root);
  const rootTier = rootTierCanonical(sel.root);
  const rootElements = sel.root.elements.length ? sel.root.elements.slice() : ['无'];
  const rootDesc = rootDescription(sel.root);

  // 资材归类（含玩家自创）
  const stones = sel.itemIds
    .map(id => findItem(id))
    .filter((x): x is NonNullable<ReturnType<typeof findItem>> => !!x && x.category === '灵石')
    .reduce((sum, x) => sum + (x.灵石 ?? 0), 0);
  const arts: Record<string, any> = {};
  const items: Record<string, any> = {};
  const equips: Record<string, any> = {};
  const puppets: Record<string, any> = {};
  const beasts: Record<string, any> = {};

  function bucket(name: string, category: string, data: Record<string, any>) {
    if (category === '功法') arts[name] = data;
    else if (category === '物品') items[name] = data;
    else if (category === '装备') equips[name] = data;
    else if (category === '傀儡') puppets[name] = data;
    else if (category === '灵兽') beasts[name] = data;
  }

  for (const id of sel.itemIds) {
    const it = findItem(id);
    if (!it || it.category === '灵石') continue;
    // 走规范化:数值按 [物品功法生成规则] 公式 floor(10^L × 系数 × (1+Q))
    bucket(it.name, it.category, normalizeItemForMvu(it));
  }
  // 自创资材:同样规范化(把玩家选择的 品质/境界/类型/五行 走公式)
  for (const c of sel.customItems) {
    const data: Record<string, any> = { 自创: true, 描述: c.desc || '', 标签: [] };
    if (c.效果 && Object.keys(c.效果).length) {
      data.效果 = { ...c.效果 };
    }
    // —— 数值覆盖：通过 _override 注入，让 normalizer 跳过自动公式 —— //
    const override: Record<string, any> = {};
    if (c.数值) {
      for (const [k, v] of Object.entries(c.数值)) {
        if (typeof v === 'number') override[k] = v;
      }
    }
    if (c.资源池) {
      const rp: Record<string, number> = {};
      if (typeof c.资源池.气血 === 'number') rp.气血 = c.资源池.气血;
      if (typeof c.资源池.灵气 === 'number') rp.灵气 = c.资源池.灵气;
      if (typeof c.资源池.遁速 === 'number') rp.遁速 = c.资源池.遁速;
      if (Object.keys(rp).length) override.资源池 = rp;
    }
    if (Object.keys(override).length) data._override = override;
    // —— 顶层覆盖字段 —— //
    if (typeof c.消耗 === 'string' && c.消耗.trim()) data.消耗 = c.消耗.trim();
    if (typeof c.位置 === 'string' && c.位置) data.位置 = c.位置;
    if (typeof c.数量 === 'number') data.数量 = c.数量;
    if (typeof c.攻击型 === 'boolean') data.攻击型 = c.攻击型;
    if (typeof c.加成型 === 'boolean') data.加成型 = c.加成型;
    if (typeof c.完整度 === 'string' && c.完整度) data.完整度 = c.完整度;
    if (typeof c.护体触发 === 'string' && c.护体触发) data.护体触发 = c.护体触发;
    // —— 傀儡/灵兽 技能字典 —— //
    if (Array.isArray(c.技能) && c.技能.length) {
      const skillMap: Record<string, any> = {};
      for (const sk of c.技能) {
        const skName = (sk.name || '').trim();
        if (!skName) continue;
        const entry: any = {};
        if (typeof sk.攻击力 === 'number') entry.攻击力 = sk.攻击力;
        if (typeof sk.消耗 === 'string' && sk.消耗.trim()) entry.消耗 = sk.消耗.trim();
        if (sk.效果) {
          const cleanEff: Record<string, string> = {};
          for (const [k, v] of Object.entries(sk.效果)) {
            if (!k.startsWith('__empty_')) cleanEff[k] = v;
          }
          if (Object.keys(cleanEff).length) entry.效果 = cleanEff;
        }
        skillMap[skName] = entry;
      }
      if (Object.keys(skillMap).length) data.技能 = skillMap;
    }
    const synthetic = {
      品质: c.品质,
      境界: c.境界,
      类型: c.类型,
      五行: c.五行,
      data,
    };
    bucket(c.name, c.category, normalizeItemForMvu(synthetic));
  }

  // 剧情物品：随所选剧本固定注入（data 已是最终 MVU 面板，不再走规范化公式）
  for (const p of plotItemsForStory(sel.storyId)) {
    bucket(p.name, p.category, JSON.parse(JSON.stringify(p.data)));
  }

  // 体质三维
  const 悟性 = physique.悟性;
  const 根骨 = physique.根骨;
  const 气感 = physique.气感;
  // physiqueResolved 现在返回 效果s: PhysiqueEffect[]，合并为 Record（同名后写覆盖前）
  const 体质效果: Record<string, string> = {};
  for (const e of physique.效果s) {
    if (e.name) 体质效果[e.name] = e.value;
  }

  // 故事设定（如果有）
  const storySettings = story?.settings;
  const 大境界 = storySettings?.初始境界.大境界 || '炼气';
  const 小境界 = storySettings?.初始境界.小境界 || '初期';
  const 起始时间 = storySettings?.时间 || { 年: 7000, 月: 1, 日: 1, 时辰: '辰时' };
  const 宗门 = storySettings?.宗门 || '散修';

  // —— 境界 → L 系数 (按 [核心系数总表]) —— //
  const REALM_L_BASE: Record<string, number> = {
    凡人: 0,
    炼气: 1.0,
    练气: 1.0,
    筑基: 2.0,
    金丹: 3.0,
    元婴: 4.0,
    化神: 5.0,
    返虚: 6.0,
    炼虚: 6.0,
    合体: 7.0,
    大乘: 8.0,
    渡劫: 9.0,
    飞升: 9.0,
  };
  const SUB_L_OFFSET: Record<string, number> = { 初期: 0, 中期: 0.2, 后期: 0.4 };
  const baseL = REALM_L_BASE[大境界] ?? 1.0;
  const L = baseL === 0 ? 0 : baseL + (SUB_L_OFFSET[小境界] ?? 0);

  // —— 资源公式(均按 [突破规则] 第三阶段·重新计算资源) —— //
  // 严格采用 [突破规则]/[角色生成规则] 的资源公式，避免 MVU 核验后数值跳变。
  const tenPowL = Math.pow(10, L);
  const baseHp = Math.max(1, Math.floor(tenPowL * (1 + 根骨 * 0.1)));
  const baseMp = Math.max(1, Math.floor(tenPowL * (1 + 气感 * 0.1)));
  // 遁速公式以 根骨 为准(与 [角色生成规则] / [突破规则] 一致)
  const baseDun = Math.max(L === 0 ? 2 : 1, Math.floor(tenPowL * (1 + 根骨 * 0.02)));

  // —— 修为进度上限 [Y] = 10^L × 100 (按 [修为获取规则] 参数声明) —— //
  const 进度上限 = Math.floor(tenPowL * 100);

  // —— 寿元.寿命:凡人 80 + 累积突破奖励 15×L^3 (跨大境界,小境界忽略) —— //
  const realmIndex: Record<string, number> = {
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
  const realmIdx = realmIndex[大境界] ?? 0;
  let 寿命 = 80; // 凡人基础寿命
  for (let i = 1; i <= realmIdx; i++) 寿命 += 15 * Math.pow(i, 3);

  // 起始年龄默认 16(青年),凡人保留默认上限;外观年龄=年龄(初始时尚未停止衰老)
  const 起始年龄 = 16;

  // 性别 / 元阳元阴：按角色生成规则保留对应键（已并入 体质，见下方 体质 对象）
  // 其他性别：元阳与元阴均为 null，表示对应性征不存在/不适用。
  const 元阴元阳: Record<string, boolean | null> = {};
  if (sel.性别 === '男') 元阴元阳.元阳 = sel.元阳元阴;
  else if (sel.性别 === '女') 元阴元阳.元阴 = sel.元阳元阴;
  else {
    元阴元阳.元阳 = null;
    元阴元阳.元阴 = null;
  }

  // —— 具体地点：按新格式「生态-[宗门|秘境|城市]-具体位置」组装（地域为独立字段，不入此串）——
  // 首段取所选生态；若开局即身处该生态的某真实宗门（剧本宗门去掉「（外门杂役）」之类后缀后能对上），
  // 则追加为中段「生态-宗门」；散修 / 泛称起点（如「入山待考之外门」）仅保留生态。
  const 生态名 = location?.生态 || location?.具体地点 || '';
  const 宗门清 = 宗门.replace(/[（(].*$/, '').trim();
  const 是本生态宗门 = !!宗门清 && 宗门清 !== '散修' && !!location?.sects?.some(s => s.name === 宗门清);
  const 具体地点 = 生态名 ? (是本生态宗门 ? `${生态名}-${宗门清}` : 生态名) : '某处村落';

  // —— 身份：由门派归属决定（''=无身份 / '散修'=散修 / 宗门名=「XX弟子」）——
  const 身份: string[] = [];
  const mp = (sel.门派归属 || '').trim();
  if (mp === '散修') 身份.push('散修');
  else if (mp) 身份.push(`${mp}弟子`);

  // —— 主角形象初始化（默认优雅占位，由 AI 结合开局设定在首轮提炼润色） ——
  const initialAppearance = '绝色容姿，冰肌玉骨（待AI结合开局提炼）';
  const initialPersonality = '清雅温婉，道心坚定（待AI结合开局提炼）';

  return {
    // —— 原 基本信息.* (扁平化:升至根级) ——
    姓名: sel.道号 || '无名',
    性格: initialPersonality,
    外貌: initialAppearance,
    着装: '素雅道袍，轻纱若云（待AI结合开局提炼）',
    气质: '仙姿佚貌，清雅绝伦（待AI结合开局提炼）',
    魅力: 85,
    性器: {
      阴唇: sel.性别 === '女' ? '紧致粉嫩，初绽幽香，未经人事（待AI结合开局提炼）' : undefined,
      乳房: sel.性别 === '女' ? '饱满挺拔，隐于素色法袍之下（待AI结合开局提炼）' : undefined,
      玉穴: sel.性别 === '女' ? '幽径紧窄，灵泉微润，未曾接纳凡物（待AI结合开局提炼）' : undefined,
      落红: sel.性别 === '女' ? (sel.元阳元阴 ? '元阴未泄，冰清玉洁，守宫砂皎然' : '已破瓜落红') : undefined,
    },
    种族: '人族',
    身份,
    性别: sel.性别,
    宗门,
    寿元: { 生日: Number(起始时间.年) - 起始年龄, 年龄: 起始年龄, 寿命, 外观年龄: 起始年龄 },
    灵根: {
      名称: rootName,
      五行: rootElements,
      品阶: rootTier,
      变异: sel.root.mutation,
      描述: rootDesc,
    },
    体质: {
      名称: physique.name,
      品阶: physique.tier,
      悟性,
      根骨,
      气感,
      效果: 体质效果,
      描述: physique.desc,
      ...元阴元阳, // 元阴/元阳 并入 体质
    },
    修炼进度: {
      境界: `${大境界}${小境界}`,
      当前进度: 0,
      进度上限,
      天谴: 0,
      丹毒: 0,
    },
    技艺: {
      生产类: { 炼器: 0, 驯兽: 0, 培育: 0, 医术: 0, 炼丹: 0, 制符: 0 },
      战斗类: { 御物: 0, 咒法: 0, 幻术: 0, 阵法: 0, 神识: 0, 炼体: 0 },
    },
    资源池: {
      气血: { 现值: baseHp, 上限: baseHp },
      灵气: { 现值: baseMp, 上限: baseMp },
      遁速: baseDun,
    },
    地点: {
      世界: location?.世界 || LOCATION_WORLD,
      地域: location?.地域 || '中原',
      具体地点,
    },
    时间: {
      年: 起始时间.年,
      月: 起始时间.月,
      日: 起始时间.日,
      时辰: 起始时间.时辰 || '辰时',
    },
    状态效果: {},
    事件: {
      开启: false,
      标题: '',
      阶段: '',
      已完成事件: [],
    },
    // —— 原 修炼功法.功法 ——
    功法: arts,
    // —— 原 储物空间.* ——
    灵石: stones,
    物品: items,
    装备: equips,
    傀儡: puppets,
    灵兽: beasts,
    // —— 不变 ——
    关系列表: {},
    // 传闻已彻底移出 MVU 变量，由 src/修仙状态栏/timeline-engine.ts 在前端动态生成并缓存到
    // localStorage，AI 不再持有也不应更新。详见 [mvu_update]变量更新规则.yaml 中的说明。
    // 附加信息：自定义开局元数据
    __custom_start__: {
      difficulty: difficulty?.id,
      story: story?.id,
      story_body: story?.body,
      points_total: difficulty?.points ?? 0,
      created_at: new Date().toISOString(),
      // 供世界书 EJS 做开局专属分支；与剧本 id 分开，便于一个开局挂载多个语义标记。
      flags: story?.flags ? [...story.flags] : [],
    },
  };
}

/**
 * 将组装好的 stat_data 写入当前消息的酒馆变量。
 * 失败时记录到 console，并返回 false。
 */
export async function writeInitialStatData(data: Record<string, any>): Promise<boolean> {
  try {
    const message_id = typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : -1;
    await insertOrAssignVariables({ stat_data: data }, { type: 'message', message_id });
    return true;
  } catch (err) {
    console.error('[自定义开局] 写入酒馆变量失败：', err);
    return false;
  }
}

// ============ AI 提示词生成 ============
/**
 * 把玩家选择渲染为发送给 AI 的纯文本提示词。
 * 参考 src/custom_start/core/utils/data-exporter.ts 的 generateAIPrompt 风格。
 */
export function generateAIPrompt(sel: Selection): string {
  const physique = physiqueResolved(sel.physique);
  const story = resolveStory(sel);
  const location = findLocation(sel.locationId);
  const difficulty = findDifficulty(sel.difficultyId);
  const rootName = rootDisplayName(sel.root);
  const rootTier = rootTierCanonical(sel.root);
  const rootElements = sel.root.elements.length ? sel.root.elements.slice() : ['无'];
  const rootDesc = rootDescription(sel.root);

  const lines: string[] = [];

  // —— 角色信息 ——
  lines.push('【角色信息】');
  lines.push(`道号：${sel.道号 || '无名'}`);
  const mp = (sel.门派归属 || '').trim();
  const 身份文本 = mp === '散修' ? '散修' : mp ? `${mp}弟子` : '（无）';
  lines.push(`身份：${身份文本}`);
  lines.push(`性别：${sel.性别}`);
  if (sel.性别 === '男') lines.push(`元阳：${sel.元阳元阴 ? '尚存' : '已损'}`);
  else if (sel.性别 === '女') lines.push(`元阴：${sel.元阳元阴 ? '尚存' : '已损'}`);
  else lines.push('元阳/元阴：无（其他性别）');

  lines.push('');
  lines.push('【灵根】');
  lines.push(`名号：${rootName}`);
  lines.push(`品阶：${rootTier}`);
  lines.push(`五行：${rootElements.join(' / ')}`);
  if (sel.root.mutation) lines.push('变异：是');
  if (rootDesc) lines.push(`描述：${rootDesc}`);

  lines.push('');
  lines.push('【体质】');
  lines.push(`名号：${physique.name}`);
  lines.push(`等级：${physique.tier}`);
  lines.push(`三维：悟性 ${physique.悟性} / 根骨 ${physique.根骨} / 气感 ${physique.气感}`);
  for (const e of physique.效果s) {
    if (e.name) lines.push(`效果：${e.name} ${e.value}`);
  }
  if (physique.desc) lines.push(`描述：${physique.desc}`);

  // —— 出生地 ——
  if (location) {
    lines.push('');
    lines.push('【出生地】');
    lines.push(`${location.世界} · ${location.地域} · ${location.生态}`);
    if (location.desc) lines.push(`说明：${location.desc}`);
    if (location.kingdoms?.length) {
      lines.push(`凡国：${location.kingdoms.map(k => `${k.name}（${k.brief}）`).join('；')}`);
    }
    if (location.sects?.length) {
      lines.push(`宗门：${location.sects.map(s => `${s.name}（${s.brief}）`).join('；')}`);
    }
  }

  // —— 开局设定（来自剧本 settings） ——
  if (story?.settings) {
    const s = story.settings;
    lines.push('');
    lines.push('【开局设定】');
    lines.push(`时间：${s.时间.年}年 ${s.时间.月}月 ${s.时间.日}日${s.时间.时辰 ? ' · ' + s.时间.时辰 : ''}`);
    lines.push(`宗门：${s.宗门}`);
    lines.push(`初始境界：${s.初始境界.大境界}${s.初始境界.小境界}`);
  }

  // —— 难度 ——
  if (difficulty) {
    lines.push('');
    lines.push('【难度】');
    lines.push(`${difficulty.name}（${difficulty.subtitle}）· 共 ${difficulty.points} 点`);
  }

  // —— 携带资材 ——
  const presetCarry = sel.itemIds.map(id => findItem(id)).filter(Boolean) as NonNullable<ReturnType<typeof findItem>>[];
  if (presetCarry.length) {
    lines.push('');
    lines.push('【携带资材 · 预设】');
    presetCarry.forEach(it => {
      const tags: string[] = [];
      if (it.品质) tags.push(`${it.品质}品`);
      if (it.境界) tags.push(it.境界);
      tags.push(it.类型);
      if (it.五行) tags.push(it.五行);
      lines.push(`- ${it.name}（${tags.join(' · ')}）${it.灵石 ? ` · ${it.灵石}枚灵石` : ''}`);
      if (it.desc) lines.push(`    ${it.desc}`);
    });
  }
  if (sel.customItems.length) {
    lines.push('');
    lines.push('【携带资材 · 自创】');
    sel.customItems.forEach(c => {
      const tags = [`${c.品质}品`, c.境界, c.类型, c.五行];
      lines.push(`- ${c.name}（${tags.join(' · ')}）`);
      if (c.效果) {
        for (const [k, v] of Object.entries(c.效果)) {
          lines.push(`    ${k}：${v}`);
        }
      }
      if (c.desc) lines.push(`    ${c.desc}`);
    });
  }

  // —— 剧情物品（随剧本固定携带） ——
  const plotItems = plotItemsForStory(sel.storyId);
  if (plotItems.length) {
    lines.push('');
    lines.push('【剧情物品 · 固定携带】');
    plotItems.forEach(p => {
      const tags: string[] = [];
      if (p.品质) tags.push(`${p.品质}品`);
      if (p.境界) tags.push(p.境界);
      tags.push(p.类型);
      if (p.五行) tags.push(p.五行);
      lines.push(`- ${p.name}（${tags.join(' · ')}）`);
      const eff = p.data?.效果;
      if (eff && typeof eff === 'object') {
        for (const [k, v] of Object.entries(eff)) lines.push(`    ${k}：${v}`);
      }
      if (p.desc) lines.push(`    ${p.desc}`);
    });
  }

  // —— 开局剧本 ——
  if (story) {
    lines.push('');
    lines.push(`【开局剧本】${story.name}${story.类型 ? `（${story.类型}）` : ''}`);
    if (story.subtitle) lines.push(story.subtitle);
    if (story.desc) lines.push(story.desc);
    if (story.body) {
      lines.push('');
      lines.push('—— 正文 ——');
      lines.push(story.body);
    }
  }

  const content = lines.join('\n');
  const instructions = [
    '---',
    '请你严格按照以上设定为玩家展开开局剧情。注意事项：',
    '- 故事正文中的「你」直接指代玩家角色（道号见上）；',
    `- 故事时间须从「${story?.settings.时间.年 ?? 7000}年」开始推进；`,
    `- 玩家所属：${story?.settings.宗门 ?? '散修'}；`,
    `- 初始境界：${story?.settings.初始境界.大境界 ?? '炼气'}${story?.settings.初始境界.小境界 ?? '初期'}；`,
    '- 请生成一段贴合上述设定的开局叙述，篇幅自然即可，不必再罗列上述信息。',
  ].join('\n');

  return '```text\n' + content + '\n```\n\n' + instructions;
}

/**
 * 提交开局：写入 MVU 变量、生成 AI 提示词、发送给酒馆并触发回复。
 * 参考 src/custom_start/core/composables/use-journey.ts 的 executeJourney。
 */
export async function commitJourney(sel: Selection): Promise<{ ok: boolean; reason?: string }> {
  // 0) 按玩家选择的变量更新模式，确保世界书/预设条目为最终状态（幂等）
  await applyApiMode(sel.变量更新模式);

  // 1) 写 MVU 变量
  const data = buildInitialStatData(sel);
  const mvuOk = await writeInitialStatData(data);
  if (!mvuOk) return { ok: false, reason: '写入 MVU 变量失败' };

  // 2) 生成 AI 提示词并发送
  const prompt = generateAIPrompt(sel);
  try {
    if (typeof createChatMessages !== 'function') {
      return { ok: false, reason: '当前环境不支持 createChatMessages' };
    }
    await createChatMessages([{ role: 'user', message: prompt }]);
  } catch (err) {
    console.error('[自定义开局] 发送消息失败：', err);
    return { ok: false, reason: '发送消息失败' };
  }

  // 3) 触发 AI 回复
  try {
    if (typeof triggerSlash === 'function') {
      await triggerSlash('/trigger');
    }
  } catch (err) {
    console.error('[自定义开局] 触发 /trigger 失败：', err);
    // 触发失败不视作整体失败：玩家可手动让 AI 续写
    return { ok: true, reason: '已发送，但触发 AI 回复失败' };
  }

  return { ok: true };
}
