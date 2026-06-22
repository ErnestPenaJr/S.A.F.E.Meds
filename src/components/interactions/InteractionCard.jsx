import { Check, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import SeverityBadge from '@/components/interactions/SeverityBadge';

export default function InteractionCard({ item, onAcknowledge }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold leading-tight">
            {item.medication_a_name} <span className="text-muted-foreground">↔</span> {item.medication_b_name}
          </span>
        </div>
        <SeverityBadge severity={item.severity} />
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
      {item.mechanism && (
        <p className="mt-1 text-xs text-muted-foreground"><b>Mechanism:</b> {item.mechanism}</p>
      )}

      {item.recommendations?.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {item.recommendations.map((r, i) => (
            <li key={i} className="flex gap-2 text-xs text-foreground">
              <span className="text-primary">•</span>
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between">
        {typeof item.confidence === 'number' ? (
          <span className="text-[11px] text-muted-foreground">{item.confidence}% confidence</span>
        ) : (
          <span />
        )}
        {item.acknowledged ? (
          <span className="flex items-center gap-1 text-xs font-bold text-success">
            <Check className="h-3.5 w-3.5" /> Acknowledged
          </span>
        ) : (
          <button
            type="button"
            onClick={onAcknowledge}
            className="rounded-lg border border-border px-3 py-1 text-xs font-semibold"
          >
            Acknowledge
          </button>
        )}
      </div>
    </Card>
  );
}
