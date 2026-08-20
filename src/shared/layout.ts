export type SharedLayout = 'pc' | 'mobile';

export const SHARED_LAYOUT_KEY = 'xy-status-layout';
export const SHARED_LAYOUT_EVENT = 'xy-status-layout-change';

function isSharedLayout(value: unknown): value is SharedLayout {
  return value === 'pc' || value === 'mobile';
}

function layoutEventTarget(): Window {
  try {
    return window.top || window;
  } catch {
    return window;
  }
}

export function readSharedLayout(fallback: SharedLayout = 'pc'): SharedLayout {
  try {
    const current = localStorage.getItem(SHARED_LAYOUT_KEY);
    if (isSharedLayout(current)) return current;
  } catch {
    /* localStorage 不可用时保留 PC 默认排版 */
  }
  return fallback;
}

export function publishSharedLayout(layout: SharedLayout): void {
  try {
    localStorage.setItem(SHARED_LAYOUT_KEY, layout);
  } catch {
    /* 自定义事件仍可同步当前酒馆页面里的状态栏 */
  }

  try {
    layoutEventTarget().dispatchEvent(new CustomEvent(SHARED_LAYOUT_EVENT, { detail: layout }));
  } catch {
    /* 跨源 top 不可达时仅更新当前状态栏 */
  }
}

export function subscribeSharedLayout(handler: (layout: SharedLayout) => void): () => void {
  const target = layoutEventTarget();
  const onLayoutChange = (event: Event) => {
    const layout = (event as CustomEvent).detail;
    if (isSharedLayout(layout)) handler(layout);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === SHARED_LAYOUT_KEY && isSharedLayout(event.newValue)) handler(event.newValue);
  };

  target.addEventListener(SHARED_LAYOUT_EVENT, onLayoutChange);
  window.addEventListener('storage', onStorage);
  return () => {
    target.removeEventListener(SHARED_LAYOUT_EVENT, onLayoutChange);
    window.removeEventListener('storage', onStorage);
  };
}
