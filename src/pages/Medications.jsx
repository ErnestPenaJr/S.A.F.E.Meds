import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pill } from 'lucide-react';
import { Medication, MedicationSchedule } from '@/api/entities';
import { useMeds, qk } from '@/hooks/data';
import MedicationCard from '@/components/medications/MedicationCard';
import MedicationFilters from '@/components/medications/MedicationFilters';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

export default function Medications() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: meds = [], isLoading } = useMeds();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('active');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.meds });
    qc.invalidateQueries({ queryKey: ['schedule'] });
    qc.invalidateQueries({ queryKey: qk.streak });
  };

  const toggle = useMutation({
    mutationFn: (med) => Medication.update(med.id, { active: !med.active }),
    onSuccess: invalidate
  });
  const del = useMutation({
    mutationFn: async (med) => {
      await Medication.delete(med.id);
      const rows = await MedicationSchedule.filter({ medication_id: med.id });
      await Promise.all(rows.map((s) => MedicationSchedule.delete(s.id)));
    },
    onSuccess: invalidate
  });

  const filtered = useMemo(
    () =>
      meds.filter((m) => {
        if (status === 'active' && !m.active) return false;
        if (status === 'inactive' && m.active) return false;
        if (type !== 'all' && m.type !== type) return false;
        if (
          search &&
          !`${m.name} ${m.generic_name || ''} ${m.brand_name || ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [meds, search, type, status]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Medications</h1>
        <Button size="sm" onClick={() => navigate('/add-medication')}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <MedicationFilters
        search={search}
        onSearch={setSearch}
        type={type}
        onType={setType}
        status={status}
        onStatus={setStatus}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Pill}
          title={meds.length ? 'No matches' : 'No medications yet'}
          action={
            <Button onClick={() => navigate('/add-medication')}>
              <Plus className="h-4 w-4" /> Add medication
            </Button>
          }
        >
          {meds.length ? 'Try a different filter.' : 'Add your first medication, supplement, or peptide.'}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((med) => (
            <MedicationCard
              key={med.id}
              med={med}
              onToggleActive={(m) => toggle.mutate(m)}
              onEdit={(m) => navigate(`/add-medication?id=${m.id}`)}
              onDelete={(m) => {
                if (window.confirm(`Delete ${m.name}? This removes its schedule too.`)) del.mutate(m);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
