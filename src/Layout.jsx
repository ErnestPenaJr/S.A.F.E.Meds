import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Pill, CalendarClock, Plus, Palette, LayoutGrid,
  ShieldAlert, MapPin, Share2, IdCard, User
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import BottomSheet from '@/components/common/BottomSheet';
import ThemePicker from '@/components/common/ThemePicker';
import NotificationManager from '@/components/notifications/NotificationManager';

const NAV = [
  { label: 'Home', icon: Home, to: '/' },
  { label: 'Meds', icon: Pill, to: createPageUrl('Medications') },
  { label: 'Schedule', icon: CalendarClock, to: createPageUrl('Schedule') }
];

const MORE_LINKS = [
  { label: 'Drug Interactions', icon: ShieldAlert, to: createPageUrl('Interactions') },
  { label: 'Find Pharmacy', icon: MapPin, to: createPageUrl('Pharmacy') },
  { label: 'Share Lists', icon: Share2, to: createPageUrl('Share') },
  { label: 'Emergency Card', icon: IdCard, to: createPageUrl('EmergencyCard') },
  { label: 'My Profile', icon: User, to: createPageUrl('Profile') }
];

function NavItem({ label, icon: Icon, to, pathname }) {
  const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
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

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [themeOpen, setThemeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const initial = (user?.fullName || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <NotificationManager />

      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur print:hidden">
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

      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-5 pb-28 print:pb-5">{children}</main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 backdrop-blur print:hidden">
        <div className="relative mx-auto flex max-w-screen-sm items-center justify-around px-2 py-2">
          {NAV.slice(0, 2).map((item) => <NavItem key={item.label} {...item} pathname={pathname} />)}
          <Link
            to={createPageUrl('AddMedication')}
            aria-label="Log a dose"
            className="grid h-14 w-14 -translate-y-5 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-primary-foreground shadow-lg shadow-primary/30"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </Link>
          <NavItem {...NAV[2]} pathname={pathname} />
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
          {MORE_LINKS.map(({ label, icon: Icon, to }) => (
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
