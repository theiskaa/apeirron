export type ThemeId = "light" | "dark" | "system";

export interface ThemeDef {
  id: ThemeId;
  label: string;
}

export const THEMES: ThemeDef[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export const DEFAULT_THEME: ThemeId = "light";
export const THEME_STORAGE_KEY = "theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEMES.some((t) => t.id === value);
}

export function resolveTheme(id: ThemeId): "light" | "dark" {
  if (id !== "system") return id;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.classList.toggle("dark", resolveTheme(id) === "dark");
}

// Re-applies the system theme whenever the OS preference flips. Returns the
// unsubscribe function.
export function watchSystemTheme(onChange: () => void): () => void {
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function getStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
