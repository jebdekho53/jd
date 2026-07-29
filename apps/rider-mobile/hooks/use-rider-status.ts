import { useMutation } from '@tanstack/react-query';
import { updateRiderStatus } from '@/services/rider-api';
import { useRiderStore } from '@/store/rider-store';
import { syncGpsWithAvailability } from '@/services/gps-service';
import type { RiderAvailability } from '@/types/rider';

export function useRiderStatusMutation() {
  const { setAvailability, setToggling, availability } = useRiderStore();

  return useMutation({
    mutationFn: (status: RiderAvailability) => updateRiderStatus(status),
    onMutate: (status) => {
      setToggling(true);
      const prev = availability;
      setAvailability(status);
      syncGpsWithAvailability();
      return { prev };
    },
    onError: (_e, _s, ctx) => {
      if (ctx?.prev) setAvailability(ctx.prev);
      syncGpsWithAvailability();
    },
    onSuccess: (data) => {
      setAvailability(data.status);
      syncGpsWithAvailability();
    },
    onSettled: () => setToggling(false),
  });
}
