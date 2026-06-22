import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STYLES = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700'
};

export default function SeverityBadge({ severity, className }) {
  return <Badge className={cn(STYLES[severity] || STYLES.low, 'capitalize', className)}>{severity}</Badge>;
}
