import { Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import TypeBadge from '@/components/medications/TypeBadge';
import { labelForFrequency } from '@/lib/constants';
import { reconstitutedConcentration, cycleStatus } from '@/lib/peptides';

export default function MedicationCard({ med, onToggleActive, onEdit, onDelete }) {
  const isPeptide = med.type === 'peptide';
  const conc = isPeptide ? reconstitutedConcentration(med.vial_amount_mg, med.bac_water_ml) : null;
  const cyc = isPeptide ? cycleStatus(med.cycle_start_date, med.cycle_weeks_on, med.cycle_weeks_off) : null;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-heading text-base font-bold">{med.name}</span>
            <TypeBadge type={med.type} />
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {[med.dosage, labelForFrequency(med.frequency)].filter(Boolean).join(' · ')}
          </div>
          {isPeptide && (
            <div className="mt-1 text-xs font-semibold text-peptide">
              {conc ? `${Math.round(conc)} mcg/mL` : 'Not reconstituted'}
              {cyc ? ` · ${cyc.label}` : ''}
            </div>
          )}
        </div>
        <Switch checked={med.active} onCheckedChange={() => onToggleActive(med)} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(med)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(med)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </Card>
  );
}
