import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X, Syringe } from 'lucide-react';
import { Medication } from '@/api/entities';
import { qk } from '@/hooks/data';
import { FREQUENCY_DEFAULT_TIMES } from '@/lib/schedule';
import {
  MED_TYPES, FORMS, FREQUENCIES, DOSE_UNITS, INJECTION_ROUTES, INJECTION_SITES
} from '@/lib/constants';
import { reconstitutedConcentration, doseVolumeMl, insulinUnits } from '@/lib/peptides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const BLANK = {
  name: '', type: 'medication', dosage: '', form: 'tablet',
  frequency: 'once_daily', times: ['09:00'], with_food: false,
  instructions: '', prescribing_doctor: '', start_date: '', end_date: '', notes: '', active: true,
  // peptide
  vial_amount_mg: '', bac_water_ml: '', dose_amount: '', dose_unit: 'mcg',
  injection_route: 'subcutaneous', injection_sites: [],
  cycle_weeks_on: '', cycle_weeks_off: '', cycle_start_date: ''
};

function Field({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function AddMedication() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const editId = params.get('id');

  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Load existing med when editing.
  useEffect(() => {
    if (!editId) return;
    Medication.get(editId).then((med) => {
      if (med) setForm({ ...BLANK, ...med, times: med.times?.length ? med.times : BLANK.times });
    });
  }, [editId]);

  const isPeptide = form.type === 'peptide';

  // Live peptide math.
  const conc = useMemo(
    () => reconstitutedConcentration(form.vial_amount_mg, form.bac_water_ml),
    [form.vial_amount_mg, form.bac_water_ml]
  );
  const volume = useMemo(
    () => doseVolumeMl(form.dose_amount, form.dose_unit, conc),
    [form.dose_amount, form.dose_unit, conc]
  );
  const units = insulinUnits(volume);

  const onTypeChange = (type) => {
    setForm((f) => ({
      ...f,
      type,
      form: type === 'peptide' ? 'subcutaneous_injection' : f.form,
      dose_unit: type === 'peptide' ? 'mcg' : f.dose_unit
    }));
  };

  const onFrequencyChange = (frequency) => {
    const defaults = FREQUENCY_DEFAULT_TIMES[frequency] || [];
    setForm((f) => ({ ...f, frequency, times: defaults.length ? [...defaults] : f.times }));
  };

  const setTime = (i, value) => setForm((f) => ({ ...f, times: f.times.map((t, idx) => (idx === i ? value : t)) }));
  const addTime = () => setForm((f) => ({ ...f, times: [...f.times, '12:00'] }));
  const removeTime = (i) => setForm((f) => ({ ...f, times: f.times.filter((_, idx) => idx !== i) }));

  const toggleSite = (site) =>
    setForm((f) => ({
      ...f,
      injection_sites: f.injection_sites.includes(site)
        ? f.injection_sites.filter((s) => s !== site)
        : [...f.injection_sites, site]
    }));

  const num = (v) => (v === '' || v == null ? null : Number(v));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      dosage: form.dosage || null,
      form: form.form || null,
      frequency: form.frequency,
      times: form.times.filter(Boolean),
      with_food: form.with_food,
      instructions: form.instructions || null,
      prescribing_doctor: form.prescribing_doctor || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes || null,
      active: form.active,
      ...(isPeptide
        ? {
            vial_amount_mg: num(form.vial_amount_mg),
            bac_water_ml: num(form.bac_water_ml),
            concentration_mcg_per_ml: conc,
            dose_amount: num(form.dose_amount),
            dose_unit: form.dose_unit,
            injection_route: form.injection_route,
            injection_sites: form.injection_sites,
            cycle_weeks_on: num(form.cycle_weeks_on),
            cycle_weeks_off: num(form.cycle_weeks_off),
            cycle_start_date: form.cycle_start_date || null
          }
        : {})
    };

    if (editId) await Medication.update(editId, payload);
    else await Medication.create(payload);

    qc.invalidateQueries({ queryKey: qk.meds });
    qc.invalidateQueries({ queryKey: ['schedule'] });
    qc.invalidateQueries({ queryKey: qk.streak });
    navigate('/medications');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-4 lg:mx-auto lg:w-full lg:max-w-2xl">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight">
        {editId ? 'Edit medication' : 'Add medication'}
      </h1>

      {/* Basics */}
      <section className="flex flex-col gap-4">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Lisinopril, BPC-157" autoFocus required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={form.type} onChange={(e) => onTypeChange(e.target.value)}>
              {MED_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Form">
            <Select value={form.form} onChange={(e) => set('form', e.target.value)}>
              {FORMS.map((f) => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={isPeptide ? 'Dose label' : 'Dosage'} hint={isPeptide ? 'Shown on cards, e.g. "250mcg". Exact draw is computed below.' : undefined}>
          <Input value={form.dosage} onChange={(e) => set('dosage', e.target.value)} placeholder="e.g. 10mg" />
        </Field>
      </section>

      {/* Peptide section */}
      {isPeptide && (
        <section className="flex flex-col gap-4 rounded-xl border border-peptide/40 bg-peptide/5 p-4">
          <div className="flex items-center gap-2 text-peptide">
            <Syringe className="h-4 w-4" />
            <h2 className="font-heading text-sm font-bold uppercase tracking-wide">Peptide</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Vial amount (mg)">
              <Input type="number" inputMode="decimal" step="any" value={form.vial_amount_mg} onChange={(e) => set('vial_amount_mg', e.target.value)} placeholder="5" />
            </Field>
            <Field label="BAC water (mL)">
              <Input type="number" inputMode="decimal" step="any" value={form.bac_water_ml} onChange={(e) => set('bac_water_ml', e.target.value)} placeholder="2" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Dose amount">
              <Input type="number" inputMode="decimal" step="any" value={form.dose_amount} onChange={(e) => set('dose_amount', e.target.value)} placeholder="250" />
            </Field>
            <Field label="Unit">
              <Select value={form.dose_unit} onChange={(e) => set('dose_unit', e.target.value)}>
                {DOSE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </Field>
          </div>

          {/* Live readout */}
          <div className="rounded-lg bg-card p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Concentration</span><span className="font-bold">{conc ? `${Math.round(conc)} mcg/mL` : '—'}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Draw per dose</span><span className="font-bold text-peptide">{volume != null ? `${volume.toFixed(3)} mL${units != null ? ` · ${units}u` : ''}` : '—'}</span></div>
          </div>

          <Field label="Injection route">
            <Select value={form.injection_route} onChange={(e) => set('injection_route', e.target.value)}>
              {INJECTION_ROUTES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </Field>

          <Field label="Injection sites (rotation)">
            <div className="flex flex-wrap gap-2">
              {INJECTION_SITES.map((site) => {
                const on = form.injection_sites.includes(site);
                return (
                  <button
                    key={site}
                    type="button"
                    onClick={() => toggleSite(site)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold',
                      on ? 'border-peptide bg-peptide text-white' : 'border-border text-muted-foreground'
                    )}
                  >
                    {site}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Weeks on"><Input type="number" inputMode="numeric" value={form.cycle_weeks_on} onChange={(e) => set('cycle_weeks_on', e.target.value)} placeholder="4" /></Field>
            <Field label="Weeks off"><Input type="number" inputMode="numeric" value={form.cycle_weeks_off} onChange={(e) => set('cycle_weeks_off', e.target.value)} placeholder="2" /></Field>
            <Field label="Cycle start"><Input type="date" value={form.cycle_start_date} onChange={(e) => set('cycle_start_date', e.target.value)} /></Field>
          </div>
        </section>
      )}

      {/* Schedule */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">Schedule</h2>
        <Field label="Frequency">
          <Select value={form.frequency} onChange={(e) => onFrequencyChange(e.target.value)}>
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
        </Field>

        <Field label="Times" hint="When reminders fire and doses appear on your schedule.">
          <div className="flex flex-col gap-2">
            {form.times.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input type="time" value={t} onChange={(e) => setTime(i, e.target.value)} className="flex-1" />
                {form.times.length > 1 && (
                  <button type="button" onClick={() => removeTime(i)} aria-label="Remove time" className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addTime} className="w-fit">
              <Plus className="h-4 w-4" /> Add time
            </Button>
          </div>
        </Field>

        <label className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
          <span className="text-sm font-semibold">Take with food</span>
          <Switch checked={form.with_food} onCheckedChange={(v) => set('with_food', v)} />
        </label>
      </section>

      {/* Details */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">Details</h2>
        <Field label="Instructions"><Textarea value={form.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="e.g. Take in the morning with water." /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date"><Input type="date" value={form.start_date || ''} onChange={(e) => set('start_date', e.target.value)} /></Field>
          <Field label="End date"><Input type="date" value={form.end_date || ''} onChange={(e) => set('end_date', e.target.value)} /></Field>
        </div>
        <Field label="Prescribing doctor"><Input value={form.prescribing_doctor || ''} onChange={(e) => set('prescribing_doctor', e.target.value)} placeholder="Dr. …" /></Field>
        <Field label="Notes"><Textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></Field>
      </section>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={saving || !form.name.trim()}>
          {saving ? 'Saving…' : editId ? 'Save changes' : 'Add medication'}
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Not medical advice. Always confirm dosing with your healthcare provider.
      </p>
    </form>
  );
}
