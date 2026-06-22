import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/themes';

const ThemeContext = createContext(null);

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES[saved]) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  // Apply the theme to <html> and sync the browser chrome color.
  useEffect(() => {
    const meta = THEMES[theme] || THEMES[DEFAULT_THEME];
    const root = document.documentElement;
    root.setAttribute('data-theme', meta.id);
    root.style.colorScheme = meta.scheme;
    const tag = document.querySelector('meta[name="theme-color"]');
    if (tag) tag.setAttribute('content', meta.themeColor);
  }, [theme]);

  const setTheme = useCallback((id) => {
    if (!THEMES[id]) return;
    setThemeState(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    // Phase 2: also persist to profiles.theme via the data API when signed in,
    // and hydrate from the profile on login so the choice follows the user.
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeMeta: THEMES[theme] || THEMES[DEFAULT_THEME], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
