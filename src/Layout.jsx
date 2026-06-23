import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Pill, CalendarClock, Plus, Palette, LayoutGrid,
  ShieldAlert, MapPin, Share2, IdCard, User, LogOut
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import BottomSheet from '@/components/common/BottomSheet';
import ThemePicker from '@/components/common/ThemePicker';
import NotificationManager from '@/components/notifications/NotificationManager';

// Mobile bottom-bar destinations (Home / Meds / + / Schedule / More).
const NAV = [
  { label: 'Home', icon: Home, to: '/' },
  { label: 'Meds', icon: Pill, to: createPageUrl('Medications') },
  { label: 'Schedule', icon: CalendarClock, to: createPageUrl('Schedule') }
];

// Full destination set — used by the desktop sidebar and the mobile "More" sheet.
const PRIMARY = [
  { label: 'Home', icon: Home, to: '/' },
  { label: 'My Medications', icon: Pill, to: createPageUrl('Medications') },
  { label: 'Schedule', icon: CalendarClock, to: createPageUrl('Schedule') },
  { label: 'Drug Interactions', icon: ShieldAlert, to: createPageUrl('Interactions') },
  { label: 'Find Pharmacy', icon: MapPin, to: createPageUrl('Pharmacy') },
  { label: 'Share Lists', icon: Share2, to: createPageUrl('Share') }
];
const SECONDARY = [
  { label: 'Emergency Card', icon: IdCard, to: createPageUrl('EmergencyCard') },
  { label: 'My Profile', icon: User, to: createPageUrl('Profile') }
];

const isActive = (to, pathname) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

function MobileNavItem({ label, icon: Icon, to, pathname }) {
  const active = isActive(to, pathname);
  return (
    <Link
      to={to}
      className={cn(
        'flex w-16 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-semibold transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
      {label}
    </Link>
  );
}

function SidebarLink({ label, icon: Icon, to, pathname }) {
  const active = isActive(to, pathname);
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
      {label}
    </Link>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [themeOpen, setThemeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const initial = (user?.fullName || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-dvh bg-background">
      <NotificationManager />

      {/* ── Desktop sidebar (lg+) ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex print:hidden">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary to-primary" />
          <span className="font-heading text-xl font-extrabold tracking-tight">
            S.A.F.E <span className="text-primary">Meds</span>
          </span>
        </div>

        <div className="px-3">
          <Link
            to={createPageUrl('AddMedication')}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-secondary to-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Add medication
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {PRIMARY.map((item) => <SidebarLink key={item.label} {...item} pathname={pathname} />)}
          <div className="my-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">My Health</div>
          {SECONDARY.map((item) => <SidebarLink key={item.label} {...item} pathname={pathname} />)}
        </nav>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={() => setThemeOpen(true)}
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Palette className="h-5 w-5" /> Theme
          </button>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold">{initial}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user?.fullName || 'Account'}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <button type="button" onClick={signOut} aria-label="Sign out" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile header (<lg) ── */}
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur lg:hidden print:hidden">
        <div className="mx-auto flex h-14 w-full max-w-screen-sm items-center gap-2 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-secondary to-primary" />
            <span className="font-heading text-lg font-extrabold tracking-tight">
              S.A.F.E <span className="text-primary">Meds</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setThemeOpen(true)} aria-label="Change theme" className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted">
              <Palette className="h-5 w-5" />
            </button>
            <Link to={createPageUrl('Profile')} aria-label="Profile" className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-bold text-foreground">
              {initial}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-screen-sm px-4 py-5 pb-28 lg:max-w-6xl lg:pb-10 lg:pl-72 lg:pr-8 lg:pt-8 print:pb-5 print:pl-4">
        {children}
      </main>

      {/* ── Mobile bottom nav (<lg) ── */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 backdrop-blur lg:hidden print:hidden">
        <div className="relative mx-auto flex max-w-screen-sm items-center justify-around px-2 py-2">
          {NAV.slice(0, 2).map((item) => <MobileNavItem key={item.label} {...item} pathname={pathname} />)}
          <Link
            to={createPageUrl('AddMedication')}
            aria-label="Log a dose"
            className="grid h-14 w-14 -translate-y-5 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-primary-foreground shadow-lg shadow-primary/30"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </Link>
          <MobileNavItem {...NAV[2]} pathname={pathname} />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex w-16 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-semibold text-muted-foreground"
          >
            <LayoutGrid className="h-5 w-5" strokeWidth={2} />
            More
          </button>
        </div>
      </nav>

      <BottomSheet open={themeOpen} onClose={() => setThemeOpen(false)} title="Choose your look">
        <ThemePicker onPick={() => {}} />
        <p className="mt-3 text-center text-xs text-muted-foreground">Saved to your profile — applies on every device.</p>
      </BottomSheet>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="flex flex-col">
          {[...PRIMARY.slice(3), ...SECONDARY].map(({ label, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-semibold hover:bg-muted"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground">
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
