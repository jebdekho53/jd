'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardBody, Button, Input, Textarea, Spinner } from '@/design-system/primitives';
import { StoreStatusBadge } from './components/store-status-badge';
import { useStoreQuery, useUpdateStoreMutation, useSubmitStoreForReviewMutation } from '@/hooks/use-stores';
import { useToast } from '@/design-system/primitives';

const schema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  phone: z.string().optional(),
  line1: z.string().min(5).max(200),
  line2: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/),
  deliveryFee: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0),
  avgPrepTimeMins: z.coerce.number().min(1).max(120),
});

type FormData = z.infer<typeof schema>;

export function StoreDetailContent({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const { data: store, isLoading } = useStoreQuery(storeId);
  const updateMutation = useUpdateStoreMutation(storeId);
  const submitMutation = useSubmitStoreForReviewMutation(storeId);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: store ? {
      name: store.name,
      description: store.description ?? '',
      phone: store.phone ?? '',
      line1: store.line1,
      line2: store.line2 ?? '',
      pincode: store.pincode,
      deliveryFee: store.deliveryFee,
      minOrderAmount: store.minOrderAmount,
      avgPrepTimeMins: store.avgPrepTimeMins,
    } : undefined,
  });

  const onSave = async (data: FormData) => {
    try {
      await updateMutation.mutateAsync(data);
      toast('Store updated!', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const handleSubmitReview = async () => {
    try {
      await submitMutation.mutateAsync();
      toast('Store submitted for review!', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!store) return <p className="text-red-600">Store not found.</p>;

  const canEdit = store.status === 'DRAFT' || store.status === 'REJECTED';
  const canSubmit = store.status === 'DRAFT' || store.status === 'REJECTED';

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/stores">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Stores</Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{store.name}</h1>
            <StoreStatusBadge status={store.status} />
          </div>
        </div>
        {canSubmit && (
          <Button
            onClick={handleSubmitReview}
            loading={submitMutation.isPending}
            variant="primary"
          >
            <Send className="h-4 w-4" /> Submit for Review
          </Button>
        )}
      </div>

      {store.status === 'PENDING_REVIEW' && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Under review:</strong> Your store is being reviewed by our team. This typically takes 24–48 hours.
        </div>
      )}

      {store.status === 'APPROVED' && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> Your store is approved and live!
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Store Details</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <Input label="Store name" error={errors.name?.message} disabled={!canEdit} {...register('name')} />
            <Textarea label="Description" error={errors.description?.message} disabled={!canEdit} {...register('description')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Phone" {...register('phone')} disabled={!canEdit} />
              <Input label="Pincode" {...register('pincode')} disabled={!canEdit} />
            </div>
            <Input label="Address line 1" error={errors.line1?.message} disabled={!canEdit} {...register('line1')} />
            <Input label="Address line 2" {...register('line2')} disabled={!canEdit} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Min order (₹)" type="number" {...register('minOrderAmount')} />
              <Input label="Delivery fee (₹)" type="number" {...register('deliveryFee')} />
              <Input label="Prep time (min)" type="number" {...register('avgPrepTimeMins')} />
            </div>
            {canEdit && (
              <div className="flex justify-end">
                <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty}>
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardBody>
      </Card>
    </>
  );
}
