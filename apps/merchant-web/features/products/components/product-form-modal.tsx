'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Textarea, Select } from '@/design-system/primitives';
import { useCreateProductMutation, useUpdateProductMutation, useProductsQuery } from '@/hooks/use-products';
import { useApprovedCategoriesQuery } from '@/hooks/use-categories-governance';
import { useToast } from '@/design-system/primitives';
import { ImageUploadField } from '@/features/media/components/image-upload-field';
import { HsnPicker, type HsnOption } from './hsn-picker';
import type { Product } from '@/types/product';
import {
  getProductVisibilityGaps,
  isBrokenProductImageUrl,
  resolveFormCategory,
  requiresFssaiForCategory,
  pickStoreFssaiLicense,
} from '../product-visibility.util';
import { ProductVisibilityNotice } from './product-visibility-notice';
import {
  DEFAULT_RETURN_POLICY,
  ProductReturnPolicySection,
  type ProductReturnPolicyFormState,
} from './product-return-policy-section';

const schema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  brand: z.string().max(100).optional(),
  modelNumber: z.string().max(120).optional(),
  warrantyMonths: z.coerce.number().min(0).max(120).optional(),
  sku: z.string().regex(/^[A-Za-z0-9_-]{2,50}$/).optional().or(z.literal('')),
  parentCategoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  basePrice: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0).optional(),
  unit: z.string().optional(),
  quantity: z.coerce.number().min(0).optional(),
  lowStockThreshold: z.coerce.number().min(0).optional(),
  imageUrl: z.string().url('Product image is required'),
  ingredients: z.string().max(5000).optional(),
  shelfLife: z.string().max(200).optional(),
  countryOfOrigin: z.string().max(100).optional(),
  manufacturerName: z.string().max(200).optional(),
  manufacturerAddress: z.string().max(1000).optional(),
  fssaiLicense: z.string().max(50).optional(),
  storageInstructions: z.string().max(2000).optional(),
  disclaimer: z.string().max(2000).optional(),
  taxInclusive: z.boolean().optional(),
}).refine((d) => !d.mrp || d.basePrice <= d.mrp, {
  message: 'Price must be ≤ MRP',
  path: ['basePrice'],
}).refine((d) => Boolean(d.parentCategoryId?.trim()), {
  message: 'Category is required for buyers to find this product',
  path: ['parentCategoryId'],
}).refine((d) => !isBrokenProductImageUrl(d.imageUrl), {
  message: 'Upload a new image — local or HTTP URLs are not visible to buyers',
  path: ['imageUrl'],
});

type FormData = z.infer<typeof schema>;

interface Props {
  storeId: string;
  open: boolean;
  onClose: () => void;
  editProduct?: Product | null;
}

function resolveCategoryFields(
  categoryId: string | null | undefined,
  categories: { id: string; children?: { id: string }[] }[],
): { parentCategoryId: string; subCategoryId: string } {
  if (!categoryId) return { parentCategoryId: '', subCategoryId: '' };

  const asParent = categories.find((c) => c.id === categoryId);
  if (asParent) return { parentCategoryId: categoryId, subCategoryId: '' };

  for (const parent of categories) {
    const child = parent.children?.find((ch) => ch.id === categoryId);
    if (child) return { parentCategoryId: parent.id, subCategoryId: child.id };
  }

  return { parentCategoryId: '', subCategoryId: '' };
}

export function ProductFormModal({ storeId, open, onClose, editProduct }: Props) {
  const { toast } = useToast();
  const createMutation = useCreateProductMutation(storeId);
  const updateMutation = useUpdateProductMutation(storeId, editProduct?.id ?? '');
  const { data: catalogProducts } = useProductsQuery(storeId, { limit: 100 });
  const { data: categories } = useApprovedCategoriesQuery(storeId);
  const [hsn, setHsn] = useState<HsnOption | null>(null);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const [taxCategory, setTaxCategory] = useState<'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED'>('GOODS');
  const [hsnError, setHsnError] = useState<string | null>(null);
  const [fssaiError, setFssaiError] = useState<string | null>(null);
  const [returnPolicy, setReturnPolicy] = useState<ProductReturnPolicyFormState>(DEFAULT_RETURN_POLICY);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const parentCategoryId = useWatch({ control, name: 'parentCategoryId' }) ?? '';
  const subCategoryId = useWatch({ control, name: 'subCategoryId' }) ?? '';

  const approvedParents = categories ?? [];

  const approvedSubcategories = useMemo(() => {
    if (!parentCategoryId) return [];
    return approvedParents.find((c) => c.id === parentCategoryId)?.children ?? [];
  }, [approvedParents, parentCategoryId]);

  const selectedCategory = useMemo(
    () => resolveFormCategory(parentCategoryId, subCategoryId, approvedParents),
    [parentCategoryId, subCategoryId, approvedParents],
  );

  const needsFssai = requiresFssaiForCategory(selectedCategory);

  const storeDefaultFssai = useMemo(
    () => pickStoreFssaiLicense(catalogProducts?.data ?? []),
    [catalogProducts?.data],
  );

  const visibilityGaps = useMemo(
    () =>
      editProduct
        ? getProductVisibilityGaps(editProduct, taxCategory, storeDefaultFssai)
        : [],
    [editProduct, taxCategory, storeDefaultFssai],
  );

  const imageUrl = watch('imageUrl');
  const imageBroken = Boolean(imageUrl && isBrokenProductImageUrl(imageUrl));

  useEffect(() => {
    if (!parentCategoryId) {
      setValue('subCategoryId', '');
      return;
    }
    if (subCategoryId && !approvedSubcategories.some((c) => c.id === subCategoryId)) {
      setValue('subCategoryId', '');
    }
  }, [parentCategoryId, subCategoryId, approvedSubcategories, setValue]);

  useEffect(() => {
    if (editProduct) {
      const { parentCategoryId: parentId, subCategoryId: subId } = resolveCategoryFields(
        editProduct.categoryId,
        categories ?? [],
      );
      setSpecs(Array.isArray(editProduct.specifications) ? editProduct.specifications : []);
      reset({
        name: editProduct.name,
        description: editProduct.description ?? '',
        brand: editProduct.brand ?? '',
        modelNumber: editProduct.modelNumber ?? '',
        warrantyMonths: editProduct.warrantyMonths ?? undefined,
        sku: editProduct.sku ?? '',
        parentCategoryId: parentId,
        subCategoryId: subId,
        basePrice: editProduct.basePrice,
        mrp: editProduct.mrp ?? undefined,
        unit: editProduct.unit ?? '',
        quantity: editProduct.variants[0]?.inventory?.availableQty ?? 0,
        lowStockThreshold: editProduct.variants[0]?.inventory?.lowStockThreshold ?? undefined,
        imageUrl: editProduct.imageUrls[0] ?? '',
        ingredients: editProduct.ingredients ?? '',
        shelfLife: editProduct.shelfLife ?? '',
        countryOfOrigin: editProduct.countryOfOrigin ?? '',
        manufacturerName: editProduct.manufacturerName ?? '',
        manufacturerAddress: editProduct.manufacturerAddress ?? '',
        fssaiLicense: editProduct.fssaiLicense ?? '',
        storageInstructions: editProduct.storageInstructions ?? '',
        disclaimer: editProduct.disclaimer ?? '',
        taxInclusive: editProduct.taxInclusive ?? false,
      });
      setTaxCategory((editProduct.taxCategory as typeof taxCategory) ?? 'GOODS');
      setReturnPolicy({
        isReturnable: editProduct.isReturnable ?? false,
        isRefundable: editProduct.isRefundable ?? false,
        isReplaceable: editProduct.isReplaceable ?? false,
        returnWindowHours: editProduct.returnWindowHours ?? undefined,
        approvalMode: editProduct.approvalMode ?? 'MANUAL',
        proofRequired: editProduct.proofRequired ?? 'NONE',
        autoApproveBelowAmount: editProduct.autoApproveBelowAmount ?? undefined,
        returnReasons: editProduct.returnReasons ?? [],
        refundMethod: editProduct.refundMethod ?? 'ORIGINAL_PAYMENT',
        preparedFoodPolicy: editProduct.preparedFoodPolicy ?? undefined,
        allowCustomerChangedMind: editProduct.allowCustomerChangedMind ?? false,
        returnPolicyText: editProduct.returnPolicyText ?? undefined,
        replacementPolicyText: editProduct.replacementPolicyText ?? undefined,
      });
    } else {
      reset({
        quantity: 10,
        lowStockThreshold: 5,
        unit: 'piece',
        imageUrl: '',
      });
      setTaxCategory('GOODS');
      setReturnPolicy(DEFAULT_RETURN_POLICY);
    }
  }, [editProduct, reset, open, categories]);

  // Initialise the HSN selection only when the modal (re)opens or the edited
  // product changes. Keeping this separate from the category-driven reset above
  // prevents an async `categories` refetch from wiping a user's HSN selection.
  useEffect(() => {
    if (editProduct?.hsnCodeRef) {
      setHsn({
        id: editProduct.hsnCodeRef.id,
        code: editProduct.hsnCodeRef.code,
        description: editProduct.hsnCodeRef.description,
        defaultGstSlab: editProduct.hsnCodeRef.defaultGstSlab,
      });
    } else {
      setHsn(null);
    }
  }, [editProduct, open]);

  useEffect(() => {
    if (!open || !needsFssai || !storeDefaultFssai) return;
    if (getValues('fssaiLicense')?.trim()) return;
    setValue('fssaiLicense', storeDefaultFssai, { shouldDirty: false });
  }, [open, needsFssai, storeDefaultFssai, setValue, getValues]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: FormData) => {
    const categoryId = data.subCategoryId || data.parentCategoryId || undefined;
    setHsnError(null);
    setFssaiError(null);

    if (!hsn) {
      setHsnError('HSN code is required for every product');
      toast('Select an HSN code for GST compliance and shipping', 'error');
      return;
    }
    if (needsFssai) {
      const fssai = data.fssaiLicense?.trim() || storeDefaultFssai;
      if (!fssai) {
        setFssaiError('FSSAI license is required for this category');
        toast('Enter your store FSSAI license once — it will apply to all food & grocery products', 'error');
        return;
      }
    }

    if (data.subCategoryId && data.parentCategoryId) {
      const validChild = approvedSubcategories.some((c) => c.id === data.subCategoryId);
      if (!validChild) {
        toast('Selected sub category is not approved for this store.', 'error');
        return;
      }
    } else if (data.parentCategoryId) {
      const validParent = approvedParents.some((c) => c.id === data.parentCategoryId);
      if (!validParent) {
        toast('Selected category is not approved for this store.', 'error');
        return;
      }
    }

    try {
      const { parentCategoryId: _p, subCategoryId: _s, imageUrl, taxInclusive, fssaiLicense, ...rest } = data;
      const resolvedFssai =
        needsFssai ? (fssaiLicense?.trim() || storeDefaultFssai) : fssaiLicense?.trim() || undefined;
      const cleanSpecs = specs
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => s.label && s.value);
      const payload = {
        ...rest,
        sku: data.sku || undefined,
        modelNumber: data.modelNumber?.trim() || undefined,
        warrantyMonths:
          data.warrantyMonths != null && !Number.isNaN(data.warrantyMonths) && data.warrantyMonths > 0
            ? data.warrantyMonths
            : undefined,
        specifications: cleanSpecs.length > 0 ? cleanSpecs : undefined,
        categoryId,
        imageUrls: [imageUrl],
        taxInclusive: taxInclusive ?? false,
        hsnCodeId: hsn.id,
        gstSlab: hsn.defaultGstSlab,
        taxCategory,
        ...(resolvedFssai ? { fssaiLicense: resolvedFssai } : {}),
        ...returnPolicy,
        preparedFoodPolicy: returnPolicy.preparedFoodPolicy || undefined,
      };
      if (editProduct) {
        // Stock is managed via a dedicated inventory endpoint, so the product
        // update DTO rejects these fields — strip them on the edit path.
        const { quantity: _quantity, lowStockThreshold: _lowStockThreshold, ...updatePayload } = payload;
        await updateMutation.mutateAsync(updatePayload);
        toast('Product updated!', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        toast('Product created!', 'success');
      }
      onClose();
    } catch (err) {
      toast((err as Error).message ?? 'Failed', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editProduct ? 'Edit Product' : 'Create Product'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button form="product-form" type="submit" loading={isPending}>
            {editProduct ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {(visibilityGaps.length > 0 || imageBroken) && (
          <ProductVisibilityNotice
            gaps={
              imageBroken && !visibilityGaps.includes('image')
                ? (['image', ...visibilityGaps] as typeof visibilityGaps)
                : visibilityGaps
            }
          />
        )}

        <ImageUploadField
          label="Product image"
          mode="square"
          purpose="product"
          required
          value={imageUrl}
          onChange={(url) => setValue('imageUrl', url, { shouldValidate: true })}
          error={errors.imageUrl?.message}
          hint={imageBroken ? 'Re-upload required for buyer visibility' : undefined}
          allowRemove={false}
        />
        <Input label="Product name *" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" {...register('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Brand" {...register('brand')} />
          <Input label="SKU" placeholder="e.g. AMUL-MILK" {...register('sku')} error={errors.sku?.message} />
        </div>

        {/* Electronics / gadgets — optional. Fill for phones, appliances, gadgets. */}
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Electronics details (model, warranty, specs) — optional
          </summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Model number" placeholder="e.g. SM-A546E" {...register('modelNumber')} />
              <Input label="Warranty (months)" type="number" placeholder="e.g. 12" {...register('warrantyMonths')} error={errors.warrantyMonths?.message} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Specifications</label>
              <div className="space-y-2">
                {specs.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="w-1/3 rounded-lg border px-3 py-2 text-sm"
                      placeholder="Label (e.g. RAM)"
                      value={s.label}
                      onChange={(e) => setSpecs((cur) => cur.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    />
                    <input
                      className="flex-1 rounded-lg border px-3 py-2 text-sm"
                      placeholder="Value (e.g. 8 GB)"
                      value={s.value}
                      onChange={(e) => setSpecs((cur) => cur.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                    />
                    <button
                      type="button"
                      onClick={() => setSpecs((cur) => cur.filter((_, j) => j !== i))}
                      className="rounded-lg border px-2 text-sm text-red-600"
                      aria-label="Remove spec"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSpecs((cur) => [...cur, { label: '', value: '' }])}
                  className="text-sm font-medium text-emerald-700"
                >
                  + Add specification
                </button>
              </div>
            </div>
          </div>
        </details>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category *" error={errors.parentCategoryId?.message} {...register('parentCategoryId')}>
            <option value="">Select category</option>
            {approvedParents.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select
            label="Sub category"
            {...register('subCategoryId')}
            disabled={!parentCategoryId || approvedSubcategories.length === 0}
          >
            <option value="">
              {!parentCategoryId
                ? 'Select category first'
                : approvedSubcategories.length === 0
                  ? 'No sub categories'
                  : 'Optional — none'}
            </option>
            {approvedSubcategories.map((ch) => (
              <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </Select>
        </div>
        {approvedParents.length === 0 && (
          <p className="text-xs text-amber-700">
            No approved categories. Request access from{' '}
            <a href="/categories" className="underline">Business Categories</a>.
          </p>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Input label="Price (₹) *" type="number" step="0.01" error={errors.basePrice?.message} {...register('basePrice')} />
          <Input label="MRP (₹)" type="number" step="0.01" {...register('mrp')} />
          <Input label="Unit" placeholder="kg / piece" {...register('unit')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Opening stock" type="number" {...register('quantity')} />
          <Input label="Low stock alert" type="number" {...register('lowStockThreshold')} />
        </div>

        <details
          open
          className="rounded-lg border border-neutral-200 p-3"
        >
          <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
            Tax & HSN (GST compliance) *
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-amber-700">
              HSN is required for every product for GST compliance and shipping.
              {needsFssai && ' FSSAI is also required for this category.'}
                {needsFssai && storeDefaultFssai && (
                  <span className="block mt-1">
                    Using your store FSSAI from another product — change here only if this item needs a different license.
                  </span>
                )}
            </p>
            <Select
              label="Tax category"
              value={taxCategory}
              onChange={(e) => setTaxCategory(e.target.value as typeof taxCategory)}
            >
              <option value="GOODS">Goods</option>
              <option value="SERVICES">Services</option>
              <option value="EXEMPT">Exempt</option>
              <option value="NIL_RATED">Nil rated</option>
            </Select>
            <HsnPicker
              value={hsn?.id}
              selectedOption={hsn}
              required
              error={hsnError ?? undefined}
              onChange={(next) => {
                setHsn(next);
                setHsnError(null);
              }}
            />
            {needsFssai && (
              <Input
                label="FSSAI license *"
                placeholder="14-digit FSSAI number"
                error={fssaiError ?? undefined}
                {...register('fssaiLicense', {
                  onChange: () => setFssaiError(null),
                })}
              />
            )}
          </div>
        </details>

        <ProductReturnPolicySection
          value={returnPolicy}
          onChange={setReturnPolicy}
          onSuggestAi={() => {
            const name = getValues('name') || editProduct?.name || '';
            const slug = selectedCategory?.slug ?? '';
            const isFood = needsFssai;
            const suggested =
              name.toLowerCase().includes('milk')
                ? { isReplaceable: true, returnWindowHours: 2, returnReasons: ['QUALITY_ISSUE', 'DAMAGED'] }
                : name.toLowerCase().includes('rice')
                  ? { isRefundable: true, isReplaceable: true, returnWindowHours: 72 }
                  : isFood
                    ? { isRefundable: true, returnWindowHours: 2, preparedFoodPolicy: 'REFUND_ONLY' }
                    : { isRefundable: true, isReplaceable: true, returnWindowHours: 24 };
            setReturnPolicy({ ...returnPolicy, ...suggested });
            toast('AI suggestion applied — review and save', 'success');
          }}
        />

        <details className="rounded-lg border border-neutral-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
            Compliance & product details (optional)
          </summary>
          <div className="mt-3 space-y-3">
            <Textarea label="Ingredients" {...register('ingredients')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Shelf life" placeholder="e.g. 6 months" {...register('shelfLife')} />
              <Input label="Country of origin" {...register('countryOfOrigin')} />
            </div>
            <Input label="Manufacturer name" {...register('manufacturerName')} />
            <Textarea label="Manufacturer address" {...register('manufacturerAddress')} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('taxInclusive')} className="rounded" />
              Price inclusive of tax
            </label>
            <Textarea label="Storage instructions" {...register('storageInstructions')} />
            <Textarea label="Disclaimer" {...register('disclaimer')} />
          </div>
        </details>
      </form>
    </Modal>
  );
}
