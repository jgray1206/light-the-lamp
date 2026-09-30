import { createStore } from "./store";

const THEME_KEY = "theme";

const preferredTheme = () =>
    localStorage.getItem(THEME_KEY) ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

const themeStore = createStore({ theme: preferredTheme() });

const apply = (theme) => document.documentElement.setAttribute("data-bs-theme", theme);
apply(themeStore.get().theme);

export function useTheme() {
    const { theme } = themeStore.useStore();
    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        apply(next);
        themeStore.set({ theme: next });
    };
    return { theme, toggleTheme };
}
