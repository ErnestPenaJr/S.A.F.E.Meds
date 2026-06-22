import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Medication } from '@/api/entities';
import {
  ensureSchedulesForDate, computeStreak, markTaken, markSkipped, resetDose
} from '@/lib/schedule';

export const qk = {
  meds: ['meds'],
  schedule: (d) => ['schedule', d],
  streak: ['streak']
};

export function useMeds() {
  return useQuery({ queryKey: qk.meds, queryFn: () => Medication.list('-created_date') });
}

export function useDaySchedule(dateStr) {
  return useQuery({ queryKey: qk.schedule(dateStr), queryFn: () => ensureSchedulesForDate(dateStr) });
}

export function useStreak() {
  return useQuery({ queryKey: qk.streak, queryFn: computeStreak });
}

export function useDoseActions(dateStr) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.schedule(dateStr) });
    qc.invalidateQueries({ queryKey: qk.streak });
  };
  const take = useMutation({ mutationFn: ({ id, site }) => markTaken(id, site), onSuccess: invalidate });
  const skip = useMutation({ mutationFn: (id) => markSkipped(id), onSuccess: invalidate });
  const reset = useMutation({ mutationFn: (id) => resetDose(id), onSuccess: invalidate });
  return { take, skip, reset };
}
