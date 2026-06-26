'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
import { Button, Input } from '@/design-system/primitives';
import { useCheckoutStore } from '@/store/checkout-store';
import { useLocationStore } from '@/store/location-store';
import {
  LocationSearchInput,
  type LocationSelection,
} from '@/features/location/components/location-search-input';
import {
  getDefaultSavedDeliveryAddress,
  persistDeliveryAddress,
} from '@/lib/saved-delivery-address';
import type { DeliveryAddress } from '@/types/checkout';

const schema = z.object({
  line1: z.string().min(2, 'Enter house / flat number and street'),
  line2: z.string().optional(),
  locality: z.string().min(2, 'Select a delivery locality from the directory'),
  city: z.string().min(2),
  pincode: z.string().length(6, 'Enter a valid 6-digit PIN code'),
  lat: z.number(),
  lng: z.number(),
  locationPincodeId: z.string().optional(),
  locationAreaId: z.string().optional(),
  locationCityId: z.string().optional(),
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
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      line1: (deliveryAddress?.line1 as string) ?? '',
      line2: deliveryAddress?.line2 ?? '',
      locality: deliveryAddress?.locality ?? location.label ?? '',
      city: deliveryAddress?.city ?? location.city ?? '',
      pincode: deliveryAddress?.pincode ?? location.pincode ?? '',
      lat: deliveryAddress?.lat ?? location.lat ?? 28.6139,
      lng: deliveryAddress?.lng ?? location.lng ?? 77.209,
      locationPincodeId: deliveryAddress?.locationPincodeId,
      locationAreaId: deliveryAddress?.locationAreaId,
      locationCityId: deliveryAddress?.locationCityId,
    },
  });

  const locality = watch('locality');
  const city = watch('city');
  const pincode = watch('pincode');

  const handleLocationSelect = (selection: LocationSelection) => {
    setValue('locality', selection.label, { shouldValidate: true });
    setValue('city', selection.city, { shouldValidate: true });
    setValue('pincode', selection.pincode, { shouldValidate: true });
    setValue('lat', selection.latitude, { shouldValidate: true });
    setValue('lng', selection.longitude, { shouldValidate: true });
    setValue('locationPincodeId', selection.locationPincodeId);
    setValue('locationAreaId', selection.locationAreaId);
    setValue('locationCityId', selection.locationCityId);
  };

  const onSubmit = (data: FormData) => {
    const addr: DeliveryAddress = {
      line1: data.line1,
      line2: data.line2 ?? undefined,
      locality: data.locality,
      city: data.city,
      pincode: data.pincode,
      lat: data.lat,
      lng: data.lng,
      locationPincodeId: data.locationPincodeId,
      locationAreaId: data.locationAreaId,
      locationCityId: data.locationCityId,
    };
    setDeliveryAddress(addr);
    persistDeliveryAddress(addr);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
        <MapPin className="h-4 w-4 shrink-0" />
        <span>
          {location.isReady
            ? location.label || 'Location detected'
            : 'Search your delivery locality below'}
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
      <Controller
        name="locality"
        control={control}
        render={() => (
          <LocationSearchInput
            value={locality}
            onSelect={handleLocationSelect}
            error={errors.locality?.message}
          />
        )}
      />
      {locality && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <p>
            {locality} · {city} · PIN {pincode}
          </p>
        </div>
      )}

      <Button type="submit" fullWidth>
        Continue to payment
      </Button>
    </form>
  );
}
