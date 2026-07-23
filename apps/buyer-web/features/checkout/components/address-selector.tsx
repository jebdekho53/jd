'use client';

import { useState } from 'react';
import { Briefcase, Check, Home, MapPin, Plus } from 'lucide-react';
import { Button } from '@/design-system/primitives';
import { useAddressStore } from '@/store/address-store';
import { profileAddressToDelivery, isDeliveryAddressComplete } from '@/lib/saved-delivery-address';
import type { ProfileAddress } from '@/features/profile/types';
import type { DeliveryAddress } from '@/types/checkout';
import { AddressForm } from './address-form';

const LABEL_ICON = { Home, Work: Briefcase, Other: MapPin };

interface AddressSelectorProps {
  selected: DeliveryAddress | null;
  onSelect: (address: DeliveryAddress) => void;
  onNext: () => void;
}

/** Blinkit/Amazon-style "choose a saved address" step — previously checkout
 *  only ever silently used whichever address was marked default, with no way
 *  for a buyer to pick Home vs Work vs Other per order. */
export function AddressSelector({ selected, onSelect, onNext }: AddressSelectorProps) {
  const addresses = useAddressStore((s) => s.addresses);
  const usableAddresses = addresses.filter((a) =>
    isDeliveryAddressComplete(profileAddressToDelivery(a)),
  );
  const [addingNew, setAddingNew] = useState(usableAddresses.length === 0);

  if (addingNew) {
    return (
      <div className="space-y-3">
        {usableAddresses.length > 0 && (
          <button
            type="button"
            onClick={() => setAddingNew(false)}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Choose a saved address instead
          </button>
        )}
        <AddressForm onNext={onNext} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {usableAddresses.map((addr) => {
        const delivery = profileAddressToDelivery(addr);
        const isSelected =
          selected?.line1 === delivery.line1 && selected?.pincode === delivery.pincode;
        const Icon = LABEL_ICON[addr.label] ?? MapPin;
        return (
          <button
            key={addr.id}
            type="button"
            onClick={() => {
              onSelect(delivery);
              onNext();
            }}
            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-jd-text-primary">{addr.label}</p>
              <p className="truncate text-sm text-jd-text-secondary">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ''}
              </p>
              <p className="text-xs text-jd-text-muted">
                {addr.city ? `${addr.city} — ` : ''}
                {addr.pincode}
              </p>
            </div>
            {isSelected && <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />}
          </button>
        );
      })}

      <Button variant="outline" fullWidth onClick={() => setAddingNew(true)}>
        <Plus className="h-4 w-4" /> Add a new address
      </Button>
    </div>
  );
}

export type { ProfileAddress };
