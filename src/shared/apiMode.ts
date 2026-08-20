/**
 * 变量更新模式（随主AI / 额外API）的统一开关逻辑。
 * 由「自定义开局」配置页与「修仙状态栏」设置菜单共用——两处都靠这一份表，
 * 世界书 / 预设条目名一旦变动只需改这里。
 *
 * 注意：截图里 MVU 扩展的「变量更新方式」下拉框 + API 地址/密钥属于 MVU 扩展自身
 * 设置，脚本无法代改；本模块只负责卡片能控制的那一半——世界书条目 + 预设提示词。
 */

export type ApiMode = '额外API' | '随主API';

/**
 * 世界书条目 → 各模式下是否启用（键须与 本格修仙.yaml「名称」完全一致）。
 * 两条常开条目（[mvu_update]变量更新规则 / [mvu_update]变量格式强调）与模式无关，不在表内。
 */
const WORLDBOOK_ENABLED: Record<string, Record<ApiMode, boolean>> = {
  '变量输出列表（随主AI输出开）': { 随主API: true, 额外API: false },
  '[mvu_plot]变量输出列表（额外API开）': { 随主API: false, 额外API: true },
  '[mvu_update]变量输出列表（额外API开）': { 随主API: false, 额外API: true },
  '[mvu_update]变量输出格式（随主AI输出开）': { 随主API: true, 额外API: false },
  '[mvu_update]变量输出格式（额外API开）': { 随主API: false, 额外API: true },
};

/** 预设提示词 → 各模式下是否启用（键为提示词「名称」；玩家预设缺失则静默跳过）。 */
const PRESET_ENABLED: Record<string, Record<ApiMode, boolean>> = {
  '🧭变量额外API(二选一)': { 随主API: false, 额外API: true },
  '🧭变量主API(二选一)': { 随主API: true, 额外API: false },
};

/** 探针：用来判定「当前是哪种模式」的代表条目（额外API开时启用 → 额外API）。 */
const WORLDBOOK_PROBE = '[mvu_update]变量输出格式（额外API开）';
const PRESET_PROBE = '🧭变量额外API(二选一)';

export interface ApplyApiModeResult {
  ok: boolean;
  /** 实际改动/确认的世界书条目数 */
  worldbookChanged: number;
  /** 实际改动/确认的预设提示词数 */
  presetChanged: number;
  /** 出错说明（ok=false 时） */
  reason?: string;
}

function charWorldbookNames(): string[] {
  if (typeof getCharWorldbookNames !== 'function') return [];
  const bound = getCharWorldbookNames('current');
  return [bound.primary, ...bound.additional].filter(
    (n): n is string => typeof n === 'string' && n.length > 0,
  );
}

/** 把当前角色卡绑定的世界书按模式表切换启用状态 */
async function applyWorldbook(mode: ApiMode): Promise<number> {
  if (typeof getWorldbook !== 'function' || typeof updateWorldbookWith !== 'function') {
    return 0;
  }
  let changed = 0;
  for (const wbName of charWorldbookNames()) {
    let entries;
    try {
      entries = await getWorldbook(wbName);
    } catch {
      continue; // 世界书不存在等，跳过
    }
    // 仅在该世界书确有目标条目时才写回，避免无谓触碰无关世界书
    const hits = entries.filter(e => WORLDBOOK_ENABLED[e.name] !== undefined);
    if (hits.length === 0) continue;
    const needWrite = hits.some(e => e.enabled !== WORLDBOOK_ENABLED[e.name][mode]);
    if (!needWrite) {
      changed += hits.length; // 已是目标状态，仍计入「已就绪」数
      continue;
    }
    await updateWorldbookWith(wbName, wb =>
      wb.map(e =>
        WORLDBOOK_ENABLED[e.name] !== undefined
          ? { ...e, enabled: WORLDBOOK_ENABLED[e.name][mode] }
          : e,
      ),
    );
    changed += hits.length;
  }
  return changed;
}

/** 把酒馆正在使用的预设（'in_use'）按模式表切换提示词启用状态 */
async function applyPreset(mode: ApiMode): Promise<number> {
  if (typeof getPreset !== 'function' || typeof updatePresetWith !== 'function') {
    return 0;
  }
  let preset;
  try {
    preset = getPreset('in_use');
  } catch {
    return 0;
  }
  const hits = (preset.prompts ?? []).filter(p => PRESET_ENABLED[p.name] !== undefined);
  if (hits.length === 0) return 0;
  await updatePresetWith('in_use', p => {
    p.prompts.forEach(prompt => {
      const table = PRESET_ENABLED[prompt.name];
      if (table !== undefined) prompt.enabled = table[mode];
    });
    return p;
  });
  return hits.length;
}

/**
 * 应用变量更新模式：同时开关世界书条目与预设提示词。
 * 幂等——可安全重复调用。
 */
export async function applyApiMode(mode: ApiMode): Promise<ApplyApiModeResult> {
  try {
    const worldbookChanged = await applyWorldbook(mode);
    const presetChanged = await applyPreset(mode);
    return { ok: true, worldbookChanged, presetChanged };
  } catch (err) {
    console.error('[apiMode] 应用变量更新模式失败：', err);
    return {
      ok: false,
      worldbookChanged: 0,
      presetChanged: 0,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 读取当前生效的变量更新模式：优先看世界书探针条目，其次看预设，都读不到则默认「额外API」。
 */
export async function getApiMode(): Promise<ApiMode> {
  if (typeof getWorldbook === 'function') {
    for (const wbName of charWorldbookNames()) {
      let entries;
      try {
        entries = await getWorldbook(wbName);
      } catch {
        continue;
      }
      const probe = entries.find(e => e.name === WORLDBOOK_PROBE);
      if (probe) return probe.enabled ? '额外API' : '随主API';
    }
  }
  if (typeof getPreset === 'function') {
    try {
      const preset = getPreset('in_use');
      const p = (preset.prompts ?? []).find(x => x.name === PRESET_PROBE);
      if (p) return p.enabled ? '额外API' : '随主API';
    } catch {
      /* ignore */
    }
  }
  return '额外API';
}
