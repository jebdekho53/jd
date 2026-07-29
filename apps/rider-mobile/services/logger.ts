import { uid } from '@/lib/uid';
import { postLogBatch } from '@/services/log-api';

export type LogCategory =
  | 'GPS_UPDATE'
  | 'ORDER_STATE_CHANGE'
  | 'SOCKET_EVENT'
  | 'OFFLINE_SYNC'
  | 'ERROR'
  | 'PERFORMANCE';

export interface LogEntry {
  id: string;
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

const buffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

export function log(
  category: LogCategory,
  message: string,
  data?: Record<string, unknown>,
) {
  buffer.push({
    id: uid(),
    category,
    message,
    data,
    timestamp: new Date().toISOString(),
  });

  if (buffer.length > 200) {
    void flushLogs();
  }
}

export async function flushLogs(): Promise<number> {
  if (buffer.length === 0) return 0;
  const batch = buffer.splice(0, buffer.length);
  try {
    await postLogBatch(batch);
    return batch.length;
  } catch {
    buffer.unshift(...batch.slice(0, 50));
    return 0;
  }
}

export function startLogFlusher() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    void flushLogs();
  }, 30_000);
}

export function stopLogFlusher() {
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = null;
}
