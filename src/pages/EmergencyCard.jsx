import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Printer, Plus, X, ShieldPlus } from 'lucide-react';
import { EmergencyContact, Medication } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { getProfileLocal, setProfileLocal } from '@/lib/profileLocal';
import { labelForFrequency } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const RELATIONSHIPS = ['spouse', 'parent', 'child', 'sibling', 'friend', 'caregiver', 'doctor', 'other'];

function Section({ title, children }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function EmergencyCard() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [allergies, setAllergies] = useState(() => getProfileLocal().allergies || []);
  const [allergyInput, setAllergyInput] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', relationship: 'spouse', phone: '' });

  const { data: contacts = [] } = useQuery({ queryKey: ['contacts'], queryFn: () => EmergencyContact.list('-created_date') });
  const { data: meds = [] } = useQuery({ queryKey: ['meds-active'], queryFn: () => Medication.filter({ active: true }) });

  const addAllergy = () => {
    const v = allergyInput.trim();
    if (!v) return;
    const next = [...allergies, v];
    setAllergies(next);
    setProfileLocal({ allergies: next });
    setAllergyInput('');
  };
  const removeAllergy = (i) => {
    const next = allergies.filter((_, idx) => idx !== i);
    setAllergies(next);
    setProfileLocal({ allergies: next });
  };

  const addContact = useMutation({
    mutationFn: () => EmergencyContact.create({ name: contactForm.name.trim(), relationship: contactForm.relationship, phone: contactForm.phone.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      setContactForm({ name: '', relationship: 'spouse', phone: '' });
    }
  });
  const delContact = useMutation({ mutationFn: (id) => EmergencyContact.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }) });

  const canAddContact = contactForm.name.trim() && contactForm.phone.trim();

  return (
    <div className="flex flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-2xl">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Emergency Card</h1>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
      </div>

      {/* Printable card */}
      <Card className="p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <ShieldPlus className="h-5 w-5 text-primary" />
          <div>
            <div className="font-heading text-lg font-extrabold leading-tight">Emergency Medical Card</div>
            <div className="text-xs text-muted-foreground">{user?.fullName || user?.email || ''}</div>
          </div>
        </div>

        <Section title="Allergies">
          {allergies.length === 0 ? (
            <span className="text-sm text-muted-foreground">None recorded</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                  {a}
                  <button type="button" onClick={() => removeAllergy(i)} aria-label={`Remove ${a}`} className="print:hidden">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title="Emergency Contacts">
          {contacts.length === 0 ? (
            <span className="text-sm text-muted-foreground">None added</span>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {contacts.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-xs capitalize text-muted-foreground">{c.relationship}</span>
                  <span className="ml-auto">{c.phone}</span>
                  <button type="button" onClick={() => delContact.mutate(c.id)} aria-label="Remove contact" className="text-destructive print:hidden">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Active Medications (${meds.length})`}>
          {meds.length === 0 ? (
            <span className="text-sm text-muted-foreground">None</span>
          ) : (
            <ul className="flex flex-col gap-1">
              {meds.map((m) => (
                <li key={m.id} className="text-sm">
                  <span className="font-semibold">{m.name}</span>{' '}
                  <span className="text-muted-foreground">{[m.dosage, labelForFrequency(m.frequency)].filter(Boolean).join(' · ')}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
          Generated by S.A.F.E Meds · Informational only — not medical advice.
        </p>
      </Card>

      {/* Editors — not printed */}
      <div className="flex flex-col gap-3 print:hidden">
        <Card className="p-4">
          <div className="text-sm font-semibold">Add allergy</div>
          <div className="mt-1.5 flex gap-2">
            <Input
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              placeholder="e.g. Penicillin"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
            />
            <Button variant="outline" onClick={addAllergy} aria-label="Add allergy"><Plus className="h-4 w-4" /></Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold">Add emergency contact</div>
          <div className="mt-2 flex flex-col gap-2">
            <Input value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" />
            <div className="flex gap-2">
              <Select value={contactForm.relationship} onChange={(e) => setContactForm((f) => ({ ...f, relationship: e.target.value }))} className="capitalize">
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
              <Input value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" type="tel" />
            </div>
            <Button variant="outline" onClick={() => canAddContact && addContact.mutate()} disabled={!canAddContact}>
              <Plus className="h-4 w-4" /> Add contact
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
