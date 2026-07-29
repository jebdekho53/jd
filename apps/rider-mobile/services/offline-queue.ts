import AsyncStorage from '@react-native-async-storage/async-storage';
import { uid } from '@/lib/uid';
import { useSyncStore } from '@/store/sync-store';
import { log } from '@/services/logger';

const QUEUE_KEY = 'jd_rider_offline_queue';
const DEAD_LETTER_KEY = 'jd_rider_offline_dead_letter';

const BACKOFF_MS = [1_000, 2_000, 5_000, 10_000];
const MAX_RETRIES = 5;

export type OfflineQueueItem =
  | {
      id: string;
      type: 'location';
      payload: Record<string, unknown>;
      createdAt: string;
      retryCount: number;
      nextRetryAt: string | null;
    }
  | {
      id: string;
      type: 'status';
      orderId: string;
      action: string;
      payload?: Record<string, unknown>;
      createdAt: string;
      retryCount: number;
      nextRetryAt: string | null;
    };

export type DeadLetterItem = OfflineQueueItem & { failedAt: string };

type OfflineQueueInput =
  | { type: 'location'; payload: Record<string, unknown> }
  | { type: 'status'; orderId: string; action: string; payload?: Record<string, unknown> };

let memoryQueue: OfflineQueueItem[] = [];
let memoryDeadLetter: DeadLetterItem[] = [];
let retryTimer: ReturnType<typeof setInterval> | null = null;

function backoffDelay(retryCount: number): number {
  return BACKOFF_MS[Math.min(retryCount, BACKOFF_MS.length - 1)];
}

async function updateStats() {
  const [queue, dead] = await Promise.all([loadOfflineQueue(), loadDeadLetterQueue()]);
  useSyncStore.getState().setStats(queue.length, dead.length);
}

export async function loadOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return memoryQueue;
    memoryQueue = JSON.parse(raw) as OfflineQueueItem[];
    return memoryQueue;
  } catch {
    return memoryQueue;
  }
}

export async function loadDeadLetterQueue(): Promise<DeadLetterItem[]> {
  try {
    const raw = await AsyncStorage.getItem(DEAD_LETTER_KEY);
    if (!raw) return memoryDeadLetter;
    memoryDeadLetter = JSON.parse(raw) as DeadLetterItem[];
    return memoryDeadLetter;
  } catch {
    return memoryDeadLetter;
  }
}

async function persist(queue: OfflineQueueItem[]) {
  memoryQueue = queue;
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* memory fallback */
  }
  void updateStats();
}

async function persistDeadLetter(dead: DeadLetterItem[]) {
  memoryDeadLetter = dead;
  try {
    await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(dead));
  } catch {
    /* memory fallback */
  }
  void updateStats();
}

export async function enqueueOffline(item: OfflineQueueInput) {
  const queue = await loadOfflineQueue();
  const entry = {
    ...item,
    id: uid(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
    nextRetryAt: null,
  } as OfflineQueueItem;
  queue.push(entry);
  await persist(queue);
  log('OFFLINE_SYNC', 'Enqueued offline item', { type: item.type });
  return entry.id;
}

export async function flushOfflineQueue(
  processor: (item: OfflineQueueItem) => Promise<void>,
): Promise<number> {
  const syncStore = useSyncStore.getState();
  syncStore.setSyncing(true);

  try {
    const queue = await loadOfflineQueue();
    const deadLetter = await loadDeadLetterQueue();
    const now = Date.now();
    let flushed = 0;
    const remaining: OfflineQueueItem[] = [];

    for (const item of queue) {
      if (item.nextRetryAt && new Date(item.nextRetryAt).getTime() > now) {
        remaining.push(item);
        continue;
      }

      try {
        await processor(item);
        flushed++;
        log('OFFLINE_SYNC', 'Flushed offline item', { id: item.id, type: item.type });
      } catch {
        const nextCount = item.retryCount + 1;
        if (nextCount >= MAX_RETRIES) {
          deadLetter.push({ ...item, failedAt: new Date().toISOString() });
          log('OFFLINE_SYNC', 'Moved item to dead letter', { id: item.id, type: item.type });
        } else {
          remaining.push({
            ...item,
            retryCount: nextCount,
            nextRetryAt: new Date(now + backoffDelay(nextCount - 1)).toISOString(),
          });
        }
      }
    }

    await persist(remaining);
    await persistDeadLetter(deadLetter);

    if (flushed > 0) {
      syncStore.setLastSync(new Date().toISOString());
    }

    return flushed;
  } finally {
    syncStore.setSyncing(false);
    void updateStats();
  }
}

export async function clearOfflineQueue() {
  await persist([]);
}

export function startOfflineRetryLoop(
  processor: (item: OfflineQueueItem) => Promise<void>,
) {
  if (retryTimer) return;
  retryTimer = setInterval(() => {
    void flushOfflineQueue(processor);
  }, 5_000);
}

export function stopOfflineRetryLoop() {
  if (retryTimer) clearInterval(retryTimer);
  retryTimer = null;
}

export async function getQueueStats() {
  const [pending, dead] = await Promise.all([loadOfflineQueue(), loadDeadLetterQueue()]);
  return { pending: pending.length, deadLetter: dead.length };
}
