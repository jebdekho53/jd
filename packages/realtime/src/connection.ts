import type { Socket } from 'socket.io-client';
import { scopeKey, type RealtimeEnvelope, type RealtimeNamespace, type RoomScope } from './contract';
import { RealtimeUnauthorizedError, type TokenProvider } from './token-provider';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'unauthorized' | 'offline';

export type StatusListener = (status: ConnectionStatus) => void;
export type EventHandler<T extends RealtimeEnvelope = RealtimeEnvelope> = (payload: T) => void;

export interface ConnectionConfig {
  /** Socket.IO origin, e.g. `wss://api.jebdekho.com`. */
  url: string;
  getToken: TokenProvider;
}

type RawHandler = (...args: unknown[]) => void;

/**
 * One Socket.IO connection per namespace, shared by every hook on the page and
 * reference-counted so the last hook to unmount closes it.
 *
 * Two things the naive per-component `io()` call gets wrong, both fixed here:
 *
 * 1. Rooms live on the server keyed by socket id, which changes on reconnect —
 *    so subscriptions are replayed on every `connect`, not just the first.
 * 2. Handlers are held in a registry rather than bound straight to a socket
 *    instance, so they survive the socket being torn down and rebuilt.
 */
class NamespaceConnection {
  private socket: Socket | null = null;
  private connecting: Promise<Socket> | null = null;
  private refs = 0;
  private status: ConnectionStatus = 'idle';

  private readonly scopes = new Map<string, { scope: RoomScope; refs: number }>();
  private readonly handlers = new Map<string, Set<RawHandler>>();
  private readonly statusListeners = new Set<StatusListener>();

  constructor(
    private readonly namespace: RealtimeNamespace,
    private readonly config: ConnectionConfig,
  ) {}

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(next: ConnectionStatus): void {
    if (this.status === next) return;
    this.status = next;
    for (const listener of this.statusListeners) listener(next);
  }

  acquire(): void {
    this.refs += 1;
    if (this.socket || this.connecting) return;
    void this.open();
  }

  release(): void {
    this.refs -= 1;
    if (this.refs > 0) return;

    this.socket?.disconnect();
    this.socket = null;
    this.connecting = null;
    this.scopes.clear();
    this.setStatus('idle');
  }

  private async open(): Promise<Socket> {
    this.setStatus('connecting');

    this.connecting = (async () => {
      const { io } = await import('socket.io-client');

      const socket = io(`${this.config.url.replace(/\/$/, '')}${this.namespace}`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 10_000,
        // Invoked before *every* connection attempt, so each reconnect carries a
        // token valid right now rather than the one we happened to boot with.
        // A static token here is what makes a socket die permanently at expiry.
        auth: (cb: (data: { token?: string }) => void) => {
          this.config
            .getToken()
            .then((token) => cb({ token }))
            .catch((err: unknown) => {
              if (err instanceof RealtimeUnauthorizedError) {
                // Session is gone — retrying cannot help. Stand down and let the
                // app decide whether to redirect to login.
                this.setStatus('unauthorized');
                this.socket?.disconnect();
                return;
              }
              // Transient failure (network, 500). Send no token so the server
              // rejects this attempt and Socket.IO backs off into another one.
              cb({});
            });
        },
      });

      socket.on('connect', () => {
        this.setStatus('connected');
        this.resubscribeAll();
      });
      socket.on('disconnect', () => {
        if (this.status !== 'unauthorized') this.setStatus('offline');
      });
      socket.on('connect_error', () => {
        if (this.status !== 'unauthorized') this.setStatus('offline');
      });

      // Re-attach everything registered while the socket was being built.
      for (const [event, set] of this.handlers) {
        for (const handler of set) socket.on(event, handler);
      }

      this.socket = socket;
      this.connecting = null;
      return socket;
    })();

    return this.connecting;
  }

  private resubscribeAll(): void {
    for (const { scope } of this.scopes.values()) {
      this.socket?.emit('subscribe', scope);
    }
  }

  subscribe(scope: RoomScope): void {
    const key = scopeKey(scope);
    const existing = this.scopes.get(key);

    if (existing) {
      existing.refs += 1;
      return;
    }

    this.scopes.set(key, { scope, refs: 1 });
    if (this.socket?.connected) this.socket.emit('subscribe', scope);
  }

  unsubscribe(scope: RoomScope): void {
    const key = scopeKey(scope);
    const existing = this.scopes.get(key);
    if (!existing) return;

    existing.refs -= 1;
    if (existing.refs > 0) return;

    this.scopes.delete(key);
    if (this.socket?.connected) this.socket.emit('unsubscribe', scope);
  }

  on(event: string, handler: EventHandler): () => void {
    const raw = handler as RawHandler;

    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(raw);
    this.socket?.on(event, raw);

    return () => {
      set.delete(raw);
      if (set.size === 0) this.handlers.delete(event);
      this.socket?.off(event, raw);
    };
  }
}

const connections = new Map<string, NamespaceConnection>();

export function getConnection(
  namespace: RealtimeNamespace,
  config: ConnectionConfig,
): NamespaceConnection {
  let conn = connections.get(namespace);
  if (!conn) {
    conn = new NamespaceConnection(namespace, config);
    connections.set(namespace, conn);
  }
  return conn;
}

/** Test seam — drops every cached connection. */
export function resetConnections(): void {
  connections.clear();
}

export type { NamespaceConnection };
