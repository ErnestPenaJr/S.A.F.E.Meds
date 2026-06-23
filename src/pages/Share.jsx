import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Check, Share2, Trash2 } from 'lucide-react';
import { SharedList } from '@/api/entities';
import { useMeds } from '@/hooks/data';
import { generateAccessCode, shareUrl } from '@/lib/share';
import BottomSheet from '@/components/common/BottomSheet';
import EmptyState from '@/components/common/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const SHARE_TYPES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'family', label: 'Family' },
  { value: 'caregiver', label: 'Caregiver' }
];

const BLANK = { title: '', recipient_name: '', share_type: 'doctor', include_schedule: true, medication_ids: [] };

export default function Share() {
  const qc = useQueryClient();
  const { data: meds = [] } = useMeds();
  const { data: lists = [] } = useQuery({ queryKey: ['sharedLists'], queryFn: () => SharedList.list('-created_date') });

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState(BLANK);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleMed = (id) =>
    setForm((f) => ({
      ...f,
      medication_ids: f.medication_ids.includes(id) ? f.medication_ids.filter((x) => x !== id) : [...f.medication_ids, id]
    }));

  const activeMeds = meds.filter((m) => m.active !== false);

  const create = useMutation({
    mutationFn: () =>
      SharedList.create({
        title: form.title.trim() || 'My medications',
        description: null,
        medication_ids: form.medication_ids.length ? form.medication_ids : activeMeds.map((m) => m.id),
        recipient_name: form.recipient_name.trim() || null,
        share_type: form.share_type,
        include_schedule: form.include_schedule,
        access_code: generateAccessCode(),
        active: true
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sharedLists'] });
      setOpen(false);
      setForm(BLANK);
    }
  });
  const del = useMutation({ mutationFn: (id) => SharedList.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['sharedLists'] }) });

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(shareUrl(code));
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Share Lists</h1>
        <Button size="sm" onClick={() => setOpen(true)} disabled={activeMeds.length === 0}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {lists.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No shared lists yet"
          action={<Button onClick={() => setOpen(true)} disabled={activeMeds.length === 0}><Plus className="h-4 w-4" /> Create a shared list</Button>}
        >
          {activeMeds.length === 0 ? 'Add medications first.' : 'Share a read-only medication list with a doctor, family member, or caregiver via a private link.'}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {lists.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-heading font-bold">{l.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {[l.recipient_name, SHARE_TYPES.find((s) => s.value === l.share_type)?.label, `${l.medication_ids?.length || 0} meds`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button type="button" onClick={() => del.mutate(l.id)} aria-label="Delete" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="rounded-md bg-muted px-2 py-1 text-sm font-bold tracking-widest">{l.access_code}</code>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => copy(l.access_code)}>
                  {copied === l.access_code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === l.access_code ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Create shared list">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="My medications" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Recipient</Label>
              <Input value={form.recipient_name} onChange={(e) => set('recipient_name', e.target.value)} placeholder="Dr. Smith" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Share with</Label>
              <Select value={form.share_type} onChange={(e) => set('share_type', e.target.value)}>
                {SHARE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Medications</Label>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-border">
              {activeMeds.map((m) => {
                const on = form.medication_ids.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMed(m.id)}
                    className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm last:border-0"
                  >
                    <span className={cn('grid h-5 w-5 place-items-center rounded border', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                      {on && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="truncate">{m.name}{m.dosage ? ` · ${m.dosage}` : ''}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Leave all unchecked to share every active medication.</p>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-semibold">Include schedule times</span>
            <Switch checked={form.include_schedule} onCheckedChange={(v) => set('include_schedule', v)} />
          </label>

          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create & get link'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
