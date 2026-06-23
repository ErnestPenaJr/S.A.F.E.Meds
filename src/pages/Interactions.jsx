import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Sparkles, Utensils, AlertTriangle } from 'lucide-react';
import { DrugInteraction } from '@/api/entities';
import { useMeds } from '@/hooks/data';
import { analyzeInteractions, isDemoAI } from '@/api/ai';
import { getAnalysisCache, saveAnalysisCache } from '@/lib/analysisCache';
import InteractionCard from '@/components/interactions/InteractionCard';
import SeverityBadge from '@/components/interactions/SeverityBadge';
import EmptyState from '@/components/common/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const pairKey = (a, b) => [`${a}`.toLowerCase(), `${b}`.toLowerCase()].sort().join('|');

const TABS = [
  { id: 'interactions', label: 'Interactions', icon: ShieldAlert },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'safety', label: 'Safety', icon: AlertTriangle }
];

export default function Interactions() {
  const qc = useQueryClient();
  const { data: meds = [] } = useMeds();
  const [tab, setTab] = useState('interactions');
  const [cache, setCache] = useState(() => getAnalysisCache());

  const { data: saved = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => DrugInteraction.list('-created_date')
  });

  const analyze = useMutation({
    mutationFn: async () => {
      const active = meds.filter((m) => m.active !== false);
      const result = await analyzeInteractions(active);

      // Carry acknowledged state across re-analysis, keyed by med pair.
      const existing = await DrugInteraction.filter({ source: 'ai' });
      const ackBy = {};
      existing.forEach((e) => {
        ackBy[pairKey(e.medication_a_name, e.medication_b_name)] = {
          acknowledged: e.acknowledged,
          acknowledged_at: e.acknowledged_at || null
        };
      });
      await Promise.all(existing.map((e) => DrugInteraction.delete(e.id)));

      const byName = Object.fromEntries(active.map((m) => [m.name.toLowerCase(), m.id]));
      if (result.interactions?.length) {
        await DrugInteraction.bulkCreate(
          result.interactions.map((it) => {
            const prev = ackBy[pairKey(it.medication_a_name, it.medication_b_name)] || {};
            return {
              medication_a_id: it.medication_a_id || byName[(it.medication_a_name || '').toLowerCase()] || null,
              medication_b_id: it.medication_b_id || byName[(it.medication_b_name || '').toLowerCase()] || null,
              medication_a_name: it.medication_a_name,
              medication_b_name: it.medication_b_name,
              severity: it.severity,
              confidence: it.confidence ?? null,
              description: it.description,
              mechanism: it.mechanism || null,
              clinical_effects: it.clinical_effects || [],
              recommendations: it.recommendations || [],
              source: 'ai',
              acknowledged: Boolean(prev.acknowledged),
              acknowledged_at: prev.acknowledged ? prev.acknowledged_at : null
            };
          })
        );
      }

      const next = {
        food: result.food_interactions || [],
        safety: result.safety_alerts || [],
        at: new Date().toISOString()
      };
      saveAnalysisCache(next);
      return next;
    },
    onSuccess: (next) => {
      setCache(next);
      qc.invalidateQueries({ queryKey: ['interactions'] });
    }
  });

  const acknowledge = useMutation({
    mutationFn: (id) => DrugInteraction.update(id, { acknowledged: true, acknowledged_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interactions'] })
  });

  const sortedSaved = useMemo(() => {
    const rank = { high: 0, medium: 1, low: 2 };
    return [...saved].sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3));
  }, [saved]);

  const lastRun = cache?.at ? new Date(cache.at) : null;
  const hasAnalyzed = saved.length > 0 || Boolean(cache);

  return (
    <div className="flex flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Interactions</h1>
        <Button size="sm" onClick={() => analyze.mutate()} disabled={analyze.isPending || meds.length === 0}>
          <Sparkles className="h-4 w-4" />
          {analyze.isPending ? 'Analyzing…' : 'Analyze'}
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Informational only — not medical advice. Always confirm with your pharmacist or doctor.
          {isDemoAI ? ' (Demo analysis)' : ''}
        </span>
      </div>

      {lastRun && <p className="text-xs text-muted-foreground">Last analyzed {lastRun.toLocaleString()}</p>}

      <div className="flex rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => {
          const on = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors',
                on ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {!hasAnalyzed ? (
        <EmptyState
          icon={ShieldAlert}
          title="No analysis yet"
          action={
            <Button onClick={() => analyze.mutate()} disabled={meds.length === 0}>
              <Sparkles className="h-4 w-4" /> Analyze my medications
            </Button>
          }
        >
          {meds.length === 0
            ? 'Add medications first, then run an analysis.'
            : 'Check for drug, food, and safety interactions across your list.'}
        </EmptyState>
      ) : tab === 'interactions' ? (
        sortedSaved.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No interactions found">
            Good news — no known interactions among your active medications.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedSaved.map((it) => (
              <InteractionCard key={it.id} item={it} onAcknowledge={() => acknowledge.mutate(it.id)} />
            ))}
          </div>
        )
      ) : tab === 'food' ? (
        (cache?.food?.length || 0) === 0 ? (
          <EmptyState icon={Utensils} title="No food interactions">No notable food interactions for your list.</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {cache.food.map((f, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{f.medication_name} · {f.food}</span>
                  <SeverityBadge severity={f.severity} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                {f.recommendation && <p className="mt-1 text-xs"><b>Tip:</b> {f.recommendation}</p>}
              </Card>
            ))}
          </div>
        )
      ) : (cache?.safety?.length || 0) === 0 ? (
        <EmptyState icon={AlertTriangle} title="No safety alerts">Nothing flagged for your list.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {cache.safety.map((s, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{s.title}</span>
                <SeverityBadge severity={s.severity} />
              </div>
              <p className="text-xs text-muted-foreground">{s.medication_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
