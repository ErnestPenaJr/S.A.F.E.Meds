import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pill, AlertCircle } from 'lucide-react';
import { SharedList, Medication } from '@/api/entities';
import TypeBadge from '@/components/medications/TypeBadge';
import { labelForFrequency } from '@/lib/constants';
import { formatTime, timesForMed } from '@/lib/schedule';

/* Public, read-only view of a shared medication list (no auth). */
export default function SharedView() {
  const [params] = useSearchParams();
  const code = params.get('code');

  const { data, isLoading } = useQuery({
    queryKey: ['shared', code],
    enabled: Boolean(code),
    queryFn: async () => {
      const lists = await SharedList.filter({ access_code: code });
      const list = lists.find((l) => l.active !== false) || lists[0] || null;
      if (!list) return { list: null, meds: [] };
      const all = await Medication.list();
      const meds = (list.medication_ids || []).map((id) => all.find((m) => m.id === id)).filter(Boolean);
      return { list, meds };
    }
  });

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 w-full max-w-screen-sm items-center gap-2 px-4">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-secondary to-primary" />
          <span className="font-heading text-lg font-extrabold tracking-tight">S.A.F.E <span className="text-primary">Meds</span></span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-sm px-4 py-6">
        {!code ? (
          <Notice title="No list specified">This link is missing its access code.</Notice>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data?.list ? (
          <Notice title="List not found">No shared list matches code <b>{code}</b>, or it's no longer active.</Notice>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shared medication list</div>
              <h1 className="font-heading text-2xl font-extrabold tracking-tight">{data.list.title}</h1>
              {data.list.recipient_name && <p className="text-sm text-muted-foreground">For {data.list.recipient_name}</p>}
            </div>

            {data.meds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No medications in this list.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.meds.map((m) => (
                  <div key={m.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold">{m.name}</span>
                      <TypeBadge type={m.type} />
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {[m.dosage, labelForFrequency(m.frequency)].filter(Boolean).join(' · ')}
                    </div>
                    {data.list.include_schedule && timesForMed(m).length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Times: {timesForMed(m).map(formatTime).join(', ')}
                      </div>
                    )}
                    {m.instructions && <p className="mt-1 text-xs text-muted-foreground">{m.instructions}</p>}
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Shared via S.A.F.E Meds. Informational only — not medical advice.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Notice({ title, children }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <div className="font-heading font-bold">{title}</div>
      <p className="max-w-xs text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
