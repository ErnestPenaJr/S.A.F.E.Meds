import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Pill, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useMeds, useDaySchedule, useStreak, useDoseActions, qk } from '@/hooks/data';
import { dateKey } from '@/lib/schedule';
import { seedSampleData } from '@/lib/seed';
import Hero from '@/components/home/Hero';
import TodaysMedications from '@/components/home/TodaysMedications';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

export default function Home() {
  const today = dateKey();
  const { user } = useAuth();
  const { themeMeta } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: meds = [] } = useMeds();
  const { data: doses = [], isLoading } = useDaySchedule(today);
  const { data: streak = 0 } = useStreak();
  const { take } = useDoseActions(today);

  const seed = useMutation({
    mutationFn: seedSampleData,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.meds });
      qc.invalidateQueries({ queryKey: qk.schedule(today) });
      qc.invalidateQueries({ queryKey: qk.streak });
    }
  });

  const medMap = useMemo(() => Object.fromEntries(meds.map((m) => [m.id, m])), [meds]);
  const sorted = useMemo(
    () => [...doses].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)),
    [doses]
  );
  const stats = useMemo(() => {
    const total = doses.length;
    const taken = doses.filter((d) => d.taken).length;
    const skipped = doses.filter((d) => d.skipped).length;
    return { total, taken, skipped, pending: total - taken - skipped, pct: total ? Math.round((taken / total) * 100) : 100, streak };
  }, [doses, streak]);
  const next = useMemo(() => {
    const d = sorted.find((x) => !x.taken && !x.skipped);
    return d ? { dose: d, med: medMap[d.medication_id] } : null;
  }, [sorted, medMap]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    const name = (user?.fullName || '').split(' ')[0] || '';
    const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    return name ? `${part}, ${name}` : part;
  }, [user]);
  const dateLabel = format(new Date(), 'EEEE, MMM d');

  if (meds.length === 0) {
    return (
      <div className="flex flex-col gap-5 pt-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{dateLabel}</div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">{greeting}</h1>
        </div>
        <EmptyState
          icon={Pill}
          title="Welcome to S.A.F.E Meds"
          action={
            <div className="flex w-full flex-col gap-2">
              <Button onClick={() => navigate('/add-medication')}>Add your first medication</Button>
              <Button variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending}>
                <Sparkles className="h-4 w-4" />
                {seed.isPending ? 'Loading…' : 'Load sample data'}
              </Button>
            </div>
          }
        >
          Track medications, supplements, vitamins, and peptides — with reminders and adherence.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-8">
      <Hero
        variant={themeMeta.hero}
        greeting={greeting}
        dateLabel={dateLabel}
        stats={stats}
        next={next}
        onTakeNext={() => next && take.mutate({ id: next.dose.id })}
      />

      <section className="mt-6 flex flex-col gap-3 lg:mt-0">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">Today</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : doses.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="Nothing scheduled today"
            action={<Button variant="outline" onClick={() => navigate('/medications')}>View medications</Button>}
          >
            Your active meds don't have doses for today (e.g. as-needed or off-cycle).
          </EmptyState>
        ) : (
          <TodaysMedications doses={sorted} medMap={medMap} dateStr={today} />
        )}
      </section>
    </div>
  );
}
