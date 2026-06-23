'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Textarea, Select } from '@/design-system/primitives';
import { useCreateProductMutation, useUpdateProductMutation, useCategoriesQuery } from '@/hooks/use-products';
import { useToast } from '@/design-system/primitives';
import type { Product } from '@/types/product';

const schema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  brand: z.string().max(100).optional(),
  sku: z.string().regex(/^[A-Za-z0-9_-]{2,50}$/).optional().or(z.literal('')),
  categoryId: z.string().optional(),
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

export function ProductFormModal({ storeId, open, onClose, editProduct }: Props) {
  const { toast } = useToast();
  const createMutation = useCreateProductMutation(storeId);
  const updateMutation = useUpdateProductMutation(storeId, editProduct?.id ?? '');
  const { data: categories } = useCategoriesQuery(storeId);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (editProduct) {
      reset({
        name: editProduct.name,
        description: editProduct.description ?? '',
        brand: editProduct.brand ?? '',
        sku: editProduct.sku ?? '',
        categoryId: editProduct.categoryId ?? '',
        basePrice: editProduct.basePrice,
        mrp: editProduct.mrp ?? undefined,
        unit: editProduct.unit ?? '',
        quantity: editProduct.variants[0]?.inventory?.quantity ?? 0,
        lowStockThreshold: editProduct.variants[0]?.inventory?.lowStockThreshold ?? undefined,
      });
    } else {
      reset({});
    }
  }, [editProduct, reset, open]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, sku: data.sku || undefined };
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
        <Select label="Category" {...register('categoryId')}>
          <option value="">Uncategorized</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
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
