import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import ThemePicker from '@/components/common/ThemePicker';

export default function Profile() {
  const { user, signOut } = useAuth();
  const initial = (user?.fullName || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-7">
      <section className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary text-xl font-bold text-primary-foreground">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="font-heading text-lg font-bold leading-tight">
            {user?.fullName || 'Your account'}
          </div>
          <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Appearance
        </h2>
        <ThemePicker />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Account
        </h2>
        <p className="text-sm text-muted-foreground">
          Allergies, notification settings, emergency contacts, and saved pharmacies
          arrive in later phases.
        </p>
        <Button variant="outline" onClick={signOut} className="w-fit">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </section>
    </div>
  );
}
