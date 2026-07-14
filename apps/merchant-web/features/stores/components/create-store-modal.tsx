'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Textarea, Select } from '@/design-system/primitives';
import { useCreateStoreMutation } from '@/hooks/use-stores';
import { submitStoreForReview } from '@/services/stores/stores-api';
import { useQueryClient } from '@tanstack/react-query';
import { useCitiesQuery, useZonesQuery } from '@/hooks/use-geo';
import { useUpsertMerchantProfileMutation } from '@/hooks/use-merchant-profile';
import { useToast } from '@/design-system/primitives';
import { useStoreStore } from '@/store/store-store';
import { MerchantAddressPicker } from '@/components/google-maps/merchant-address-picker';
import { ImageUploadField } from '@/features/media/components/image-upload-field';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const schema = z.object({
  businessName: z.string().min(2, 'Required').max(100),
  gstNumber: z
    .string()
    .transform((v) => v.toUpperCase())
    .refine((v) => GST_REGEX.test(v), 'Invalid 15-character GSTIN'),
  panNumber: z
    .string()
    .transform((v) => v.toUpperCase())
    .refine((v) => PAN_REGEX.test(v), 'Invalid PAN (e.g. ABCDE1234F)'),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  line1: z.string().min(5).max(200),
  line2: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Must be 6 digits'),
  latitude: z.number({ required_error: 'Select store location on the map', invalid_type_error: 'Select store location on the map' }).min(-90).max(90),
  longitude: z.number({ required_error: 'Select store location on the map', invalid_type_error: 'Select store location on the map' }).min(-180).max(180),
  locationCityId: z.string().optional(),
  locationAreaId: z.string().optional(),
  locationPincodeId: z.string().optional(),
  localityLabel: z.string().optional(),
  cityId: z.string().min(1, 'Select a city'),
  zoneIds: z.array(z.string()).min(1, 'Select at least one delivery zone'),
  phone: z.string().min(10, 'Enter 10-digit mobile'),
  email: z.string().email('Valid email required'),
  deliveryFee: z.coerce.number().min(0).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  avgPrepTimeMins: z.coerce.number().min(1).max(120).optional(),
  logoUrl: z.string().url('Store logo is required'),
  bannerUrl: z.string().url('Store banner is required'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatPhoneE164(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(-10);
  return `+91${d}`;
}

export function CreateStoreModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: cities, isLoading: citiesLoading } = useCitiesQuery();
  const { mutateAsync: createStore, isPending: creating } = useCreateStoreMutation();
  const [submitting, setSubmitting] = useState(false);
  const { mutateAsync: upsertProfile, isPending: savingProfile } = useUpsertMerchantProfileMutation();
  const { setCurrentStore } = useStoreStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      zoneIds: [],
      minOrderAmount: 99,
      deliveryFee: 29,
      avgPrepTimeMins: 15,
    },
  });

  const cityId = watch('cityId');
  const { data: zones } = useZonesQuery(cityId ?? '');

  useEffect(() => {
    if (zones?.length && cityId) {
      setValue('zoneIds', zones.map((z) => z.id));
    }
  }, [zones, cityId, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      await upsertProfile({
        businessName: data.businessName,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
      });

      const store = await createStore({
        name: data.name,
        description: data.description,
        phone: formatPhoneE164(data.phone),
        email: data.email,
        line1: data.line1,
        line2: data.line2,
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
        locationCityId: data.locationCityId,
        locationAreaId: data.locationAreaId,
        locationPincodeId: data.locationPincodeId,
        cityId: data.cityId,
        zoneIds: data.zoneIds,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        minOrderAmount: data.minOrderAmount,
        deliveryFee: data.deliveryFee,
        avgPrepTimeMins: data.avgPrepTimeMins,
      });

      setSubmitting(true);
      await submitStoreForReview(store.id);
      setSubmitting(false);
      await qc.invalidateQueries({ queryKey: ['stores'] });

      setCurrentStore(store);
      toast(
        `Store "${store.name}" submitted for admin review!`,
        'success',
      );
      reset();
      onClose();
    } catch (err) {
      setSubmitting(false);
      toast((err as Error).message ?? 'Failed to create store', 'error');
    }
  };

  const isPending = creating || savingProfile || submitting;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Store"
      description="Billing & compliance details are required. Admin will review before your store goes live."
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button form="create-store-form" type="submit" loading={isPending}>
            Create &amp; Submit for Review
          </Button>
        </div>
      }
    >
      <form id="create-store-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Business & billing (required)</h3>
          <p className="text-xs text-slate-500">
            GSTIN and PAN are mandatory for invoicing, payouts, and compliance — similar to Zomato/Swiggy onboarding.
          </p>
          <Input
            label="Registered business name *"
            error={errors.businessName?.message}
            {...register('businessName')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="GSTIN *"
              placeholder="07AAGCR2206E1ZN"
              error={errors.gstNumber?.message}
              {...register('gstNumber')}
              className="uppercase"
            />
            <Input
              label="PAN *"
              placeholder="ABCDE1234F"
              error={errors.panNumber?.message}
              {...register('panNumber')}
              className="uppercase"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Store details</h3>
          <Input label="Store name *" error={errors.name?.message} {...register('name')} />
          <Textarea label="Description" error={errors.description?.message} {...register('description')} />

          <Controller
            name="cityId"
            control={control}
            render={({ field }) => (
              <Select
                label="City *"
                error={errors.cityId?.message}
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  setValue('zoneIds', []);
                }}
                disabled={citiesLoading}
              >
                <option value="">Select city</option>
                {cities?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.state}
                  </option>
                ))}
              </Select>
            )}
          />

          {zones && zones.length > 0 && (
            <Controller
              name="zoneIds"
              control={control}
              render={({ field }) => (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Delivery zones *</p>
                  <div className="flex flex-wrap gap-2">
                    {zones.map((z) => {
                      const checked = field.value?.includes(z.id);
                      return (
                        <label
                          key={z.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...(field.value ?? []), z.id]
                                : (field.value ?? []).filter((id) => id !== z.id);
                              field.onChange(next);
                            }}
                          />
                          {z.name}
                        </label>
                      );
                    })}
                  </div>
                  {errors.zoneIds && (
                    <p className="mt-1 text-xs text-red-600">{errors.zoneIds.message}</p>
                  )}
                </div>
              )}
            />
          )}

          <Input label="Address line 1 *" error={errors.line1?.message} {...register('line1')} />
          <MerchantAddressPicker
            searchLabel="Store location *"
            value={{
              locality: watch('localityLabel') ?? '',
              city: '',
              state: '',
              pincode: watch('pincode') ?? '',
              lat: watch('latitude') ?? undefined,
              lng: watch('longitude') ?? undefined,
            }}
            onChange={(selection) => {
              setValue('localityLabel', selection.locality);
              setValue('pincode', selection.pincode);
              setValue('latitude', selection.lat);
              setValue('longitude', selection.lng);
              setValue('locationCityId', selection.locationCityId);
              setValue('locationAreaId', selection.locationAreaId);
              setValue('locationPincodeId', selection.locationPincodeId);
            }}
            onLine1Suggestion={(line1) => setValue('line1', line1)}
            error={errors.localityLabel?.message ?? errors.pincode?.message ?? errors.latitude?.message ?? errors.longitude?.message}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Address line 2" {...register('line2')} />
            <Input label="Pincode *" error={errors.pincode?.message} {...register('pincode')} maxLength={6} />
          </div>
          <input type="hidden" {...register('latitude')} />
          <input type="hidden" {...register('longitude')} />
          <input type="hidden" {...register('locationCityId')} />
          <input type="hidden" {...register('locationAreaId')} />
          <input type="hidden" {...register('locationPincodeId')} />
          <input type="hidden" {...register('localityLabel')} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Store phone *"
              type="tel"
              placeholder="10-digit mobile"
              error={errors.phone?.message}
              {...register('phone')}
              maxLength={10}
            />
            <Input label="Store email *" type="email" error={errors.email?.message} {...register('email')} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input label="Min order (₹)" type="number" {...register('minOrderAmount')} />
            <Input label="Delivery fee (₹)" type="number" {...register('deliveryFee')} />
            <Input label="Prep time (min)" type="number" {...register('avgPrepTimeMins')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField
              label="Store logo"
              mode="square"
              purpose="store-logo"
              required
              value={watch('logoUrl')}
              onChange={(url) => setValue('logoUrl', url, { shouldValidate: true })}
              error={errors.logoUrl?.message}
              allowRemove={false}
            />
            <ImageUploadField
              label="Store banner"
              mode="banner"
              purpose="store-banner"
              required
              value={watch('bannerUrl')}
              onChange={(url) => setValue('bannerUrl', url, { shouldValidate: true })}
              error={errors.bannerUrl?.message}
              allowRemove={false}
            />
          </div>
        </section>

        <p className="text-xs text-slate-500">
          Your store will be submitted to the admin review queue immediately after creation.
        </p>
      </form>
    </Modal>
  );
}
