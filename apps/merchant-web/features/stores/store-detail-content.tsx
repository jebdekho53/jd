'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle, Send, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardBody, Button, Input, Textarea, Spinner } from '@/design-system/primitives';
import { MerchantAddressPicker } from '@/components/google-maps/merchant-address-picker';
import { StoreStatusBadge } from './components/store-status-badge';
import { StoreDocumentsPanel } from './components/store-documents-panel';
import { StoreShareCard } from './components/store-share-card';
import { ImageUploadField } from '@/features/media/components/image-upload-field';
import {
  useStoreQuery,
  useUpdateStoreMutation,
  useSubmitStoreForReviewMutation,
  useUploadVerificationDocumentMutation,
  useSubmitDocumentsForReviewMutation,
} from '@/hooks/use-stores';
import { useToast } from '@/design-system/primitives';

const schema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  phone: z.string().optional(),
  line1: z.string().min(5).max(200),
  line2: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  locationCityId: z.string().optional(),
  locationAreaId: z.string().optional(),
  locationPincodeId: z.string().optional(),
  localityLabel: z.string().optional(),
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
  const uploadDocMutation = useUploadVerificationDocumentMutation(storeId);
  const submitDocsMutation = useSubmitDocumentsForReviewMutation(storeId);
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [brandingDirty, setBrandingDirty] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: store ? {
      name: store.name,
      description: store.description ?? '',
      phone: store.phone ?? '',
      line1: store.line1,
      line2: store.line2 ?? '',
      pincode: store.pincode,
      latitude: store.latitude,
      longitude: store.longitude,
      localityLabel: store.line1,
      deliveryFee: store.deliveryFee,
      minOrderAmount: store.minOrderAmount,
      avgPrepTimeMins: store.avgPrepTimeMins,
    } : undefined,
  });

  useEffect(() => {
    if (store) {
      setLogoUrl(store.logoUrl ?? '');
      setBannerUrl(store.bannerUrl ?? '');
      setBrandingDirty(false);
    }
  }, [store]);

  const onSaveBranding = async () => {
    try {
      await updateMutation.mutateAsync({ logoUrl, bannerUrl });
      setBrandingDirty(false);
      toast('Store branding updated!', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

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

  const canEdit = store.status === 'DRAFT' && !store.merchantProfile?.isBlacklisted;
  const canEditBranding =
    (store.status === 'DRAFT' || store.status === 'APPROVED') && !store.merchantProfile?.isBlacklisted;
  const canSubmit = store.status === 'DRAFT' && !store.merchantProfile?.isBlacklisted;
  const showDocumentsPanel =
    store.status === 'DOCUMENTS_REQUIRED' && !store.merchantProfile?.isBlacklisted;

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

      {store.status === 'APPROVED' && store.slug && (
        <div className="mb-6">
          <StoreShareCard slug={store.slug} name={store.name} />
        </div>
      )}

      {store.status === 'DRAFT' && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Draft store:</strong> Click <em>Submit for Review</em> above to send your application to the admin queue.
        </div>
      )}

      {store.status === 'PENDING_REVIEW' && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Pending review:</strong> Your store is in the admin queue. This typically takes 24–48 hours.
        </div>
      )}

      {store.status === 'UNDER_REVIEW' && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Under review:</strong> Your submitted documents are being reviewed by our compliance team.
        </div>
      )}

      {showDocumentsPanel && (
        <StoreDocumentsPanel
          store={store}
          isUploading={uploadDocMutation.isPending}
          isSubmitting={submitDocsMutation.isPending}
          onUpload={async (payload) => {
            try {
              await uploadDocMutation.mutateAsync(payload);
              toast('Document uploaded', 'success');
            } catch (err) {
              toast((err as Error).message, 'error');
              throw err;
            }
          }}
          onSubmitDocuments={async () => {
            try {
              await submitDocsMutation.mutateAsync();
              toast('Documents submitted for review!', 'success');
            } catch (err) {
              toast((err as Error).message, 'error');
            }
          }}
        />
      )}

      {store.status === 'APPROVED' && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> Your store is approved and live!
        </div>
      )}

      {store.status === 'REJECTED' && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-center gap-2 font-semibold">
            <XCircle className="h-4 w-4" />
            {store.merchantProfile?.isBlacklisted ? 'Account permanently blocked' : 'Application rejected'}
          </div>
          {store.rejectionType && (
            <p className="mt-1 text-xs uppercase tracking-wide text-red-700">
              {store.rejectionType.replace(/_/g, ' ')}
            </p>
          )}
          {store.rejectionReason && <p className="mt-1">{store.rejectionReason}</p>}
          {store.merchantProfile?.isBlacklisted ? (
            <p className="mt-2 text-xs">
              This merchant account has been permanently blocked due to policy violations.
            </p>
          ) : store.rejectionType &&
            (['DOCUMENT_ISSUE', 'COMPLIANCE_ISSUE'] as const).includes(
              store.rejectionType as 'DOCUMENT_ISSUE' | 'COMPLIANCE_ISSUE',
            ) ? (
            <p className="mt-2 text-xs">
              Your application may be reopened by the compliance team after review.
            </p>
          ) : null}
        </div>
      )}

      <Card className="mb-4">
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Store branding</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField
              label="Store logo"
              mode="square"
              purpose="store-logo"
              required={canSubmit}
              value={logoUrl}
              onChange={(url) => {
                setLogoUrl(url);
                setBrandingDirty(true);
              }}
              allowRemove={!canSubmit}
            />
            <ImageUploadField
              label="Store banner"
              mode="banner"
              purpose="store-banner"
              required={canSubmit}
              value={bannerUrl}
              onChange={(url) => {
                setBannerUrl(url);
                setBrandingDirty(true);
              }}
              allowRemove={!canSubmit}
            />
          </div>
          {canEditBranding && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void onSaveBranding()}
                loading={updateMutation.isPending}
                disabled={!brandingDirty}
              >
                Save branding
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

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
            {canEdit && (
              <MerchantAddressPicker
                searchLabel="Store location"
                value={{
                  locality: watch('localityLabel') ?? '',
                  city: '',
                  state: '',
                  pincode: watch('pincode') ?? '',
                  lat: watch('latitude') ?? store.latitude,
                  lng: watch('longitude') ?? store.longitude,
                }}
                onChange={(selection) => {
                  setValue('localityLabel', selection.locality, { shouldDirty: true });
                  setValue('pincode', selection.pincode, { shouldDirty: true });
                  setValue('latitude', selection.lat, { shouldDirty: true });
                  setValue('longitude', selection.lng, { shouldDirty: true });
                  setValue('locationCityId', selection.locationCityId, { shouldDirty: true });
                  setValue('locationAreaId', selection.locationAreaId, { shouldDirty: true });
                  setValue('locationPincodeId', selection.locationPincodeId, { shouldDirty: true });
                }}
                onLine1Suggestion={(line1) => setValue('line1', line1, { shouldDirty: true })}
                error={errors.pincode?.message}
              />
            )}
            <div className="grid grid-cols-3 gap-3">
              <Input label="Min order (₹)" type="number" {...register('minOrderAmount')} disabled={!canEdit} />
              <Input label="Delivery fee (₹)" type="number" {...register('deliveryFee')} disabled={!canEdit} />
              <Input label="Prep time (min)" type="number" {...register('avgPrepTimeMins')} disabled={!canEdit} />
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
