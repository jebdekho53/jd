'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Textarea } from '@/design-system/primitives';
import { useCreateStoreMutation } from '@/hooks/use-stores';
import { useToast } from '@/design-system/primitives';
import { useStoreStore } from '@/store/store-store';

const schema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  line1: z.string().min(5).max(200),
  line2: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Must be 6 digits'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  cityId: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  avgPrepTimeMins: z.coerce.number().min(1).max(120).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateStoreModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const { mutateAsync, isPending } = useCreateStoreMutation();
  const { setCurrentStore } = useStoreStore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const store = await mutateAsync({
        ...data,
        latitude: data.latitude,
        longitude: data.longitude,
      });
      setCurrentStore(store);
      toast(`Store "${store.name}" created!`, 'success');
      reset();
      onClose();
    } catch (err) {
      toast((err as Error).message ?? 'Failed to create store', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Store"
      description="Fill in the basic details. You can complete the rest later."
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button form="create-store-form" type="submit" loading={isPending}>Create Store</Button>
        </div>
      }
    >
      <form id="create-store-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Store name *" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" error={errors.description?.message} {...register('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" {...register('phone')} placeholder="+91..." />
          <Input label="City ID *" error={errors.cityId?.message} {...register('cityId')} />
        </div>
        <Input label="Address line 1 *" error={errors.line1?.message} {...register('line1')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Address line 2" {...register('line2')} />
          <Input label="Pincode *" error={errors.pincode?.message} {...register('pincode')} maxLength={6} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Latitude *" type="number" step="0.0001" error={errors.latitude?.message} {...register('latitude')} />
          <Input label="Longitude *" type="number" step="0.0001" error={errors.longitude?.message} {...register('longitude')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Min order (₹)" type="number" {...register('minOrderAmount')} />
          <Input label="Delivery fee (₹)" type="number" {...register('deliveryFee')} />
          <Input label="Prep time (min)" type="number" {...register('avgPrepTimeMins')} />
        </div>
      </form>
    </Modal>
  );
}
