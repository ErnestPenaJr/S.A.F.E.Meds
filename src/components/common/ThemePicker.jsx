import { Check } from 'lucide-react';
import { THEME_LIST } from '@/lib/themes';
import { useTheme } from '@/lib/ThemeContext';
import { cn } from '@/lib/utils';

/** Grid of theme cards. Tapping one applies it instantly (and persists it). */
export default function ThemePicker({ onPick }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-3">
      {THEME_LIST.map((t) => {
        const active = t.id === theme;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTheme(t.id);
              onPick?.(t.id);
            }}
            aria-pressed={active}
            className={cn(
              'relative flex flex-col gap-2 rounded-xl border-2 bg-card p-3 text-left transition-colors',
              active ? 'border-primary' : 'border-border hover:border-muted-foreground/40'
            )}
          >
            <div className="flex -space-x-1.5">
              {t.swatches.map((c, i) => (
                <span
                  key={i}
                  className="h-6 w-6 rounded-full border-2 border-card"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.tagline}</div>
            </div>
            {active && (
              <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
