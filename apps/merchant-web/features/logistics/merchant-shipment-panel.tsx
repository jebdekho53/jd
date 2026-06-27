'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, RefreshCw, XCircle, Clock } from 'lucide-react';
import { Card, CardBody, CardHeader, Button, Spinner, useToast } from '@/design-system/primitives';
import { merchantFetch } from '@/services/api/merchant-client';

export interface ProviderShipmentEvent {
  id: string;
  providerStatus: string | null;
  normalizedStatus: string;
  description: string | null;
  occurredAt: string;
}

export interface ProviderShipmentView {
  id: string;
  providerType: string;
  externalShipmentId: string | null;
  trackingNumber: string | null;
  normalizedStatus: string;
  providerStatus: string | null;
  estimatedEtaMins: number | null;
  estimatedArrivalAt: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehicleType: string | null;
  lastError: string | null;
  retryCount: number;
  provider: { name: string; type: string };
  events: ProviderShipmentEvent[];
}

async function fetchShipment(orderId: string) {
  const res = await merchantFetch<{ success: boolean; data: ProviderShipmentView }>(
    `/api/merchant/orders/${orderId}/shipment`,
  );
  return res.data;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Shipment created',
  ASSIGNED: 'Partner assigned',
  PICKUP_STARTED: 'Heading to store',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'On the way',
  NEARBY: 'Almost there',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
};

export function MerchantShipmentPanel({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['merchant-shipment', orderId],
    queryFn: () => fetchShipment(orderId),
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      merchantFetch(`/api/merchant/orders/${orderId}/shipment/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Cancelled by merchant' }),
      }),
    onSuccess: () => {
      toast('Shipment cancelled', 'success');
      void qc.invalidateQueries({ queryKey: ['merchant-shipment', orderId] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const retryMutation = useMutation({
    mutationFn: () =>
      merchantFetch(`/api/merchant/orders/${orderId}/shipment/retry`, { method: 'POST' }),
    onSuccess: () => {
      toast('Shipment retry queued', 'success');
      void qc.invalidateQueries({ queryKey: ['merchant-shipment', orderId] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex justify-center py-8">
          <Spinner />
        </CardBody>
      </Card>
    );
  }

  if (error || !data) return null;

  const canRetry = !data.externalShipmentId && data.normalizedStatus === 'FAILED';
  const canCancel = data.externalShipmentId && !['DELIVERED', 'CANCELLED'].includes(data.normalizedStatus);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Truck className="h-4 w-4 text-slate-500" />
          Logistics — {data.provider.name}
        </h2>
        <button type="button" onClick={() => refetch()} className="text-xs text-brand-600">
          <RefreshCw className="inline h-3 w-3" /> Refresh
        </button>
      </CardHeader>
      <CardBody className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-slate-500">Status</p>
            <p className="font-medium">{STATUS_LABELS[data.normalizedStatus] ?? data.normalizedStatus}</p>
          </div>
          <div>
            <p className="text-slate-500">AWB / Tracking</p>
            <p className="font-mono text-xs">{data.trackingNumber ?? data.externalShipmentId ?? '—'}</p>
          </div>
          {data.estimatedEtaMins != null && (
            <div>
              <p className="text-slate-500">Delivery ETA</p>
              <p className="font-medium">~{data.estimatedEtaMins} min</p>
            </div>
          )}
          {data.driverName && (
            <div>
              <p className="text-slate-500">Driver</p>
              <p className="font-medium">
                {data.driverName}
                {data.driverPhone ? ` · ${data.driverPhone}` : ''}
              </p>
            </div>
          )}
        </div>

        {data.lastError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
            <XCircle className="mb-1 inline h-4 w-4" /> {data.lastError}
          </div>
        )}

        {data.events.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1 font-medium text-slate-700">
              <Clock className="h-4 w-4" /> Timeline
            </p>
            <ul className="space-y-2 border-l-2 border-slate-200 pl-4">
              {data.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                  <p className="font-medium">{STATUS_LABELS[e.normalizedStatus] ?? e.normalizedStatus}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(e.occurredAt).toLocaleString('en-IN')}
                    {e.description ? ` · ${e.description}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {canRetry && (
            <Button size="sm" loading={retryMutation.isPending} onClick={() => retryMutation.mutate()}>
              Retry shipment
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Cancel shipment
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
