import { Badge } from '@/components/ui/badge';
import { TYPE_STYLES, labelForType } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function TypeBadge({ type, className }) {
  return (
    <Badge className={cn(TYPE_STYLES[type] || TYPE_STYLES.medication, className)}>
      {labelForType(type)}
    </Badge>
  );
}
