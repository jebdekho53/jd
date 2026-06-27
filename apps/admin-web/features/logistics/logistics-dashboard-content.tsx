'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Activity, RefreshCw, Truck, AlertTriangle } from 'lucide-react';
import { adminFetch } from '@/services/api/admin-client';
import { Button, Spinner } from '@/design-system';
import { OpsMapOverlay } from '@/features/maps/ops-map-overlay';
import { useOperationsMapQuery } from '@/features/maps/use-operations-map';
import { useGoogleMaps } from '@jebdekho/google-maps';

interface DashboardData {
  activeProvider: string;
  todayShipments: number;
  successRate: number;
  failureRate: number;
  averageDeliveryCost: number | null;
  averageEtaMins: number | null;
  webhookFailures: number;
  retryQueue: number;
  providerHealth: {
    isHealthy: boolean;
    latencyMs: number | null;
    lastError: string | null;
  } | null;
  registeredProviders: string[];
}

interface WebhookEvent {
  id: string;
  providerType: string;
  eventId: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export function LogisticsDashboardContent() {
  const { isConfigured, isLoaded } = useGoogleMaps();
  const { data: opsMap } = useOperationsMapQuery(30_000);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-logistics-dashboard'],
    queryFn: () =>
      adminFetch<{ success: boolean; data: DashboardData }>('/api/admin/logistics/dashboard').then(
        (r) => r.data,
      ),
    refetchInterval: 60_000,
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ['admin-logistics-webhooks'],
    queryFn: () =>
      adminFetch<{ success: boolean; data: WebhookEvent[] }>(
        '/api/admin/logistics/webhooks/recent',
      ).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const healthCheck = useMutation({
    mutationFn: () =>
      adminFetch<{ success: boolean; data: { healthy: boolean; latencyMs?: number } }>(
        '/api/admin/logistics/health-check',
        { method: 'POST' },
      ),
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logistics</h1>
          <p className="text-sm text-slate-500">Third-party delivery operations — Shadowfax primary</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" loading={healthCheck.isPending} onClick={() => healthCheck.mutate()}>
            <Activity className="h-4 w-4" /> Health check
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active provider', value: data?.activeProvider ?? '—', icon: Truck },
          { label: "Today's shipments", value: data?.todayShipments ?? 0, icon: Truck },
          {
            label: 'Success rate',
            value: data ? `${Math.round(data.successRate * 100)}%` : '—',
            icon: Activity,
          },
          {
            label: 'Failed today',
            value: data ? `${Math.round(data.failureRate * 100)}%` : '—',
            icon: AlertTriangle,
          },
          { label: 'Avg ETA', value: data?.averageEtaMins ? `${Math.round(data.averageEtaMins)} min` : '—', icon: Activity },
          {
            label: 'Avg cost',
            value: data?.averageDeliveryCost != null ? `₹${data.averageDeliveryCost.toFixed(0)}` : '—',
            icon: Activity,
          },
          { label: 'Webhook failures', value: data?.webhookFailures ?? 0, icon: AlertTriangle },
          { label: 'Retry queue', value: data?.retryQueue ?? 0, icon: RefreshCw },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start gap-3 p-4">
              <Icon className="mt-0.5 h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.providerHealth && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold">Provider health</h2>
          </div>
          <div className="p-4 text-sm">
            <p>
              Status:{' '}
              <span className={data.providerHealth.isHealthy ? 'text-emerald-600' : 'text-red-600'}>
                {data.providerHealth.isHealthy ? 'Healthy' : 'Unhealthy'}
              </span>
              {data.providerHealth.latencyMs != null && ` · ${data.providerHealth.latencyMs}ms latency`}
            </p>
            {data.providerHealth.lastError && (
              <p className="mt-1 text-red-600">{data.providerHealth.lastError}</p>
            )}
          </div>
        </div>
      )}

      {opsMap && isConfigured && isLoaded && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 font-semibold">Shadowfax shipment markers</h2>
            <OpsMapOverlay data={opsMap} showStores={false} showZones={false} showShipments />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 font-semibold">Failed / unassigned deliveries</h2>
            <OpsMapOverlay
              data={opsMap}
              showStores={false}
              showRiders={false}
              showZones={false}
              showUnassigned
            />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Recent webhooks</h2>
        </div>
        <div>
          <ul className="divide-y text-sm">
            {webhooks.length === 0 && (
              <li className="px-4 py-6 text-center text-slate-500">No webhook events yet</li>
            )}
            {webhooks.map((w) => (
              <li key={w.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{w.providerType}</p>
                  <p className="text-xs text-slate-500">
                    {w.eventId ?? w.id} · {new Date(w.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <span
                  className={
                    w.status === 'PROCESSED'
                      ? 'text-emerald-600'
                      : w.status === 'FAILED'
                        ? 'text-red-600'
                        : 'text-slate-500'
                  }
                >
                  {w.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
