import { Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import ThemePicker from '@/components/common/ThemePicker';

export default function Login() {
  const { signIn, isStub } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-8 bg-background px-6 pt-safe pb-safe">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-primary-foreground">
          <Pill className="h-8 w-8" />
        </span>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          S.A.F.E <span className="text-primary">Meds</span>
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Track medications, supplements, and peptides. Never miss a dose.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button size="lg" className="w-full" onClick={signIn}>
          {isStub ? 'Continue in demo mode' : 'Sign in'}
        </Button>
        {isStub && (
          <p className="text-center text-xs text-muted-foreground">
            Demo mode — sign-in keys aren't configured yet, so this signs you in
            locally so you can explore. Real accounts arrive once Neon Auth is connected.
          </p>
        )}
      </div>

      <div className="w-full max-w-xs">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pick your look
        </p>
        <ThemePicker />
      </div>

      <p className="max-w-xs text-center text-[11px] leading-relaxed text-muted-foreground">
        Not medical advice. Always consult your healthcare provider.
      </p>
    </div>
  );
}
