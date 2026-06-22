import { Check, X, Undo2 } from 'lucide-react';
import TypeBadge from '@/components/medications/TypeBadge';
import { formatTime } from '@/lib/schedule';
import { cycleStatus } from '@/lib/peptides';
import { cn } from '@/lib/utils';

export default function DoseRow({ dose, med, onTake, onSkip, onReset }) {
  const { taken, skipped } = dose;
  const isPeptide = med?.type === 'peptide';
  const cyc = isPeptide
    ? cycleStatus(med.cycle_start_date, med.cycle_weeks_on, med.cycle_weeks_off, new Date(dose.date))
    : null;

  const meta = [
    formatTime(dose.scheduled_time),
    med?.dosage,
    isPeptide && med?.injection_route ? med.injection_route : null,
    med?.with_food ? 'with food' : null
  ].filter(Boolean).join(' · ');

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card p-3',
        isPeptide ? 'border-peptide/40' : 'border-border',
        (taken || skipped) && 'opacity-70'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{med?.name || 'Medication'}</span>
          {med && <TypeBadge type={med.type} />}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</div>
        {cyc && <div className="mt-0.5 text-[11px] font-bold text-peptide">{cyc.label}</div>}
      </div>

      {taken ? (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success"
        >
          <Check className="h-3.5 w-3.5" /> Taken
        </button>
      ) : skipped ? (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground"
        >
          <Undo2 className="h-3.5 w-3.5" /> Skipped
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            aria-label="Skip dose"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onTake}
            aria-label="Mark dose taken"
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Check className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
