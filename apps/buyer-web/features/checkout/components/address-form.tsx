'use client';

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
import { Button, Input } from '@/design-system/primitives';
import { useCheckoutStore } from '@/store/checkout-store';
import { useLocationStore } from '@/store/location-store';
import {
  BuyerAddressPicker,
  type AddressLocationValue,
} from '@/components/google-maps/buyer-address-picker';
import {
  getDefaultSavedDeliveryAddress,
  isAddressGeoComplete,
  persistDeliveryAddress,
} from '@/lib/saved-delivery-address';
import { RequiredFieldLegend } from '@/features/checkout/components/required-field-legend';
import type { DeliveryAddress } from '@/types/checkout';

const schema = z
  .object({
    line1: z.string().min(2, 'Enter house / flat number and street'),
    line2: z.string().optional(),
    locality: z.string().min(2, 'Search and select your delivery area'),
    city: z.string().min(2, 'City is required'),
    pincode: z.string().length(6, 'Enter a valid 6-digit PIN code'),
    lat: z.number(),
    lng: z.number(),
    locationPincodeId: z.string().optional(),
    locationAreaId: z.string().optional(),
    locationCityId: z.string().optional(),
  })
  .refine((data) => isAddressGeoComplete(data.lat, data.lng), {
    message: 'Pin your exact delivery location on the map',
    path: ['locality'],
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
      lat: deliveryAddress?.lat ?? (location.isReady ? location.lat : 0),
      lng: deliveryAddress?.lng ?? (location.isReady ? location.lng : 0),
      locationPincodeId: deliveryAddress?.locationPincodeId,
      locationAreaId: deliveryAddress?.locationAreaId,
      locationCityId: deliveryAddress?.locationCityId,
    },
  });

  const locality = watch('locality');
  const city = watch('city');
  const pincode = watch('pincode');
  const lat = watch('lat');
  const lng = watch('lng');

  // defaultValues above only seed the form once, at mount — if the buyer changes their
  // delivery location (the header picker) while this form is already open, without this
  // the map-pin fields keep whatever location was current at mount time (observed: a
  // stale "Connaught Place, New Delhi" pin persisting after switching to a different
  // city). Re-sync from the store as long as the user hasn't picked their own pin here
  // and there's no existing address already seeding the form.
  const hasUserPickedLocation = useRef(false);
  useEffect(() => {
    if (hasUserPickedLocation.current || deliveryAddress || !location.isReady) return;
    setValue('locality', location.label ?? '');
    setValue('city', location.city ?? '');
    setValue('pincode', location.pincode ?? '');
    setValue('lat', location.lat);
    setValue('lng', location.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.isReady, location.lat, location.lng, location.city, location.pincode, location.label]);

  const handleLocationChange = (selection: AddressLocationValue) => {
    hasUserPickedLocation.current = true;
    setValue('locality', selection.locality, { shouldValidate: true });
    setValue('city', selection.city, { shouldValidate: true });
    setValue('pincode', selection.pincode, { shouldValidate: true });
    setValue('lat', selection.lat, { shouldValidate: true });
    setValue('lng', selection.lng, { shouldValidate: true });
    setValue('locationPincodeId', selection.locationPincodeId);
    setValue('locationAreaId', selection.locationAreaId);
    setValue('locationCityId', selection.locationCityId);
    if (selection.line1) {
      setValue('line1', selection.line1, { shouldValidate: true });
    }
    if (selection.line2) {
      setValue('line2', selection.line2);
    }
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
      <RequiredFieldLegend />

      <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
        <MapPin className="h-4 w-4 shrink-0" />
        <span>
          {location.isReady
            ? location.label || 'Location detected'
            : 'Search your delivery address below'}
        </span>
      </div>

      <Input
        label="House / flat no. & street"
        placeholder="e.g. 42 MG Road, Civil Lines"
        required
        error={errors.line1?.message}
        {...register('line1')}
      />
      <Input
        label="Area / landmark"
        placeholder="e.g. Near Metro Station"
        hint="Optional — helps the delivery partner find you"
        {...register('line2')}
      />
      <Controller
        name="locality"
        control={control}
        render={() => (
          <BuyerAddressPicker
            value={{ locality, city, state: '', pincode, lat, lng }}
            onChange={handleLocationChange}
            onLine1Suggestion={(line1) => setValue('line1', line1, { shouldValidate: true })}
            error={errors.locality?.message ?? errors.pincode?.message ?? errors.city?.message}
            searchLabel="Delivery area & map pin"
          />
        )}
      />
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-red-600">*</span> Search your area, then drag the pin on
        the map to your building entrance.
      </p>

      <Button type="submit" fullWidth>
        Continue to payment
      </Button>
    </form>
  );
}
