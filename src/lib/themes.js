/**
 * Theme registry. Each theme is a selectable look the user owns.
 *
 * - Color/type/radius live in CSS variables (src/index.css): :root is the
 *   default (Vital); each other theme overrides those vars under
 *   [data-theme="<id>"]. Components read the vars via Tailwind tokens.
 * - `hero` names the dashboard's signature layout variant (consumed by the
 *   Home page in Phase 2): banner | ring | bento | big-action.
 * - `swatches` / `name` / `tagline` drive the theme picker preview.
 */
export const THEMES = {
  vital: {
    id: 'vital',
    name: 'Vital',
    tagline: 'Calm clinical',
    hero: 'banner',
    scheme: 'light',
    themeColor: '#0fb5a0',
    swatches: ['#0fb5a0', '#2563eb', '#7c3aed', '#ffffff']
  },
  'after-dark': {
    id: 'after-dark',
    name: 'After Dark',
    tagline: 'Dark & glanceable',
    hero: 'ring',
    scheme: 'dark',
    themeColor: '#0b1220',
    swatches: ['#0b1220', '#34d399', '#38bdf8', '#a78bfa']
  },
  bento: {
    id: 'bento',
    name: 'Bento',
    tagline: 'Bold & color-coded',
    hero: 'bento',
    scheme: 'light',
    themeColor: '#6d28d9',
    swatches: ['#6d28d9', '#db2777', '#0ea5e9', '#16a34a']
  },
  clear: {
    id: 'clear',
    name: 'Clear',
    tagline: 'Accessible & warm',
    hero: 'big-action',
    scheme: 'light',
    themeColor: '#15803d',
    swatches: ['#15803d', '#b45309', '#7c3aed', '#f7f2e9']
  }
};

export const THEME_LIST = Object.values(THEMES);
export const THEME_IDS = Object.keys(THEMES);
export const DEFAULT_THEME = 'vital';
export const THEME_STORAGE_KEY = 'safemeds_theme';
