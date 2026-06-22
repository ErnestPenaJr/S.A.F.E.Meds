import { Flame, Check, ChevronRight } from 'lucide-react';
import TypeBadge from '@/components/medications/TypeBadge';
import { formatTime } from '@/lib/schedule';

/*
  Per-theme dashboard hero. The active theme's `hero` value selects the variant:
  banner (Vital) · ring (After Dark) · bento (Bento) · big-action (Clear).
  All consume the same { greeting, dateLabel, stats, next, onTakeNext } props.
*/
function Greeting({ greeting, dateLabel }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{dateLabel}</div>
      <h1 className="font-heading text-2xl font-extrabold tracking-tight">{greeting}</h1>
    </div>
  );
}

function NextLine({ next }) {
  if (!next) return <span>All caught up for now 🎉</span>;
  return (
    <span>
      Next: <b>{next.med?.name || 'dose'}</b> at {formatTime(next.dose.scheduled_time)}
    </span>
  );
}

function HeroBanner({ greeting, dateLabel, stats }) {
  return (
    <div className="flex flex-col gap-4">
      <Greeting greeting={greeting} dateLabel={dateLabel} />
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-secondary to-primary p-4 text-primary-foreground">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/20">
          <Flame className="h-6 w-6" />
        </span>
        <div>
          <div className="text-2xl font-extrabold leading-none">{stats.streak}-day streak</div>
          <div className="text-sm opacity-90">{stats.pct}% adherence today — keep it going</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[['Doses', stats.total], ['Taken', stats.taken], ['Due', stats.pending]].map(([label, n]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="text-xl font-extrabold">{n}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroRing({ greeting, dateLabel, stats, next }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - stats.pct / 100);
  return (
    <div className="flex flex-col gap-4">
      <Greeting greeting={greeting} dateLabel={dateLabel} />
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="text-muted" stroke="currentColor" />
            <circle
              cx="50" cy="50" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
              className="text-primary" stroke="currentColor"
              strokeDasharray={c} strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-2xl font-extrabold tabular-nums leading-none">{stats.pct}%</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">today</div>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-bold">{stats.taken} of {stats.total} doses</div>
          <div className="text-sm text-muted-foreground">{stats.pending} due · {stats.skipped} skipped</div>
          <div className="mt-1.5 flex items-center gap-1 text-sm font-bold text-primary">
            <Flame className="h-4 w-4" /> {stats.streak}-day streak
          </div>
          <div className="mt-1 truncate text-xs text-muted-foreground"><NextLine next={next} /></div>
        </div>
      </div>
    </div>
  );
}

function HeroBento({ greeting, dateLabel, stats, next }) {
  return (
    <div className="flex flex-col gap-4">
      <Greeting greeting={greeting} dateLabel={dateLabel} />
      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2 rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-primary-foreground">
          <div className="text-xs font-bold uppercase tracking-wide opacity-90">Today's adherence</div>
          <div className="text-3xl font-extrabold">
            {stats.taken} / {stats.total} <span className="text-base font-bold opacity-90">doses</span>
          </div>
          <div className="text-sm font-semibold opacity-90">
            <Flame className="mr-1 inline h-4 w-4" />{stats.streak}-day streak · {stats.pending} due now
          </div>
        </div>
        <div className="rounded-2xl bg-sky-500 p-4 text-white">
          <div className="text-xs font-bold uppercase tracking-wide opacity-90">Next up</div>
          <div className="text-2xl font-extrabold">{next ? formatTime(next.dose.scheduled_time) : '—'}</div>
          <div className="truncate text-sm font-semibold opacity-90">{next?.med?.name || 'Nothing due'}</div>
        </div>
        <div className="rounded-2xl bg-emerald-600 p-4 text-white">
          <div className="text-xs font-bold uppercase tracking-wide opacity-90">Taken</div>
          <div className="text-2xl font-extrabold">{stats.pct}%</div>
          <div className="text-sm font-semibold opacity-90">on track</div>
        </div>
      </div>
    </div>
  );
}

function HeroBigAction({ greeting, dateLabel, stats, next, onTakeNext }) {
  return (
    <div className="flex flex-col gap-4">
      <Greeting greeting={greeting} dateLabel={dateLabel} />
      {next ? (
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="text-sm font-semibold opacity-90">
            NEXT DOSE · {formatTime(next.dose.scheduled_time)}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-extrabold">{next.med?.name || 'Dose'}</span>
            {next.med && <TypeBadge type={next.med.type} />}
          </div>
          {next.med?.dosage && <div className="text-sm opacity-90">{next.med.dosage}</div>}
          <button
            type="button"
            onClick={onTakeNext}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-card py-3.5 text-base font-extrabold text-primary"
          >
            <Check className="h-5 w-5" strokeWidth={3} /> Mark as taken
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="font-heading text-lg font-bold">You're all caught up</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {stats.taken} of {stats.total} doses taken · {stats.streak}-day streak
          </div>
        </div>
      )}
    </div>
  );
}

const VARIANTS = {
  banner: HeroBanner,
  ring: HeroRing,
  bento: HeroBento,
  'big-action': HeroBigAction
};

export default function Hero({ variant, ...props }) {
  const Cmp = VARIANTS[variant] || HeroBanner;
  return <Cmp {...props} />;
}
