'use client';

import { MapPin, Phone, ShoppingBag, User } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/design-system/primitives';
import type { CustomerPanel as CustomerData, OrderDetail } from '@/types/order';

interface Props {
  order: OrderDetail;
}

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function CustomerPanel({ order }: Props) {
  const addr = order.deliveryAddress as Record<string, string | number | undefined>;
  const customer: CustomerData | undefined = order.customer;
  const phone = customer?.phone ?? order.buyerProfile?.phone ?? null;
  const lat = addr?.lat as number | undefined;
  const lng = addr?.lng as number | undefined;
  const mapUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : addr?.line1
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            [addr.line1, addr.city, addr.pincode].filter(Boolean).join(', '),
          )}`
        : null;

  return (
    <Card>
      <CardHeader><h2 className="font-semibold">Customer</h2></CardHeader>
      <CardBody className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{customer?.name ?? order.buyerProfile?.name ?? 'N/A'}</span>
        </div>
        {phone && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4 text-slate-400" />
              <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
            </div>
            <a
              href={`tel:${phone}`}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              Call
            </a>
          </div>
        )}
        {customer && (
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
            <div>
              <p className="text-slate-400">Orders</p>
              <p className="font-semibold">{customer.orderCount}</p>
            </div>
            <div>
              <p className="text-slate-400">Lifetime spend</p>
              <p className="font-semibold">{formatInr(customer.lifetimeSpend)}</p>
            </div>
          </div>
        )}
        {addr && (
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <div className="mb-1 flex items-center gap-1 font-medium text-slate-700">
              <MapPin className="h-3.5 w-3.5" /> Delivery address
            </div>
            <p>{addr.line1}</p>
            {addr.line2 && <p>{addr.line2}</p>}
            <p>{addr.city} — {addr.pincode}</p>
            {addr.distanceKm != null && (
              <p className="mt-1 text-slate-500">{Number(addr.distanceKm).toFixed(1)} km from store</p>
            )}
          </div>
        )}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-slate-200"
          >
            <div className="flex h-28 items-center justify-center bg-slate-100 text-xs text-slate-500">
              <MapPin className="mr-1 h-4 w-4" />
              Open map preview
            </div>
          </a>
        )}
        {order.buyerNote && (
          <div className="flex gap-2 rounded-lg border border-slate-100 p-3 text-xs italic text-slate-600">
            <ShoppingBag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            &ldquo;{order.buyerNote}&rdquo;
          </div>
        )}
      </CardBody>
    </Card>
  );
}
