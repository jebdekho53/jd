'use client';

import { MapPin, Phone, User, Bike } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/design-system/primitives';
import { AwaitingRiderAlert } from './awaiting-rider-alert';
import type { OrderDelivery } from '@/types/order';
import type { SlaLevel } from '@/lib/order-pipeline';

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  ARRIVED_AT_STORE: 'At Store',
  PICKED_UP: 'Picked Up',
  ARRIVED_AT_CUSTOMER: 'At Customer',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

interface RiderAssignmentCardProps {
  delivery: OrderDelivery | null | undefined;
  awaitingRider?: boolean;
  riderWaitMins?: number;
  riderWaitSla?: SlaLevel;
  orderId?: string;
}

export function RiderAssignmentCard({
  delivery,
  awaitingRider,
  riderWaitMins,
  riderWaitSla,
  orderId,
}: RiderAssignmentCardProps) {
  if (awaitingRider && orderId) {
    return (
      <Card>
        <CardHeader><h2 className="font-semibold">Delivery Rider</h2></CardHeader>
        <CardBody>
          <AwaitingRiderAlert
            orderId={orderId}
            riderWaitMins={riderWaitMins}
            riderWaitSla={riderWaitSla}
          />
        </CardBody>
      </Card>
    );
  }

  if (!delivery?.rider) {
    return (
      <Card>
        <CardHeader><h2 className="font-semibold">Delivery Rider</h2></CardHeader>
        <CardBody className="text-sm text-slate-500">
          No rider assigned yet. Rider auto-assigns when order is marked ready for pickup.
        </CardBody>
      </Card>
    );
  }

  const { rider } = delivery;
  const statusLabel = DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status;
  const location =
    rider.currentLat != null && rider.currentLng != null
      ? `${rider.currentLat.toFixed(4)}, ${rider.currentLng.toFixed(4)}`
      : 'Location unavailable';

  return (
    <Card>
      <CardHeader><h2 className="font-semibold">Assigned Rider</h2></CardHeader>
      <CardBody className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{rider.name}</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
            {statusLabel}
          </span>
        </div>
        {rider.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="h-4 w-4 text-slate-400" />
            <a href={`tel:${rider.phone}`} className="hover:underline">{rider.phone}</a>
          </div>
        )}
        {'vehicleType' in rider && rider.vehicleType && (
          <p className="text-slate-600">Vehicle: {String(rider.vehicleType).replace(/_/g, ' ')}</p>
        )}
        {delivery.assignedAt && (
          <p className="text-slate-600">
            Assigned: {new Date(delivery.assignedAt).toLocaleString('en-IN')}
          </p>
        )}
        <div className="flex items-center gap-2 text-slate-600">
          <Bike className="h-4 w-4 text-slate-400" />
          <span>Rider status: {rider.status}</span>
        </div>
        {delivery.distanceKm != null && (
          <p className="text-slate-600">Distance from store: {delivery.distanceKm.toFixed(1)} km</p>
        )}
        {delivery.estimatedMins != null && (
          <p className="text-slate-600">ETA: ~{delivery.estimatedMins} min</p>
        )}
        <div className="flex items-start gap-2 text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div>
            <p>{location}</p>
            {rider.lastLocationAt && (
              <p className="text-xs text-slate-400">
                Updated {new Date(rider.lastLocationAt).toLocaleTimeString('en-IN')}
              </p>
            )}
          </div>
        </div>
        {delivery.assignmentTimeline.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-medium uppercase text-slate-400">Assignment Timeline</p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {delivery.assignmentTimeline.map((a) => (
                <li key={a.id}>
                  {a.riderName} — {a.status}
                  <span className="text-slate-400">
                    {' '}· {new Date(a.offeredAt).toLocaleTimeString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
