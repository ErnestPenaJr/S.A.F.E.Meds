import DoseRow from '@/components/schedule/DoseRow';
import { useDoseActions } from '@/hooks/data';

export default function TodaysMedications({ doses, medMap, dateStr }) {
  const { take, skip, reset } = useDoseActions(dateStr);
  return (
    <div className="flex flex-col gap-2.5">
      {doses.map((d) => (
        <DoseRow
          key={d.id}
          dose={d}
          med={medMap[d.medication_id]}
          onTake={() => take.mutate({ id: d.id })}
          onSkip={() => skip.mutate(d.id)}
          onReset={() => reset.mutate(d.id)}
        />
      ))}
    </div>
  );
}
