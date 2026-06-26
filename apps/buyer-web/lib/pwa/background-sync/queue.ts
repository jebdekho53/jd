'use client';

import type { BackgroundSyncJob, BackgroundSyncKind } from './types';

const DB_NAME = 'jebdekho-pwa-sync';
const STORE = 'jobs';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function enqueueSyncJob(kind: BackgroundSyncKind, payload: unknown): Promise<void> {
  const job: BackgroundSyncJob = {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  };
  await withStore('readwrite', (s) => s.put(job));
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const reg = await navigator.serviceWorker.ready;
    try {
      await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(`jebdekho-${kind}`);
    } catch {
      /* Background Sync API not available */
    }
  }
}

export async function listSyncJobs(): Promise<BackgroundSyncJob[]> {
  return withStore('readonly', (s) => s.getAll());
}

export async function removeSyncJob(id: string): Promise<void> {
  await withStore('readwrite', (s) => s.delete(id));
}

export async function flushSyncQueue(
  handlers: Partial<Record<BackgroundSyncKind, (payload: unknown) => Promise<void>>>,
): Promise<void> {
  const jobs = await listSyncJobs();
  for (const job of jobs.sort((a, b) => a.createdAt - b.createdAt)) {
    const handler = handlers[job.kind];
    if (!handler) continue;
    try {
      await handler(job.payload);
      await removeSyncJob(job.id);
    } catch {
      /* retry on next online / sync event */
    }
  }
}
