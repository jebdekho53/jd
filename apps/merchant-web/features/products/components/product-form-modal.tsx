'use client';

import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Textarea, Select } from '@/design-system/primitives';
import { useCreateProductMutation, useUpdateProductMutation } from '@/hooks/use-products';
import { useApprovedCategoriesQuery } from '@/hooks/use-categories-governance';
import { useToast } from '@/design-system/primitives';
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

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
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
      });
    } else {
      reset({
        quantity: 10,
        lowStockThreshold: 5,
        unit: 'piece',
      });
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
      const { parentCategoryId: _p, subCategoryId: _s, ...rest } = data;
      const payload = {
        ...rest,
        sku: data.sku || undefined,
        categoryId,
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
      </form>
    </Modal>
  );
}
