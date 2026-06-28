'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Textarea, Select } from '@/design-system/primitives';
import { useCreateProductMutation, useUpdateProductMutation } from '@/hooks/use-products';
import { useApprovedCategoriesQuery } from '@/hooks/use-categories-governance';
import { useToast } from '@/design-system/primitives';
import { ImageUploadField } from '@/features/media/components/image-upload-field';
import { HsnPicker, type HsnOption } from './hsn-picker';
import type { Product } from '@/types/product';

const schema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  brand: z.string().max(100).optional(),
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
  const { data: categories } = useApprovedCategoriesQuery(storeId);
  const [hsn, setHsn] = useState<HsnOption | null>(null);
  const [taxCategory, setTaxCategory] = useState<'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED'>('GOODS');

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
  });

  const parentCategoryId = useWatch({ control, name: 'parentCategoryId' }) ?? '';
  const subCategoryId = useWatch({ control, name: 'subCategoryId' }) ?? '';

  const approvedParents = categories ?? [];

  const approvedSubcategories = useMemo(() => {
    if (!parentCategoryId) return [];
    return approvedParents.find((c) => c.id === parentCategoryId)?.children ?? [];
  }, [approvedParents, parentCategoryId]);

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
      reset({
        name: editProduct.name,
        description: editProduct.description ?? '',
        brand: editProduct.brand ?? '',
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
      if (editProduct.hsnCodeRef) {
        setHsn({
          id: editProduct.hsnCodeRef.id,
          code: editProduct.hsnCodeRef.code,
          description: editProduct.hsnCodeRef.description,
          defaultGstSlab: editProduct.hsnCodeRef.defaultGstSlab,
        });
      } else {
        setHsn(null);
      }
      setTaxCategory((editProduct.taxCategory as typeof taxCategory) ?? 'GOODS');
    } else {
      reset({
        quantity: 10,
        lowStockThreshold: 5,
        unit: 'piece',
        imageUrl: '',
      });
      setHsn(null);
      setTaxCategory('GOODS');
    }
  }, [editProduct, reset, open, categories]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: FormData) => {
    const categoryId = data.subCategoryId || data.parentCategoryId || undefined;
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
      const { parentCategoryId: _p, subCategoryId: _s, imageUrl, taxInclusive, ...rest } = data;
      const payload = {
        ...rest,
        sku: data.sku || undefined,
        categoryId,
        imageUrls: [imageUrl],
        taxInclusive: taxInclusive ?? false,
        hsnCodeId: hsn?.id,
        gstSlab: hsn?.defaultGstSlab,
        taxCategory,
      };
      if (editProduct) {
        await updateMutation.mutateAsync(payload);
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
        <ImageUploadField
          label="Product image"
          mode="square"
          purpose="product"
          required
          value={watch('imageUrl')}
          onChange={(url) => setValue('imageUrl', url, { shouldValidate: true })}
          error={errors.imageUrl?.message}
          allowRemove={false}
        />
        <Input label="Product name *" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" {...register('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Brand" {...register('brand')} />
          <Input label="SKU" placeholder="e.g. AMUL-MILK" {...register('sku')} error={errors.sku?.message} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" {...register('parentCategoryId')}>
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

        <details className="rounded-lg border border-neutral-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
            Tax & HSN (GST compliance)
          </summary>
          <div className="mt-3 space-y-3">
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
            <HsnPicker value={hsn?.id} onChange={setHsn} />
          </div>
        </details>

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
            <div className="grid grid-cols-2 gap-3">
              <Input label="FSSAI license" {...register('fssaiLicense')} />
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input type="checkbox" {...register('taxInclusive')} className="rounded" />
                Price inclusive of tax
              </label>
            </div>
            <Textarea label="Storage instructions" {...register('storageInstructions')} />
            <Textarea label="Disclaimer" {...register('disclaimer')} />
          </div>
        </details>
      </form>
    </Modal>
  );
}
