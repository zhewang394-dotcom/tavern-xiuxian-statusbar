export type SharedTheme = 'light' | 'dark';

export const SHARED_THEME_KEY = 'rb-theme';
export const SHARED_THEME_EVENT = 'rb-theme-change';

const LEGACY_THEME_KEYS = ['xy-theme', 'xs-theme'] as const;

function isSharedTheme(value: unknown): value is SharedTheme {
  return value === 'light' || value === 'dark';
}

function themeEventTarget(): Window {
  try {
    return window.top || window;
  } catch {
    return window;
  }
}

export function readSharedTheme(fallback: SharedTheme = 'light'): SharedTheme {
  try {
    const current = localStorage.getItem(SHARED_THEME_KEY);
    if (isSharedTheme(current)) return current;

    for (const key of LEGACY_THEME_KEYS) {
      const legacy = localStorage.getItem(key);
      if (!isSharedTheme(legacy)) continue;
      localStorage.setItem(SHARED_THEME_KEY, legacy);
      return legacy;
    }
  } catch {
    /* localStorage 不可用时使用调用方默认值 */
  }
  return fallback;
}

export function publishSharedTheme(theme: SharedTheme): void {
  try {
    localStorage.setItem(SHARED_THEME_KEY, theme);
    for (const key of LEGACY_THEME_KEYS) localStorage.removeItem(key);
  } catch {
    /* 自定义事件仍可完成同页 iframe 间的即时同步 */
  }

  try {
    themeEventTarget().dispatchEvent(new CustomEvent(SHARED_THEME_EVENT, { detail: theme }));
  } catch {
    /* 跨源 top 不可达时由 storage 事件兜底 */
  }
}

export function subscribeSharedTheme(handler: (theme: SharedTheme) => void): () => void {
  const target = themeEventTarget();
  const onThemeChange = (event: Event) => {
    const theme = (event as CustomEvent).detail;
    if (isSharedTheme(theme)) handler(theme);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === SHARED_THEME_KEY && isSharedTheme(event.newValue)) handler(event.newValue);
  };

  target.addEventListener(SHARED_THEME_EVENT, onThemeChange);
  window.addEventListener('storage', onStorage);
  return () => {
    target.removeEventListener(SHARED_THEME_EVENT, onThemeChange);
    window.removeEventListener('storage', onStorage);
  };
}
