'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin, Package, RotateCcw, Truck } from 'lucide-react';
import { LocationPickerModal } from '@/features/location/components/location-picker-modal';
import { useEffectiveLocation } from '@/store/location-store';
import { formatCurrency } from '@/lib/utils';
import { formatEta } from '../utils';

interface PdpDeliverySectionProps {
  storeName: string;
  etaMins?: number | null;
  deliveryFee?: number;
  deliveryPartner?: string;
}

export function PdpDeliverySection({
  storeName,
  etaMins,
  deliveryFee,
  deliveryPartner = 'JebDekho Partner',
}: PdpDeliverySectionProps) {
  const { label, pincode, isReady } = useEffectiveLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const eta = formatEta(etaMins);

  return (
    <>
      <section
        className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
        aria-labelledby="pdp-delivery-heading"
      >
        <h2 id="pdp-delivery-heading" className="mb-3 text-lg font-semibold text-jd-text-primary">
          Delivery
        </h2>

        <button
          type="button"
          onClick={() => setLocationOpen(true)}
          className="mb-3 flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-cream-2 px-3 py-2.5 text-left transition hover:border-primary/30"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wide text-jd-text-muted">Delivering to</span>
              <span className="block truncate text-sm font-semibold text-jd-text-primary">
                {isReady ? label : 'Set delivery location'}
              </span>
              {pincode && <span className="text-xs text-jd-text-muted">PIN {pincode}</span>}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-jd-text-muted" aria-hidden />
        </button>

        <ul className="space-y-2 text-sm text-jd-text-secondary">
          {pincode && (
            <li className="flex items-start gap-2">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                Serviceable at <strong className="text-jd-text-primary">{pincode}</strong>
                {isReady ? '' : ' — confirm your exact address for accuracy'}
              </span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              Delivered by {deliveryPartner}
              {eta ? ` · Est. ${eta}` : ''}
              {deliveryFee != null ? ` · Delivery ${deliveryFee === 0 ? 'free' : formatCurrency(deliveryFee)}` : ''}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              Easy refunds on eligible items.{' '}
              <Link href="/refund-policy" className="font-semibold text-primary hover:underline">
                Refund policy
              </Link>
            </span>
          </li>
        </ul>

        <p className="mt-3 text-xs text-jd-text-muted">
          Fulfilled by {storeName} via JebDekho logistics partners.
        </p>
      </section>

      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </>
  );
}
