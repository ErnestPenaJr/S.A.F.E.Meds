import { useState, useMemo } from 'react';
import { addDays, format, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { useMeds, useDaySchedule, useDoseActions } from '@/hooks/data';
import { dateKey } from '@/lib/schedule';
import DoseRow from '@/components/schedule/DoseRow';
import EmptyState from '@/components/common/EmptyState';

export default function Schedule() {
  const [offset, setOffset] = useState(0);
  const date = addDays(new Date(), offset);
  const ds = dateKey(date);

  const { data: meds = [] } = useMeds();
  const { data: doses = [], isLoading } = useDaySchedule(ds);
  const { take, skip, reset } = useDoseActions(ds);

  const medMap = useMemo(() => Object.fromEntries(meds.map((m) => [m.id, m])), [meds]);
  const sorted = useMemo(
    () => [...doses].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)),
    [doses]
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight">Schedule</h1>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Previous day"
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="font-bold">{format(date, 'EEEE')}</div>
          <div className="text-xs text-muted-foreground">
            {format(date, 'MMM d, yyyy')}
            {isToday(date) ? ' · Today' : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          aria-label="Next day"
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {offset !== 0 && (
        <button
          type="button"
          onClick={() => setOffset(0)}
          className="self-center text-xs font-semibold text-primary"
        >
          Jump to today
        </button>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No doses">
          Nothing scheduled for this day.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((d) => (
            <DoseRow
              key={d.id}
              dose={d}
              med={medMap[d.medication_id]}
              onTake={() => take.mutate({ id: d.id })}
              onSkip={() => skip.mutate(d.id)}
              onReset={() => reset.mutate(d.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
