import { getBffBaseUrl, getAccessToken } from '@/lib/auth/session';
import { useRiderStore } from '@/store/rider-store';
import { log } from '@/services/logger';

export type SocketEvent =
  | { type: 'order.assigned'; orderId: string }
  | { type: 'order.cancelled'; orderId: string }
  | { type: 'order.updated'; orderId: string }
  | { type: 'rider.location.request' }
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'pong' };

type Listener = (event: SocketEvent) => void;

export interface SocketPollHandlers {
  pollOrders: () => void | Promise<void>;
  pollActiveOrder: (orderId: string) => void | Promise<void>;
}

const RECONNECT_DELAYS = [1_000, 2_000, 4_000, 8_000, 30_000];
const HEARTBEAT_MS = 15_000;
const STALE_MS = 60_000;
const ORDERS_POLL_MS = 15_000;
const DETAIL_POLL_MS = 30_000;

let ws: WebSocket | null = null;
let listeners = new Set<Listener>();
let ordersPollTimer: ReturnType<typeof setInterval> | null = null;
let detailPollTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let staleTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let lastEventAt = Date.now();
let pollingMode = false;
let handlers: SocketPollHandlers | null = null;
let intentionalClose = false;

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;

export function subscribeSocket(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: SocketEvent) {
  lastEventAt = Date.now();
  listeners.forEach((l) => l(event));
  if (event.type !== 'pong') {
    log('SOCKET_EVENT', event.type, event as unknown as Record<string, unknown>);
  }
}

function resetStaleTimer() {
  if (staleTimer) clearTimeout(staleTimer);
  staleTimer = setTimeout(() => {
    if (Date.now() - lastEventAt >= STALE_MS) {
      log('SOCKET_EVENT', 'Stale socket — reconnecting');
      ws?.close();
    }
  }, STALE_MS + 500);
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, HEARTBEAT_MS);
  resetStaleTimer();
}

function stopHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  if (staleTimer) clearTimeout(staleTimer);
  staleTimer = null;
}

function startPolling() {
  if (!handlers) return;
  if (pollingMode) return;
  pollingMode = true;
  log('SOCKET_EVENT', 'Switched to polling mode');

  if (!ordersPollTimer) {
    void handlers.pollOrders();
    ordersPollTimer = setInterval(() => {
      void handlers?.pollOrders();
    }, ORDERS_POLL_MS);
  }

  if (!detailPollTimer) {
    detailPollTimer = setInterval(() => {
      const activeId = useRiderStore.getState().activeDeliveryId;
      if (activeId) void handlers?.pollActiveOrder(activeId);
    }, DETAIL_POLL_MS);
  }
}

function stopPolling() {
  pollingMode = false;
  if (ordersPollTimer) clearInterval(ordersPollTimer);
  if (detailPollTimer) clearInterval(detailPollTimer);
  ordersPollTimer = null;
  detailPollTimer = null;
}

function scheduleReconnect() {
  if (intentionalClose || !handlers) return;
  const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
  reconnectAttempt++;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    void openSocket();
  }, delay);
  startPolling();
}

async function openSocket() {
  const token = await getAccessToken();
  const base = getBffBaseUrl().replace(/^http/, 'ws');
  const url = WS_URL ?? `${base}/api/rider/ws?token=${token ?? ''}`;

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectAttempt = 0;
      emit({ type: 'connected' });
      stopPolling();
      startHeartbeat();
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(String(msg.data)) as SocketEvent & { type: string };
        if (data.type === 'pong') {
          emit({ type: 'pong' });
          return;
        }
        emit(data);
        resetStaleTimer();
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      stopHeartbeat();
      emit({ type: 'disconnected' });
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch {
    scheduleReconnect();
  }
}

export async function connectSocket(pollHandlers: SocketPollHandlers) {
  intentionalClose = false;
  handlers = pollHandlers;

  const base = getBffBaseUrl();
  if (!WS_URL && !base.includes('127.0.0.1')) {
    startPolling();
    return;
  }

  await openSocket();
}

export function disconnectSocket() {
  intentionalClose = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  stopHeartbeat();
  stopPolling();
  ws?.close();
  ws = null;
  handlers = null;
}

export function isPollingMode(): boolean {
  return pollingMode;
}
