'use client';

import { useEffect, useRef, useState } from 'react';
import { getConnection, type ConnectionStatus, type EventHandler } from './connection';
import { scopeKey, type RealtimeEnvelope, type RealtimeNamespace, type RoomScope } from './contract';
import { createBffTokenProvider, type TokenProvider } from './token-provider';

export interface UseRealtimeOptions {
  namespace: RealtimeNamespace;
  /** Rooms to join. Re-joined automatically after a reconnect. */
  scopes?: RoomScope[];
  /** Event name → handler. Handlers may change every render; they are not deps. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on?: Record<string, (payload: any) => void>;
  /** Skip connecting entirely (e.g. while an id is still loading). */
  enabled?: boolean;
  /** Socket.IO origin. Defaults to `NEXT_PUBLIC_WS_URL`. */
  url?: string;
  /** Override the token source. Defaults to the app's `/api/auth/ws-token`. */
  getToken?: TokenProvider;
}

export interface UseRealtimeResult {
  status: ConnectionStatus;
  /** True only while a live socket is up — callers fall back to polling otherwise. */
  connected: boolean;
}

let defaultTokenProvider: TokenProvider | null = null;
function sharedTokenProvider(): TokenProvider {
  defaultTokenProvider ??= createBffTokenProvider();
  return defaultTokenProvider;
}

function resolveUrl(explicit?: string): string {
  return explicit ?? process.env.NEXT_PUBLIC_WS_URL ?? 'wss://api.jebdekho.com';
}

/**
 * Subscribes to a set of rooms on a namespace for the lifetime of the component.
 *
 * Handlers are read through a ref, so passing inline arrow functions does not
 * tear down and rebuild the subscription on every render — a mistake that turns
 * a live socket into a reconnect loop.
 */
export function useRealtime(options: UseRealtimeOptions): UseRealtimeResult {
  const { namespace, scopes, on, enabled = true, url, getToken } = options;

  const [status, setStatus] = useState<ConnectionStatus>('idle');

  const handlersRef = useRef(on);
  handlersRef.current = on;

  // Serialize the scopes so the effect re-runs when the *rooms* change, not
  // when the caller happens to build a new array with the same contents. Same
  // for the set of event names — their handlers are read via ref, but adding a
  // new name has to bind a new listener.
  const scopesKey = (scopes ?? []).map(scopeKey).sort().join('|');
  const eventsKey = Object.keys(on ?? {}).sort().join('|');

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }
    if (typeof window === 'undefined') return;

    const conn = getConnection(namespace, {
      url: resolveUrl(url),
      getToken: getToken ?? sharedTokenProvider(),
    });

    conn.acquire();
    const offStatus = conn.onStatus(setStatus);

    const activeScopes = scopes ?? [];
    for (const scope of activeScopes) conn.subscribe(scope);

    // Bind one stable trampoline per event; it reads the latest handler at call
    // time, so re-renders never re-register listeners.
    const offHandlers = Object.keys(handlersRef.current ?? {}).map((event) => {
      const trampoline: EventHandler = (payload: RealtimeEnvelope) => {
        handlersRef.current?.[event]?.(payload);
      };
      return conn.on(event, trampoline);
    });

    return () => {
      for (const off of offHandlers) off();
      for (const scope of activeScopes) conn.unsubscribe(scope);
      offStatus();
      conn.release();
    };
    // `on` and `scopes` are intentionally excluded — their identities change
    // every render; `eventsKey`/`scopesKey` capture what actually matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, scopesKey, eventsKey, enabled, url, getToken]);

  return { status, connected: status === 'connected' };
}
