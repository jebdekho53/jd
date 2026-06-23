'use client';

import { ShoppingCart } from 'lucide-react';
import { ButtonLink, Text } from '@/design-system/primitives';

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <ShoppingCart className="h-8 w-8 text-neutral-400" />
      </div>
      <Text variant="h2" className="mb-2">
        Your cart is empty
      </Text>
      <Text variant="bodySm" className="mb-8">
        Explore stores near you and add items to get started
      </Text>
      <ButtonLink href="/stores" variant="outline">
        Browse stores
      </ButtonLink>
    </div>
  );
}
