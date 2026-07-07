'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Activity, RefreshCw, Truck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { adminFetch } from '@/services/api/admin-client';
import { Badge, Button, Spinner } from '@/design-system';
import { BackButton } from '@/components/navigation/back-button';
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
  processedAt?: string | null;
}

export function LogisticsDashboardContent() {
  const { isConfigured, isLoaded } = useGoogleMaps();
  const { data: opsMap } = useOperationsMapQuery(30_000);
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['admin-logistics-dashboard'],
    queryFn: () =>
      adminFetch<{ success: boolean; data: DashboardData }>('/api/admin/logistics/dashboard').then(
        (r) => r.data,
      ),
    refetchInterval: 60_000,
  });

  const { data: webhooks = [], isError: webhooksError } = useQuery({
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

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="font-medium text-red-700">Could not load logistics dashboard.</p>
        <p className="mt-1 text-sm text-red-600">Check API health or try again.</p>
        <Button className="mt-3" size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const failedWebhooks = webhooks.filter((w) => w.status === 'FAILED');
  const pendingWebhooks = webhooks.filter((w) => w.status !== 'FAILED' && w.status !== 'PROCESSED');
  const healthTone = data?.providerHealth?.isHealthy ? 'success' : data?.providerHealth ? 'danger' : 'warning';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logistics</h1>
          <p className="text-sm text-slate-500">
            Third-party delivery operations
            {dataUpdatedAt ? ` · refreshed ${new Date(dataUpdatedAt).toLocaleTimeString('en-IN')}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <BackButton fallbackHref="/dashboard" />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" loading={healthCheck.isPending} onClick={() => healthCheck.mutate()}>
            <Activity className="h-4 w-4" /> Health check
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Active provider</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{data?.activeProvider ?? '—'}</p>
            </div>
            <Badge tone={healthTone} dot>
              {data?.providerHealth?.isHealthy ? 'Healthy' : data?.providerHealth ? 'Needs attention' : 'Unknown'}
            </Badge>
          </div>
          <div className="mt-3 text-sm text-slate-500">
            Registered: {(data?.registeredProviders ?? []).join(', ') || 'None'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Webhook incidents</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-3xl font-semibold text-slate-900">{failedWebhooks.length}</p>
            <p className="pb-1 text-sm text-slate-500">failed in recent events</p>
          </div>
          {pendingWebhooks.length > 0 && (
            <p className="mt-2 text-sm text-amber-700">{pendingWebhooks.length} pending webhook events</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Retry queue</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-3xl font-semibold text-slate-900">{data?.retryQueue ?? 0}</p>
            <p className="pb-1 text-sm text-slate-500">shipments waiting</p>
          </div>
          <p className="mt-2 text-sm text-slate-500">Use failed delivery markers to inspect operational gaps.</p>
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
          <div className="grid gap-3 p-4 text-sm sm:grid-cols-3">
            <HealthMetric
              icon={data.providerHealth.isHealthy ? CheckCircle2 : AlertTriangle}
              label="Status"
              value={data.providerHealth.isHealthy ? 'Healthy' : 'Unhealthy'}
              tone={data.providerHealth.isHealthy ? 'text-emerald-600' : 'text-red-600'}
            />
            <HealthMetric
              icon={Clock}
              label="Latency"
              value={data.providerHealth.latencyMs != null ? `${data.providerHealth.latencyMs}ms` : '—'}
              tone="text-slate-900"
            />
            <HealthMetric
              icon={Truck}
              label="Provider"
              value={data.activeProvider ?? '—'}
              tone="text-slate-900"
            />
            {data.providerHealth.lastError && (
              <p className="rounded-lg bg-red-50 p-3 text-red-700 sm:col-span-3">
                {data.providerHealth.lastError}
              </p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Recent webhooks</h2>
          <div className="flex gap-2">
            <Badge tone="danger">{failedWebhooks.length} failed</Badge>
            <Badge tone="neutral">{webhooks.length} recent</Badge>
          </div>
        </div>
        <div>
          <ul className="divide-y text-sm">
            {webhooksError && (
              <li className="px-4 py-6 text-center text-red-600">Could not load webhook events.</li>
            )}
            {webhooks.length === 0 && (
              <li className="px-4 py-6 text-center text-slate-500">No webhook events yet</li>
            )}
            {webhooks.map((w) => (
              <li key={w.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{w.providerType}</p>
                  <p className="text-xs text-slate-500">
                    {w.eventId ?? w.id} · {new Date(w.createdAt).toLocaleString('en-IN')}
                  </p>
                  {w.errorMessage && <p className="mt-1 text-xs text-red-600">{w.errorMessage}</p>}
                </div>
                <Badge
                  tone={
                    w.status === 'PROCESSED'
                      ? 'success'
                      : w.status === 'FAILED'
                        ? 'danger'
                        : 'warning'
                  }
                  dot
                >
                  {w.status}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function HealthMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
      <Icon className={`mt-0.5 h-5 w-5 ${tone}`} />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`font-semibold ${tone}`}>{value}</p>
      </div>
    </div>
  );
}
