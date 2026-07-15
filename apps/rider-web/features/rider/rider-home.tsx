'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptOrder,
  arrivedCustomer,
  arrivedStore,
  createSupportTicket,
  getEarnings,
  getMe,
  getOrder,
  getPendingCod,
  getSupportTicket,
  listOrders,
  listSupportArticles,
  listSupportTickets,
  logout,
  markDelivered,
  markFailed,
  pickedUp,
  pushLocation,
  rejectOrder,
  replySupportTicket,
  setStatus,
  submitCod,
  type KycStatus,
  type RiderMe,
  type RiderOrder,
  type RiderStatus,
} from '@/lib/api';
import { RiderBankAccountScreen } from './rider-bank-account';

type Tab = 'home' | 'orders' | 'earnings' | 'support' | 'account';
type GpsState = 'idle' | 'watching' | 'denied' | 'unavailable' | 'weak';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function mapsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function pretty(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function nextAction(status: string): { verb: string; label: string } | null {
  switch (status) {
    case 'PENDING':
    case 'ASSIGNED':
    case 'OFFERED':
      return { verb: 'accept', label: 'Accept' };
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

function isActive(order: RiderOrder) {
  return !['DELIVERED', 'FAILED', 'CANCELLED', 'REJECTED'].includes(order.deliveryStatus);
}

export function RiderHome({
  onLoggedOut,
  initialTab = 'home',
  initialOrderId = null,
  initialTicketId = null,
}: {
  onLoggedOut: () => void;
  initialTab?: Tab;
  initialOrderId?: string | null;
  initialTicketId?: string | null;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [bankOpen, setBankOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTicketId);
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe });
  const orders = useQuery({ queryKey: ['rider', 'orders'], queryFn: listOrders, refetchInterval: 15_000 });
  const earnings = useQuery({ queryKey: ['rider', 'finance', 'earnings'], queryFn: getEarnings });
  const cod = useQuery({ queryKey: ['rider', 'finance', 'cod'], queryFn: getPendingCod });

  const profile = me.data?.profile;
  const approved = profile?.kycStatus === 'APPROVED';
  const online = profile ? profile.status !== 'OFFLINE' : false;
  const activeOrders = (orders.data ?? []).filter(isActive);
  const currentOrder = activeOrders[0] ?? null;

  const statusMut = useMutation({
    mutationFn: (s: RiderStatus) => setStatus(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'me'] }),
  });

  const actionMut = useMutation({
    mutationFn: ({ orderId, verb }: { orderId: string; verb: string }) => {
      const map: Record<string, (id: string) => Promise<unknown>> = {
        accept: acceptOrder,
        'arrived-store': arrivedStore,
        'picked-up': pickedUp,
        'arrived-customer': arrivedCustomer,
        delivered: markDelivered,
      };
      return map[verb](orderId);
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['rider', 'orders'] }),
        qc.invalidateQueries({ queryKey: ['rider', 'order'] }),
        qc.invalidateQueries({ queryKey: ['rider', 'me'] }),
        qc.invalidateQueries({ queryKey: ['rider', 'finance'] }),
      ]);
    },
  });

  const rejectMut = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => rejectOrder(orderId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'orders'] }),
  });

  const failMut = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => markFailed(orderId, reason),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['rider', 'orders'] }),
        qc.invalidateQueries({ queryKey: ['rider', 'me'] }),
      ]);
    },
  });

  const watchRef = useRef<number | null>(null);
  useEffect(() => {
    if (!online || !approved || typeof navigator === 'undefined') return;
    if (!navigator.geolocation) {
      setGpsState('unavailable');
      setGpsMessage('GPS is not available on this device.');
      return;
    }

    let lastSent = 0;
    setGpsState('watching');
    setGpsMessage(null);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy > 200) {
          setGpsState('weak');
          setGpsMessage('GPS signal is weak. Move to an open area.');
          return;
        }
        const now = Date.now();
        if (now - lastSent < 10_000) return;
        lastSent = now;
        setGpsState('watching');
        setGpsMessage(null);
        void pushLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined,
          accuracy: pos.coords.accuracy,
        }).catch((err) => {
          setGpsState('weak');
          setGpsMessage(err instanceof Error ? err.message : 'Location update failed.');
        });
      },
      (err) => {
        setGpsState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
        setGpsMessage(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setGpsState('idle');
    };
  }, [approved, online]);

  const doLogout = async () => {
    await logout().catch(() => {});
    onLoggedOut();
  };

  if (me.isLoading) {
    return <FullScreenNote title="Loading rider app" body="Checking your session and rider profile." />;
  }

  if (me.isError || !me.data) {
    return (
      <FullScreenNote title="Session expired" body="Please sign in again.">
        <button onClick={onLoggedOut} className="mt-4 h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white">
          Sign in
        </button>
      </FullScreenNote>
    );
  }

  if (bankOpen) return <RiderBankAccountScreen onBack={() => setBankOpen(false)} />;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-100 pb-24 text-slate-950">
      <header className="sticky top-0 z-20 bg-slate-950 px-4 pb-4 pt-3 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">JebDekho Rider</p>
            <p className="truncate text-lg font-semibold">{profile?.name ?? me.data.user.phone}</p>
          </div>
          <StatusToggle
            online={online}
            approved={approved}
            busy={statusMut.isPending}
            onToggle={() => statusMut.mutate(online ? 'OFFLINE' : 'ONLINE')}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Today" value={inr(earnings.data?.today ?? 0)} dark />
          <Metric label="Orders" value={String(profile?.totalDeliveries ?? 0)} dark />
          <Metric label="KYC" value={pretty(profile?.kycStatus ?? 'PENDING')} dark />
        </div>
      </header>

      <section className="p-4">
        {profile?.kycStatus !== 'APPROVED' && <KycBanner status={profile?.kycStatus ?? 'PENDING'} />}
        {cod.data && cod.data.totalToDeposit > 0 && (
          <button
            onClick={() => setTab('earnings')}
            className="mb-3 w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900"
          >
            COD deposit pending: <b>{inr(cod.data.totalToDeposit)}</b> across {cod.data.count} orders.
          </button>
        )}
        {gpsMessage && (
          <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            {gpsState === 'denied' ? 'Location permission denied. Enable GPS to receive live tracking.' : gpsMessage}
          </div>
        )}

        {tab === 'home' && (
          <HomeTab
            me={me.data}
            currentOrder={currentOrder}
            gpsState={gpsState}
            earningsToday={earnings.data?.today ?? 0}
            activeCount={activeOrders.length}
            onOpenOrder={(id) => {
              setSelectedOrderId(id);
              setTab('orders');
            }}
          />
        )}
        {tab === 'orders' && (
          <OrdersTab
            orders={orders.data ?? []}
            loading={orders.isLoading}
            selectedOrderId={selectedOrderId}
            setSelectedOrderId={setSelectedOrderId}
            busy={actionMut.isPending || rejectMut.isPending || failMut.isPending}
            onAction={(orderId, verb) => actionMut.mutate({ orderId, verb })}
            onReject={(orderId) => rejectMut.mutate({ orderId, reason: 'Declined by rider' })}
            onFail={(orderId, reason) => failMut.mutate({ orderId, reason })}
            onSupport={(orderId) => {
              setSelectedOrderId(orderId);
              setTab('support');
            }}
          />
        )}
        {tab === 'earnings' && (
          <EarningsTab onBank={() => setBankOpen(true)} />
        )}
        {tab === 'support' && (
          <SupportTab selectedOrderId={selectedOrderId} selectedTicketId={selectedTicketId} setSelectedTicketId={setSelectedTicketId} />
        )}
        {tab === 'account' && (
          <AccountTab me={me.data} onBank={() => setBankOpen(true)} onLogout={doLogout} />
        )}
      </section>

      <BottomTabs tab={tab} />
    </main>
  );
}

function HomeTab({
  me,
  currentOrder,
  gpsState,
  earningsToday,
  activeCount,
  onOpenOrder,
}: {
  me: RiderMe;
  currentOrder: RiderOrder | null;
  gpsState: GpsState;
  earningsToday: number;
  activeCount: number;
  onOpenOrder: (orderId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Today earnings" value={inr(earningsToday)} />
        <Metric label="Active orders" value={String(activeCount)} />
        <Metric label="GPS" value={gpsState === 'watching' ? 'Live' : pretty(gpsState)} />
        <Metric label="Rating" value={`${Number(me.profile?.ratingAvg ?? 0).toFixed(1)} (${me.profile?.ratingCount ?? 0})`} />
      </div>

      {currentOrder ? (
        <button onClick={() => onOpenOrder(currentOrder.orderId)} className="w-full text-left">
          <OrderCard order={currentOrder} compact />
        </button>
      ) : (
        <EmptyState
          title={me.profile?.status === 'OFFLINE' ? 'You are offline' : 'Waiting for orders'}
          body={me.profile?.status === 'OFFLINE' ? 'Go online when you are ready to receive delivery assignments.' : 'Stay online. New assigned orders will appear here.'}
        />
      )}
    </div>
  );
}

function OrdersTab({
  orders,
  loading,
  selectedOrderId,
  setSelectedOrderId,
  busy,
  onAction,
  onReject,
  onFail,
  onSupport,
}: {
  orders: RiderOrder[];
  loading: boolean;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  busy: boolean;
  onAction: (orderId: string, verb: string) => void;
  onReject: (orderId: string) => void;
  onFail: (orderId: string, reason: string) => void;
  onSupport: (orderId: string) => void;
}) {
  if (selectedOrderId) {
    return (
      <OrderDetail
        orderId={selectedOrderId}
        busy={busy}
        onBack={() => setSelectedOrderId(null)}
        onAction={onAction}
        onReject={onReject}
        onFail={onFail}
        onSupport={onSupport}
      />
    );
  }

  if (loading) return <EmptyState title="Loading orders" body="Fetching your assigned deliveries." />;
  if (orders.length === 0) return <EmptyState title="No assigned orders" body="Assigned deliveries will appear here as soon as dispatch sends them to you." />;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <button key={order.deliveryId} onClick={() => setSelectedOrderId(order.orderId)} className="w-full text-left">
          <OrderCard order={order} />
        </button>
      ))}
    </div>
  );
}

function OrderDetail({
  orderId,
  busy,
  onBack,
  onAction,
  onReject,
  onFail,
  onSupport,
}: {
  orderId: string;
  busy: boolean;
  onBack: () => void;
  onAction: (orderId: string, verb: string) => void;
  onReject: (orderId: string) => void;
  onFail: (orderId: string, reason: string) => void;
  onSupport: (orderId: string) => void;
}) {
  const detail = useQuery({ queryKey: ['rider', 'order', orderId], queryFn: () => getOrder(orderId) });
  const order = detail.data;

  if (detail.isLoading) return <EmptyState title="Loading order" body="Opening the delivery details." />;
  if (!order) return <EmptyState title="Order unavailable" body="This delivery could not be loaded." />;

  const action = nextAction(order.deliveryStatus);
  const dropoff = ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_CUSTOMER'].includes(order.deliveryStatus);
  const navTarget = dropoff ? { lat: order.customerLat, lng: order.customerLng } : { lat: order.storeLat, lng: order.storeLng };
  const isNew = ['PENDING', 'ASSIGNED', 'OFFERED'].includes(order.deliveryStatus);

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-sm font-semibold text-slate-600">Back to orders</button>
      <OrderCard order={order} />
      <Panel title="Route">
        <Stop label="Pickup" title={order.storeName} subtitle={order.storeAddress} />
        <Stop label="Drop" title={order.customerArea} subtitle={formatAddress(order.deliveryAddress)} />
        {order.buyerNote && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Customer note: {order.buyerNote}</p>}
        <a href={mapsHref(navTarget.lat, navTarget.lng)} target="_blank" rel="noopener noreferrer" className="block h-11 rounded-lg bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">
          Navigate
        </a>
      </Panel>
      <Panel title="Items">
        {order.items.length === 0 ? (
          <p className="text-sm text-slate-500">No item details available.</p>
        ) : (
          <ul className="space-y-2">
            {order.items.map((item, idx) => (
              <li key={`${item.name}-${idx}`} className="flex justify-between gap-3 text-sm">
                <span>{item.name}{item.variant ? ` (${item.variant})` : ''}</span>
                <b>x{item.quantity}</b>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Timeline">
        <ol className="space-y-2">
          {order.timeline.length === 0 ? <li className="text-sm text-slate-500">No timeline yet.</li> : order.timeline.map((t) => (
            <li key={`${t.status}-${t.at}`} className="flex justify-between gap-3 text-sm">
              <span>{pretty(t.status)}</span>
              <span className="text-slate-500">{new Date(t.at).toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ol>
      </Panel>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onSupport(order.orderId)} className="h-11 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700">
          Report issue
        </button>
        {isNew ? (
          <button onClick={() => onReject(order.orderId)} disabled={busy} className="h-11 rounded-lg bg-red-50 text-sm font-semibold text-red-700 disabled:opacity-50">
            Decline
          </button>
        ) : (
          <button
            onClick={() => {
              const reason = window.prompt('Reason for failed delivery?')?.trim();
              if (reason) onFail(order.orderId, reason);
            }}
            disabled={busy || ['DELIVERED', 'FAILED', 'CANCELLED'].includes(order.deliveryStatus)}
            className="h-11 rounded-lg bg-red-50 text-sm font-semibold text-red-700 disabled:opacity-50"
          >
            Failed
          </button>
        )}
      </div>
      {action && (
        <button onClick={() => onAction(order.orderId, action.verb)} disabled={busy} className="h-12 w-full rounded-lg bg-emerald-600 text-sm font-semibold text-white disabled:opacity-50">
          {action.label}
        </button>
      )}
    </div>
  );
}

function EarningsTab({ onBank }: { onBank: () => void }) {
  const earnings = useQuery({ queryKey: ['rider', 'finance', 'earnings'], queryFn: getEarnings });
  const cod = useQuery({ queryKey: ['rider', 'finance', 'cod'], queryFn: getPendingCod });
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();
  const remit = useMutation({
    mutationFn: () => {
      const data = cod.data;
      if (!data) throw new Error('No COD records loaded');
      return submitCod(data.items.map((i) => i.orderId), data.totalToDeposit, notes.trim() || undefined);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'finance', 'cod'] }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Today" value={inr(earnings.data?.today ?? 0)} />
        <Metric label="This week" value={inr(earnings.data?.thisWeek ?? 0)} />
        <Metric label="Pending payout" value={inr(earnings.data?.pendingPayout ?? 0)} />
        <Metric label="Total paid" value={inr(earnings.data?.totalPaid ?? 0)} />
      </div>
      <button onClick={onBank} className="w-full rounded-lg bg-white p-4 text-left shadow-sm">
        <p className="font-semibold">Payout account</p>
        <p className="text-sm text-slate-500">Manage bank account and UPI details.</p>
      </button>
      <Panel title="COD deposit">
        {!cod.data || cod.data.count === 0 ? (
          <p className="text-sm text-slate-500">No COD cash pending.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">Deposit <b>{inr(cod.data.totalToDeposit)}</b> for {cod.data.count} COD orders.</p>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Deposit note or reference" className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            <button onClick={() => remit.mutate()} disabled={remit.isPending} className="h-11 w-full rounded-lg bg-slate-950 text-sm font-semibold text-white disabled:opacity-50">
              {remit.isPending ? 'Submitting...' : 'Mark COD submitted'}
            </button>
          </div>
        )}
      </Panel>
      <Panel title="Recent deliveries">
        {(earnings.data?.recentDeliveries ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">Delivered orders will appear here.</p>
        ) : (
          <ul className="space-y-2">
            {earnings.data?.recentDeliveries.map((d) => (
              <li key={`${d.orderNumber}-${d.deliveredAt}`} className="flex justify-between gap-3 text-sm">
                <span>{d.orderNumber}<br /><span className="text-xs text-slate-500">{d.paymentMethod}</span></span>
                <b className="text-emerald-700">{inr(d.earning)}</b>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function SupportTab({
  selectedOrderId,
  selectedTicketId,
  setSelectedTicketId,
}: {
  selectedOrderId: string | null;
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
}) {
  const qc = useQueryClient();
  const tickets = useQuery({ queryKey: ['rider', 'support', 'tickets'], queryFn: listSupportTickets });
  const articles = useQuery({ queryKey: ['rider', 'support', 'articles'], queryFn: listSupportArticles });
  const detail = useQuery({
    queryKey: ['rider', 'support', 'ticket', selectedTicketId],
    queryFn: () => getSupportTicket(selectedTicketId!),
    enabled: Boolean(selectedTicketId),
  });
  const [form, setForm] = useState({
    categoryCode: selectedOrderId ? 'DELIVERY_DISPUTE' : 'APP_ISSUE',
    subject: selectedOrderId ? `Issue with order ${selectedOrderId}` : '',
    description: '',
  });
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (selectedOrderId) {
      setForm((f) => ({ ...f, categoryCode: 'DELIVERY_DISPUTE', subject: f.subject || `Issue with order ${selectedOrderId}` }));
    }
  }, [selectedOrderId]);

  const create = useMutation({
    mutationFn: () => createSupportTicket({ ...form, orderId: selectedOrderId ?? undefined }),
    onSuccess: async (ticket) => {
      setForm({ categoryCode: 'APP_ISSUE', subject: '', description: '' });
      setSelectedTicketId(ticket.id);
      await qc.invalidateQueries({ queryKey: ['rider', 'support', 'tickets'] });
    },
  });
  const sendReply = useMutation({
    mutationFn: () => replySupportTicket(selectedTicketId!, reply.trim()),
    onSuccess: async () => {
      setReply('');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['rider', 'support', 'ticket', selectedTicketId] }),
        qc.invalidateQueries({ queryKey: ['rider', 'support', 'tickets'] }),
      ]);
    },
  });

  if (selectedTicketId) {
    const ticket = detail.data;
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedTicketId(null)} className="text-sm font-semibold text-slate-600">Back to support</button>
        <Panel title={ticket?.ticketNumber ?? 'Ticket'}>
          {!ticket ? <p className="text-sm text-slate-500">Loading ticket...</p> : (
            <div className="space-y-3">
              <p className="font-semibold">{ticket.subject}</p>
              <p className="text-sm text-slate-600">{ticket.description}</p>
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{pretty(ticket.status)}</span>
              <div className="space-y-2">
                {(ticket.messages ?? []).map((m) => (
                  <p key={m.id} className="rounded-lg bg-slate-100 p-3 text-sm">{m.body}</p>
                ))}
              </div>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to support" className="min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm" />
              <button onClick={() => sendReply.mutate()} disabled={sendReply.isPending || reply.trim().length === 0} className="h-11 w-full rounded-lg bg-slate-950 text-sm font-semibold text-white disabled:opacity-50">
                Send reply
              </button>
            </div>
          )}
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Create ticket">
        <div className="space-y-3">
          <select value={form.categoryCode} onChange={(e) => setForm((f) => ({ ...f, categoryCode: e.target.value }))} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm">
            <option value="APP_ISSUE">App issue</option>
            <option value="DELIVERY_DISPUTE">Delivery dispute</option>
            <option value="RIDER_EARNINGS">Earnings or payout</option>
            <option value="RIDER_ACCOUNT">Account</option>
            <option value="RIDER_KYC">KYC or documents</option>
          </select>
          <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Subject" className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the issue" className="min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm" />
          <button onClick={() => create.mutate()} disabled={create.isPending || form.subject.length < 3 || form.description.length < 10} className="h-11 w-full rounded-lg bg-slate-950 text-sm font-semibold text-white disabled:opacity-50">
            Create ticket
          </button>
          {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
        </div>
      </Panel>
      <Panel title="Your tickets">
        {(tickets.data?.items ?? []).length === 0 ? <p className="text-sm text-slate-500">No tickets yet.</p> : (
          <ul className="space-y-2">
            {tickets.data?.items.map((t) => (
              <li key={t.id}>
                <button onClick={() => setSelectedTicketId(t.id)} className="w-full rounded-lg bg-slate-100 p-3 text-left">
                  <p className="font-semibold">{t.subject}</p>
                  <p className="text-xs text-slate-500">{t.ticketNumber} · {pretty(t.status)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Help articles">
        {(articles.data ?? []).length === 0 ? <p className="text-sm text-slate-500">No articles available.</p> : (
          <ul className="space-y-2">
            {articles.data?.slice(0, 5).map((a) => (
              <li key={a.id} className="rounded-lg bg-slate-100 p-3">
                <p className="font-semibold">{a.title}</p>
                {a.summary && <p className="text-sm text-slate-600">{a.summary}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function AccountTab({ me, onBank, onLogout }: { me: RiderMe; onBank: () => void; onLogout: () => void }) {
  const p = me.profile;
  return (
    <div className="space-y-4">
      <Panel title="Profile">
        <dl className="space-y-2 text-sm">
          <Info label="Name" value={p?.name ?? me.user.phone} />
          <Info label="Phone" value={me.user.phone} />
          <Info label="Status" value={pretty(p?.status ?? 'OFFLINE')} />
          <Info label="KYC" value={pretty(p?.kycStatus ?? 'PENDING')} />
          <Info label="Vehicle" value={p ? `${pretty(p.vehicleType)}${p.vehicleNumber ? ` · ${p.vehicleNumber}` : ''}` : 'Not set'} />
          <Info label="Deliveries" value={String(p?.totalDeliveries ?? 0)} />
        </dl>
      </Panel>
      <button onClick={onBank} className="w-full rounded-lg bg-white p-4 text-left shadow-sm">
        <p className="font-semibold">Payout account</p>
        <p className="text-sm text-slate-500">Bank account, IFSC, and UPI details.</p>
      </button>
      <Panel title="Captain tools">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <ToolLink href="/kyc" label="KYC documents" />
          <ToolLink href="/shifts" label="Shifts" />
          <ToolLink href="/incentives" label="Incentives" />
          <ToolLink href="/notifications" label="Notifications" />
          <ToolLink href="/fleet" label="Fleet route" />
          <ToolLink href="/training" label="Training" />
        </div>
      </Panel>
      <button onClick={onLogout} className="h-11 w-full rounded-lg bg-slate-950 text-sm font-semibold text-white">
        Sign out
      </button>
    </div>
  );
}

function ToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-lg bg-slate-100 px-3 py-3 font-semibold text-slate-700">
      {label}
    </Link>
  );
}

function OrderCard({ order, compact = false }: { order: RiderOrder; compact?: boolean }) {
  const isCod = order.paymentMethod?.toUpperCase().includes('COD');
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <b>#{order.orderNumber}</b>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{pretty(order.deliveryStatus)}</span>
      </div>
      <div className="space-y-2 p-4 text-sm">
        <Stop label="Pickup" title={order.storeName} />
        <Stop label="Drop" title={order.customerArea} />
        {!compact && (
          <div className="flex justify-between gap-3 pt-2">
            <span>{isCod ? `Collect ${inr(order.totalAmount)} COD` : 'Prepaid order'}</span>
            {order.riderEarning != null && <b className="text-emerald-700">{inr(order.riderEarning)}</b>}
          </div>
        )}
      </div>
    </div>
  );
}

function BottomTabs({ tab }: { tab: Tab }) {
  const tabs: Array<{ key: Tab; label: string; href: string }> = [
    { key: 'home', label: 'Home', href: '/home' },
    { key: 'orders', label: 'Orders', href: '/orders' },
    { key: 'earnings', label: 'Earnings', href: '/earnings' },
    { key: 'support', label: 'Support', href: '/support' },
    { key: 'account', label: 'Account', href: '/account' },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-md grid-cols-5 border-t border-slate-200 bg-white">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} className={`grid h-16 place-items-center text-xs font-semibold ${tab === t.key ? 'text-emerald-700' : 'text-slate-500'}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

function StatusToggle({ online, approved, busy, onToggle }: { online: boolean; approved: boolean; busy: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      disabled={!approved || busy}
      className={`h-10 rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${online ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'}`}
    >
      {online ? 'Online' : 'Offline'}
    </button>
  );
}

function KycBanner({ status }: { status: KycStatus }) {
  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      KYC is <b>{pretty(status)}</b>. You can receive deliveries after approval.
    </div>
  );
}

function Metric({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${dark ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
      <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-1 truncate text-lg font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

function Stop({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="font-medium text-slate-900">{title}</p>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg bg-white p-6 text-center shadow-sm">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function FullScreenNote({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 text-center text-slate-900">
      <div>
        <p className="text-lg font-bold">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{body}</p>
        {children}
      </div>
    </main>
  );
}

function formatAddress(addr: Record<string, string>) {
  return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || 'Delivery address';
}
