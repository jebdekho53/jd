'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
import { Button, Input, Text } from '@/design-system/primitives';
import { useCheckoutStore } from '@/store/checkout-store';
import { useLocationStore } from '@/store/location-store';
import type { DeliveryAddress } from '@/types/checkout';

const schema = z.object({
  line1: z.string().min(2, 'Enter house / flat number and street'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Enter city'),
  pincode: z.string().length(6, 'Enter a valid 6-digit PIN code'),
});

type FormData = z.infer<typeof schema>;

interface AddressFormProps {
  onNext: () => void;
}

export function AddressForm({ onNext }: AddressFormProps) {
  const { setDeliveryAddress, deliveryAddress } = useCheckoutStore();
  const location = useLocationStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      line1: (deliveryAddress?.line1 as string) ?? '',
      line2: deliveryAddress?.line2 ?? '',
      city: deliveryAddress?.city ?? '',
      pincode: deliveryAddress?.pincode ?? '',
    },
  });

  const onSubmit = (data: FormData) => {
    const addr: DeliveryAddress = {
      line1: data.line1,
      line2: data.line2 ?? undefined,
      city: data.city,
      pincode: data.pincode,
      lat: location.lat || 28.6139,
      lng: location.lng || 77.209,
    };
    setDeliveryAddress(addr);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <MapPin className="h-4 w-4 shrink-0" />
        <span>
          {location.isReady
            ? location.label || 'Location detected'
            : 'No location set — using default coordinates'}
        </span>
      </div>

      <Input
        label="House / flat no. & street *"
        placeholder="e.g. 42 MG Road, Civil Lines"
        error={errors.line1?.message}
        {...register('line1')}
      />
      <Input
        label="Area / landmark (optional)"
        placeholder="e.g. Near Metro Station"
        {...register('line2')}
      />
      <Input
        label="City *"
        placeholder="e.g. New Delhi"
        error={errors.city?.message}
        {...register('city')}
      />
      <Input
        label="PIN code *"
        placeholder="110001"
        maxLength={6}
        error={errors.pincode?.message}
        {...register('pincode')}
      />

      <Button type="submit" fullWidth>
        Continue to payment
      </Button>
    </form>
  );
}
