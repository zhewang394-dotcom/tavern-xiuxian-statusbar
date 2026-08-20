/**
 * 变量更新模式的开关逻辑已抽到 src/shared/apiMode.ts（与「修仙状态栏」设置菜单共用）。
 * 本文件保留为兼容入口，转发导出，以免改动既有 import 路径。
 */
export type { ApiMode, ApplyApiModeResult } from '../shared/apiMode';
export { applyApiMode, getApiMode } from '../shared/apiMode';
