'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptOrder,
  arrivedCustomer,
  arrivedStore,
  getMe,
  getTodayEarnings,
  listOrders,
  logout,
  markDelivered,
  markFailed,
  pickedUp,
  pushLocation,
  rejectOrder,
  setStatus,
  type RiderOrder,
  type RiderStatus,
} from '@/lib/api';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Next forward action for a delivery, based on its status. */
function nextAction(status: string): { verb: string; label: string } | null {
  switch (status) {
    case 'PENDING':
    case 'ASSIGNED':
    case 'OFFERED':
      return { verb: 'accept', label: 'Accept order' };
    case 'ACCEPTED':
      return { verb: 'arrived-store', label: 'Arrived at store' };
    case 'ARRIVED_AT_STORE':
      return { verb: 'picked-up', label: 'Picked up' };
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return { verb: 'arrived-customer', label: 'Arrived at customer' };
    case 'ARRIVED_AT_CUSTOMER':
      return { verb: 'delivered', label: 'Mark delivered' };
    default:
      return null;
  }
}

function mapsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function RiderHome({ onLoggedOut }: { onLoggedOut: () => void }) {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe });
  const orders = useQuery({ queryKey: ['rider', 'orders'], queryFn: listOrders, refetchInterval: 15_000 });
  const earnings = useQuery({ queryKey: ['rider', 'earnings', 'today'], queryFn: getTodayEarnings });

  const [online, setOnline] = useState(false);
  useEffect(() => {
    if (me.data?.profile.status) setOnline(me.data.profile.status !== 'OFFLINE');
  }, [me.data?.profile.status]);

  const statusMut = useMutation({
    mutationFn: (s: RiderStatus) => setStatus(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'me'] }),
  });

  const act = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: string }) => {
      const map: Record<string, (i: string) => Promise<unknown>> = {
        accept: acceptOrder,
        'arrived-store': arrivedStore,
        'picked-up': pickedUp,
        'arrived-customer': arrivedCustomer,
        delivered: markDelivered,
      };
      return map[verb](id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider', 'orders'] });
      qc.invalidateQueries({ queryKey: ['rider', 'earnings', 'today'] });
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectOrder(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'orders'] }),
  });
  const fail = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => markFailed(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'orders'] }),
  });

  // Push GPS to the API while online, so the customer sees live tracking.
  const watchRef = useRef<number | null>(null);
  useEffect(() => {
    if (!online || typeof navigator === 'undefined' || !navigator.geolocation) return;
    let last = 0;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - last < 10_000) return; // throttle to ~every 10s
        last = now;
        void pushLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [online]);

  const toggleOnline = () => {
    const next = online ? 'OFFLINE' : 'ONLINE';
    setOnline(!online);
    statusMut.mutate(next);
  };

  const doLogout = async () => {
    await logout().catch(() => {});
    onLoggedOut();
  };

  if (me.isLoading) {
    return <div className="grid min-h-screen place-items-center text-slate-500">Loading…</div>;
  }
  if (me.isError) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center text-slate-600">
        <div>
          <p>Session expired.</p>
          <button onClick={onLoggedOut} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-white">
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  const kyc = me.data?.profile.kycStatus;
  const list = orders.data ?? [];

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-100 pb-10">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Rider</p>
            <p className="font-semibold">+91 {me.data?.user.phone.replace(/\D/g, '').slice(-10)}</p>
          </div>
          <button onClick={doLogout} className="text-xs text-slate-400 underline">
            Sign out
          </button>
        </div>
        <button
          onClick={toggleOnline}
          disabled={statusMut.isPending || kyc !== 'APPROVED'}
          className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-60 ${
            online ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-white' : 'bg-slate-500'}`} />
          {online ? 'You are Online' : 'Go Online'}
        </button>
      </header>

      <div className="space-y-4 p-4">
        {kyc !== 'APPROVED' && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            Your KYC is <b>{kyc}</b>. You can go online and receive orders once approved.
          </div>
        )}

        {/* Today's earnings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Today&apos;s earnings</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{inr(earnings.data?.amount ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Deliveries</p>
            <p className="mt-1 text-2xl font-bold">{earnings.data?.deliveries ?? 0}</p>
          </div>
        </div>

        {/* Orders */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Your orders {list.length > 0 && `(${list.length})`}
          </p>
          {orders.isLoading ? (
            <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">Loading orders…</p>
          ) : list.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
              {online ? 'No orders right now. Stay online — new orders will appear here.' : 'Go online to receive orders.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((o) => (
                <OrderCard
                  key={o.deliveryId}
                  order={o}
                  busy={act.isPending || reject.isPending || fail.isPending}
                  onAct={(verb) => act.mutate({ id: o.deliveryId, verb })}
                  onReject={() => reject.mutate({ id: o.deliveryId, reason: 'Declined by rider' })}
                  onFail={() => {
                    const reason = window.prompt('Reason for failed delivery?') ?? '';
                    if (reason.trim()) fail.mutate({ id: o.deliveryId, reason: reason.trim() });
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  busy,
  onAct,
  onReject,
  onFail,
}: {
  order: RiderOrder;
  busy: boolean;
  onAct: (verb: string) => void;
  onReject: () => void;
  onFail: () => void;
}) {
  const action = nextAction(order.deliveryStatus);
  const isNew = ['PENDING', 'ASSIGNED', 'OFFERED'].includes(order.deliveryStatus);
  const isCod = order.paymentMethod?.toUpperCase() === 'COD';
  const dropoff = order.deliveryStatus === 'PICKED_UP' || order.deliveryStatus === 'IN_TRANSIT' || order.deliveryStatus === 'ARRIVED_AT_CUSTOMER';
  const navTarget = dropoff ? { lat: order.customerLat, lng: order.customerLng } : { lat: order.storeLat, lng: order.storeLng };

  return (
    <li className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="font-semibold">#{order.orderNumber}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {order.deliveryStatus.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="space-y-2 p-4 text-sm">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-emerald-600">●</span>
          <div>
            <p className="font-medium">Pickup — {order.storeName}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-red-500">●</span>
          <div>
            <p className="font-medium">Drop — {order.customerArea}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-500">
            {isCod ? <b className="text-slate-900">Collect {inr(order.totalAmount)} (COD)</b> : 'Prepaid'}
          </span>
          {order.riderEarning != null && (
            <span className="font-semibold text-emerald-600">You earn {inr(order.riderEarning)}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t p-3">
        <a
          href={mapsHref(navTarget.lat, navTarget.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium"
        >
          Navigate
        </a>
        {isNew ? (
          <>
            <button
              onClick={onReject}
              disabled={busy}
              className="h-11 flex-1 rounded-lg bg-slate-100 text-sm font-medium text-red-600 disabled:opacity-60"
            >
              Decline
            </button>
            <button
              onClick={() => onAct('accept')}
              disabled={busy}
              className="h-11 flex-[1.5] rounded-lg bg-emerald-500 text-sm font-semibold text-white disabled:opacity-60"
            >
              Accept
            </button>
          </>
        ) : action ? (
          <>
            {order.deliveryStatus === 'ARRIVED_AT_CUSTOMER' && (
              <button
                onClick={onFail}
                disabled={busy}
                className="h-11 flex-1 rounded-lg bg-slate-100 text-sm font-medium text-red-600 disabled:opacity-60"
              >
                Failed
              </button>
            )}
            <button
              onClick={() => onAct(action.verb)}
              disabled={busy}
              className="h-11 flex-[2] rounded-lg bg-slate-900 text-sm font-semibold text-white disabled:opacity-60"
            >
              {action.label}
            </button>
          </>
        ) : (
          <span className="flex h-11 flex-[2] items-center justify-center rounded-lg bg-emerald-50 text-sm font-medium text-emerald-700">
            {order.deliveryStatus === 'DELIVERED' ? 'Delivered ✓' : order.deliveryStatus.replace(/_/g, ' ')}
          </span>
        )}
      </div>
    </li>
  );
}
