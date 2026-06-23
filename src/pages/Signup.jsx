import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';

export default function Signup() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await signUp({ email, password, fullName });
    } catch (ex) {
      setError(ex?.message?.replace(/^API \d+ on [^:]+:\s*/, '') || 'Sign up failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-7 bg-background px-6 pt-safe pb-safe">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-primary-foreground">
          <Pill className="h-8 w-8" />
        </span>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Track medications, supplements, and peptides.</p>
      </div>

      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" type="text" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" required />
        </div>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}

        <Button type="submit" size="lg" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-semibold text-primary">Sign in</Link>
        </p>
      </form>

      <p className="max-w-xs text-center text-[11px] leading-relaxed text-muted-foreground">
        Not medical advice. Always consult your healthcare provider.
      </p>
    </div>
  );
}
