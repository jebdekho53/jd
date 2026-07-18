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
  resolveCategoryFromPath,
  requiresFssaiForCategory,
  pickStoreFssaiLicense,
} from '../product-visibility.util';
import { ProductVisibilityNotice } from './product-visibility-notice';
import { PRODUCT_UNITS, normalizeUnit } from '@/features/products/product-units';
import { CategoryCascadeSelect, findCategoryPath } from './category-cascade-select';
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
  // The DEEPEST category chosen. The cascade picker walks the tree to any depth,
  // so this may be an L3/L4 node — the old parent/sub/leaf trio capped it at 3.
  categoryId: z.string().optional(),
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
}).refine((d) => Boolean(d.categoryId?.trim()), {
  message: 'Category is required for buyers to find this product',
  path: ['categoryId'],
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

export function ProductFormModal({ storeId, open, onClose, editProduct }: Props) {
  const { toast } = useToast();
  const createMutation = useCreateProductMutation(storeId);
  const updateMutation = useUpdateProductMutation(storeId, editProduct?.id ?? '');
  const { data: catalogProducts } = useProductsQuery(storeId, { limit: 100 });
  const { data: categories } = useApprovedCategoriesQuery(storeId);
  const [hsn, setHsn] = useState<HsnOption | null>(null);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const [sizeVariants, setSizeVariants] = useState<
    { size: string; color: string; sku: string; price: string; mrp: string; stock: string }[]
  >([]);
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

  const categoryId = useWatch({ control, name: 'categoryId' }) ?? '';

  const approvedParents = categories ?? [];

  const categoryPath = useMemo(
    () => findCategoryPath(approvedParents, categoryId),
    [approvedParents, categoryId],
  );

  const selectedCategory = useMemo(() => resolveCategoryFromPath(categoryPath), [categoryPath]);

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
    if (editProduct) {
      setSpecs(Array.isArray(editProduct.specifications) ? editProduct.specifications : []);
      // Load size/colour variants (non-default ones with a size or colour).
      setSizeVariants(
        (editProduct.variants ?? [])
          .filter((v) => !v.isDefault && (v.size || v.color))
          .map((v) => ({
            size: v.size ?? '',
            color: v.color ?? '',
            sku: v.sku ?? '',
            price: String(v.price ?? ''),
            mrp: v.mrp != null ? String(v.mrp) : '',
            stock: String(v.inventory?.availableQty ?? 0),
          })),
      );
      reset({
        name: editProduct.name,
        description: editProduct.description ?? '',
        brand: editProduct.brand ?? '',
        modelNumber: editProduct.modelNumber ?? '',
        warrantyMonths: editProduct.warrantyMonths ?? undefined,
        sku: editProduct.sku ?? '',
        categoryId: editProduct.categoryId ?? '',
        basePrice: editProduct.basePrice,
        mrp: editProduct.mrp ?? undefined,
        unit: normalizeUnit(editProduct.unit),
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
    const categoryId = data.categoryId || undefined;
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

    // The picker only offers approved nodes, but a stale value (e.g. an edited
    // product whose category was later un-approved) must still be caught.
    if (categoryId && categoryPath.length === 0) {
      toast('Selected category is not approved for this store.', 'error');
      return;
    }

    try {
      const { categoryId: _c, imageUrl, taxInclusive, fssaiLicense, ...rest } = data;
      const resolvedFssai =
        needsFssai ? (fssaiLicense?.trim() || storeDefaultFssai) : fssaiLicense?.trim() || undefined;
      const cleanSpecs = specs
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => s.label && s.value);
      const cleanVariants = sizeVariants
        .filter((v) => (v.size.trim() || v.color.trim()) && v.sku.trim() && Number(v.price) > 0)
        .map((v) => ({
          sku: v.sku.trim(),
          name: [v.size.trim(), v.color.trim()].filter(Boolean).join(' / ') || v.sku.trim(),
          size: v.size.trim() || undefined,
          color: v.color.trim() || undefined,
          price: Number(v.price),
          mrp: v.mrp && Number(v.mrp) > 0 ? Number(v.mrp) : undefined,
          quantity: Number(v.stock) || 0,
        }));
      const payload = {
        ...rest,
        sku: data.sku || undefined,
        modelNumber: data.modelNumber?.trim() || undefined,
        warrantyMonths:
          data.warrantyMonths != null && !Number.isNaN(data.warrantyMonths) && data.warrantyMonths > 0
            ? data.warrantyMonths
            : undefined,
        specifications: cleanSpecs.length > 0 ? cleanSpecs : undefined,
        variants: cleanVariants.length > 0 ? cleanVariants : undefined,
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
        const { quantity: _quantity, lowStockThreshold: _lowStockThreshold, variants: _variants, ...updatePayload } = payload;
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

        {/* Fashion / footwear — sizes & colours. Each row is a buyable variant. */}
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Sizes &amp; colours (fashion / footwear) — optional
          </summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-500">
              Add each size/colour a customer can buy (e.g. S–Blue, M–Blue). Leave empty for
              non-fashion products.
            </p>
            {sizeVariants.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input className="col-span-2 rounded-lg border px-2 py-1.5 text-sm" placeholder="Size" value={v.size}
                  onChange={(e) => setSizeVariants((c) => c.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} />
                <input className="col-span-2 rounded-lg border px-2 py-1.5 text-sm" placeholder="Colour" value={v.color}
                  onChange={(e) => setSizeVariants((c) => c.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} />
                <input className="col-span-3 rounded-lg border px-2 py-1.5 text-sm" placeholder="SKU" value={v.sku}
                  onChange={(e) => setSizeVariants((c) => c.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} />
                <input className="col-span-2 rounded-lg border px-2 py-1.5 text-sm" placeholder="Price" inputMode="numeric" value={v.price}
                  onChange={(e) => setSizeVariants((c) => c.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
                <input className="col-span-2 rounded-lg border px-2 py-1.5 text-sm" placeholder="Stock" inputMode="numeric" value={v.stock}
                  onChange={(e) => setSizeVariants((c) => c.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} />
                <button type="button" aria-label="Remove" className="col-span-1 rounded-lg border text-sm text-red-600"
                  onClick={() => setSizeVariants((c) => c.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className="text-sm font-medium text-emerald-700"
              onClick={() => setSizeVariants((c) => [...c, { size: '', color: '', sku: '', price: '', mrp: '', stock: '' }])}>
              + Add size / colour
            </button>
          </div>
        </details>

        <CategoryCascadeSelect
          required
          categories={approvedParents}
          value={categoryId}
          error={errors.categoryId?.message}
          onChange={(id) => setValue('categoryId', id, { shouldValidate: true })}
        />
        {approvedParents.length === 0 && (
          <p className="text-xs text-amber-700">
            No approved categories. Request access from{' '}
            <a href="/categories" className="underline">Business Categories</a>.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Input label="Price (₹) *" type="number" step="0.01" error={errors.basePrice?.message} {...register('basePrice')} />
          <Input label="MRP (₹)" type="number" step="0.01" {...register('mrp')} />
          <Select label="Unit" {...register('unit')}>
            {PRODUCT_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </Select>
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
