// 桥接酒馆宿主环境魔改后的全局 z 实例（包含 .prefault 等扩展方法）
const globalZod = typeof window !== 'undefined' && (window as any).z ? (window as any).z : (globalThis as any).z;

export const z = globalZod?.z || globalZod;
export default z;
