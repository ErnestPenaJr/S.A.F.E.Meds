import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MED_TYPES } from '@/lib/constants';

export default function MedicationFilters({ search, onSearch, type, onType, status, onStatus }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search medications…"
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select value={type} onChange={(e) => onType(e.target.value)}>
          <option value="all">All types</option>
          {MED_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => onStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </Select>
      </div>
    </div>
  );
}
