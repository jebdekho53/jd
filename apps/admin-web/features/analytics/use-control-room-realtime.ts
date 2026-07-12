'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ANALYTICS_EVENTS,
  REALTIME_NAMESPACES,
  useRealtime,
  type RoomScope,
} from '@jebdekho/realtime';
import { analyticsKeys } from '@/hooks/use-analytics';

const CONTROL_ROOM_SCOPES: RoomScope[] = [{ type: 'control-room' }];

/**
 * The `/analytics` gateway pushes the whole control-room document — on join and
 * then once per cron tick — so the payload is written straight into the cache
 * rather than used as a refetch trigger. That keeps the board updating without
 * an HTTP request per tick.
 */
export function useControlRoomRealtime(): { connected: boolean } {
  const qc = useQueryClient();

  const onUpdate = useCallback(
    (payload: unknown) => {
      qc.setQueryData(analyticsKeys.controlRoom(), payload);
    },
    [qc],
  );

  const { connected } = useRealtime({
    namespace: REALTIME_NAMESPACES.analytics,
    scopes: CONTROL_ROOM_SCOPES,
    on: { [ANALYTICS_EVENTS.CONTROL_ROOM_UPDATED]: onUpdate },
  });

  return { connected };
}
