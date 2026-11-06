import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'panga_theme';
const EVENT_NAME = 'panga-theme-change';

export function getStoredTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'light';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'dark' || raw === 'light' || raw === 'system') {
        return raw;
    }
    return 'light';
}

export function resolveIsDark(mode: ThemeMode): boolean {
    if (typeof window === 'undefined') return false;
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function applyThemeToDom(mode: ThemeMode): boolean {
    const isDark = resolveIsDark(mode);
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.classList.toggle('dark', isDark);
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        root.style.colorScheme = isDark ? 'dark' : 'light';
    }
    return isDark;
}

export function setThemeMode(mode: ThemeMode): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, mode);
    applyThemeToDom(mode);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: mode }));
}

export function useTheme() {
    const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
    const [isDark, setIsDark] = useState<boolean>(() => resolveIsDark(getStoredTheme()));

    useEffect(() => {
        setIsDark(applyThemeToDom(theme));

        const handleCustomChange = (e: Event) => {
            const nextMode = (e as CustomEvent<ThemeMode>).detail || getStoredTheme();
            setThemeState(nextMode);
            setIsDark(applyThemeToDom(nextMode));
        };

        const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
        const handleMediaChange = () => {
            const current = getStoredTheme();
            if (current === 'system') {
                setIsDark(applyThemeToDom('system'));
            }
        };

        window.addEventListener(EVENT_NAME, handleCustomChange);
        mediaQuery?.addEventListener?.('change', handleMediaChange);

        return () => {
            window.removeEventListener(EVENT_NAME, handleCustomChange);
            mediaQuery?.removeEventListener?.('change', handleMediaChange);
        };
    }, [theme]);

    const updateTheme = (next: ThemeMode) => {
        setThemeMode(next);
        setThemeState(next);
        setIsDark(resolveIsDark(next));
    };

    return { theme, isDark, setTheme: updateTheme };
}
