import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'jd_request_locks';
const COOLDOWN_MS = 5_000;

type LockMap = Record<string, number>;

let memoryLocks: LockMap = {};

async function loadLocks(): Promise<LockMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryLocks;
    memoryLocks = JSON.parse(raw) as LockMap;
    return memoryLocks;
  } catch {
    return memoryLocks;
  }
}

async function saveLocks(locks: LockMap) {
  memoryLocks = locks;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locks));
  } catch {
    /* memory fallback */
  }
}

function lockKey(orderId: string, action: string): string {
  return `${orderId}:${action}`;
}

export async function isRequestLocked(orderId: string, action: string): Promise<boolean> {
  const locks = await loadLocks();
  const expires = locks[lockKey(orderId, action)];
  if (!expires) return false;
  if (Date.now() > expires) {
    delete locks[lockKey(orderId, action)];
    await saveLocks(locks);
    return false;
  }
  return true;
}

export async function acquireRequestLock(orderId: string, action: string): Promise<boolean> {
  if (await isRequestLocked(orderId, action)) return false;
  const locks = await loadLocks();
  locks[lockKey(orderId, action)] = Date.now() + COOLDOWN_MS;
  await saveLocks(locks);
  return true;
}

export async function releaseRequestLock(orderId: string, action: string): Promise<void> {
  const locks = await loadLocks();
  delete locks[lockKey(orderId, action)];
  await saveLocks(locks);
}

export class RequestLockError extends Error {
  constructor(message = 'Action already in progress — please wait') {
    super(message);
    this.name = 'RequestLockError';
  }
}

export async function withRequestLock<T>(
  orderId: string,
  action: string,
  fn: () => Promise<T>,
): Promise<T> {
  const acquired = await acquireRequestLock(orderId, action);
  if (!acquired) throw new RequestLockError();
  try {
    return await fn();
  } finally {
    await releaseRequestLock(orderId, action);
  }
}
