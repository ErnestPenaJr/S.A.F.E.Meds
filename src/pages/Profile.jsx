import { useState } from 'react';
import { LogOut, Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import ThemePicker from '@/components/common/ThemePicker';

function notificationState() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const initial = (user?.fullName || user?.email || '?').charAt(0).toUpperCase();
  const [perm, setPerm] = useState(notificationState);

  const enableReminders = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPerm(result);
    if (result === 'granted') {
      // eslint-disable-next-line no-new
      new Notification('Reminders on', { body: "We'll nudge you before each dose.", icon: '/favicon.svg' });
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <section className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary text-xl font-bold text-primary-foreground">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="font-heading text-lg font-bold leading-tight">{user?.fullName || 'Your account'}</div>
          <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">Appearance</h2>
        <ThemePicker />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">Reminders</h2>
        {perm === 'granted' ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm font-semibold text-success">
            <BellRing className="h-4 w-4" /> Dose reminders are on
          </div>
        ) : perm === 'unsupported' ? (
          <p className="text-sm text-muted-foreground">Browser notifications aren't available here.</p>
        ) : (
          <>
            <Button variant="outline" onClick={enableReminders} className="w-fit">
              <Bell className="h-4 w-4" /> Enable dose reminders
            </Button>
            {perm === 'denied' && (
              <p className="text-xs text-muted-foreground">
                Notifications are blocked — allow them in your browser settings to get reminders.
              </p>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">Account</h2>
        <p className="text-sm text-muted-foreground">
          Allergies, emergency contacts, and saved pharmacies arrive in later phases.
        </p>
        <Button variant="outline" onClick={signOut} className="w-fit">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </section>
    </div>
  );
}
