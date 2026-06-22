import { Link, useLocation } from 'react-router-dom';
import { Home, Pill, CalendarClock, ShieldAlert, User } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

/*
  TEMPORARY Phase-0 shell so the app is navigable. Phase 1 replaces this with
  the themed, per-theme bottom-nav Layout (with the center "Log dose" action,
  theme-aware styling, and auth-aware header).
*/
const NAV = [
  { name: 'Home', label: 'Home', icon: Home, to: '/' },
  { name: 'Medications', label: 'Meds', icon: Pill, to: createPageUrl('Medications') },
  { name: 'Schedule', label: 'Schedule', icon: CalendarClock, to: createPageUrl('Schedule') },
  { name: 'Interactions', label: 'Interactions', icon: ShieldAlert, to: createPageUrl('Interactions') },
  { name: 'Profile', label: 'Me', icon: User, to: createPageUrl('Profile') }
];

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="pt-safe sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-screen-sm items-center gap-2 px-4">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-secondary to-primary" />
          <span className="font-heading text-lg font-extrabold tracking-tight">
            S.A.F.E <span className="text-primary">Meds</span>
          </span>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            Phase 0
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-5 pb-24">
        {children}
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-screen-sm items-center justify-around px-2 py-2">
          {NAV.map(({ name, label, icon: Icon, to }) => {
            const active = pathname === to;
            return (
              <Link
                key={name}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
