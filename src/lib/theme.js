export const THEME_KEY = "yourlove-theme";
export const THEME_CHANGE_EVENT = "yourlove-theme-change";

export function applyTheme(theme) {
  if (typeof document === "undefined") return;

  if (theme === "eternal") {
    document.documentElement.dataset.theme = "eternal";
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function getSavedTheme() {
  if (typeof window === "undefined") return "light";

  const savedTheme = localStorage.getItem(THEME_KEY);
  return savedTheme === "eternal" || savedTheme === "better" ? "eternal" : "light";
}

export function setSavedTheme(theme) {
  if (typeof window === "undefined") return;

  const nextTheme = theme === "eternal" || theme === "better" ? "eternal" : "light";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: nextTheme }));
}

export function resetTheme() {
  setSavedTheme("light");
}
