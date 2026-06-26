'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createGlobalCategory,
  deleteGlobalCategory,
  listGlobalCategories,
  updateGlobalCategory,
} from '@/services/admin-api';
import type { GlobalCategory } from '@/types/category-governance';
import { Badge, Button, Input, Modal } from '@/design-system';
import { ImageUploadField } from '@/features/media/components/image-upload-field';

type FormMode =
  | { type: 'create-parent' }
  | { type: 'create-child'; parent: GlobalCategory }
  | { type: 'edit'; category: GlobalCategory; parent?: GlobalCategory };

export function CatalogManagementContent() {
  const qc = useQueryClient();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);

  const { data: categories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'catalog'],
    queryFn: listGlobalCategories,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'catalog'] });

  const createMutation = useMutation({
    mutationFn: createGlobalCategory,
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateGlobalCategory>[1] }) =>
      updateGlobalCategory(id, payload),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGlobalCategory,
    onSuccess: invalidate,
  });

  function openCreateParent() {
    setFormMode({ type: 'create-parent' });
    setName('');
    setSortOrder(categories.length);
    setImageUrl('');
    setIsActive(true);
  }

  function openCreateChild(parent: GlobalCategory) {
    setFormMode({ type: 'create-child', parent });
    setName('');
    setSortOrder(parent.children.length);
    setImageUrl('');
    setIsActive(true);
    setImageError(null);
  }

  function openEdit(category: GlobalCategory, parent?: GlobalCategory) {
    setFormMode({ type: 'edit', category, parent });
    setName(category.name);
    setSortOrder(category.sortOrder);
    setImageUrl(category.imageUrl ?? '');
    setIsActive(category.isActive);
    setImageError(null);
  }

  function closeForm() {
    setFormMode(null);
    setImageError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formMode || !name.trim()) return;

    const isCreate = formMode.type === 'create-parent' || formMode.type === 'create-child';
    if (isCreate && !imageUrl) {
      setImageError('A square 1:1 image is required');
      return;
    }

    if (formMode.type === 'create-parent') {
      await createMutation.mutateAsync({
        name: name.trim(),
        sortOrder,
        imageUrl,
      });
      return;
    }

    if (formMode.type === 'create-child') {
      await createMutation.mutateAsync({
        name: name.trim(),
        parentId: formMode.parent.id,
        sortOrder,
        imageUrl,
      });
      return;
    }

    await updateMutation.mutateAsync({
      id: formMode.category.id,
      payload: {
        name: name.trim(),
        sortOrder,
        imageUrl: imageUrl || undefined,
        isActive,
      },
    });
  }

  const formPending = createMutation.isPending || updateMutation.isPending;
  const formTitle =
    formMode?.type === 'create-parent'
      ? 'Create category'
      : formMode?.type === 'create-child'
        ? `Add sub category — ${formMode.parent.name}`
        : formMode?.type === 'edit'
          ? 'Edit category'
          : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Manage platform categories and subcategories. Disabled categories are hidden from buyers.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/catalog/image-coverage">
            <Button variant="outline">Image coverage</Button>
          </Link>
          <Button onClick={openCreateParent}>
            <Plus className="mr-1.5 h-4 w-4" />
            New category
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading catalog…</p>}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load catalog.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          No categories yet. Create your first category to get started.
        </div>
      )}

      <div className="space-y-4">
        {categories.map((parent) => (
          <section key={parent.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 p-4">
              <CategoryThumb imageUrl={parent.imageUrl} name={parent.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{parent.name}</h3>
                  <Badge tone={parent.isActive ? 'success' : 'warning'}>
                    {parent.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                  {!parent.imageUrl && (
                    <Badge tone="danger">Missing image</Badge>
                  )}
                  <span className="text-xs text-slate-400">Sort {parent.sortOrder}</span>
                </div>
                <p className="text-xs text-slate-500">{parent.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openCreateChild(parent)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Sub category
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(parent)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (window.confirm(`Delete "${parent.name}" and its subcategories?`)) {
                      deleteMutation.mutate(parent.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>

            {parent.children.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {parent.children.map((child) => (
                  <li key={child.id} className="flex flex-wrap items-center gap-4 px-4 py-3 pl-8">
                    <CategoryThumb imageUrl={child.imageUrl} name={child.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800">{child.name}</span>
                      <Badge tone={child.isActive ? 'success' : 'warning'}>
                        {child.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                      {!child.imageUrl && (
                        <Badge tone="danger">Missing image</Badge>
                      )}
                        <span className="text-xs text-slate-400">Sort {child.sortOrder}</span>
                      </div>
                      <p className="text-xs text-slate-500">{child.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(child, parent)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => {
                          if (window.confirm(`Delete sub category "${child.name}"?`)) {
                            deleteMutation.mutate(child.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <Modal
        open={formMode !== null}
        onClose={closeForm}
        title={formTitle}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button form="catalog-form" type="submit" disabled={formPending}>
              {formPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <form id="catalog-form" onSubmit={handleSubmit} className="space-y-4 p-1">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Sort order"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />

          {formMode?.type === 'edit' && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300"
              />
              Active (visible to approved merchants and buyers)
            </label>
          )}

          <ImageUploadField
            label="Category image"
            mode="square"
            purpose="category"
            required={formMode?.type === 'create-parent' || formMode?.type === 'create-child'}
            value={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              setImageError(null);
            }}
            error={imageError ?? undefined}
            allowRemove={formMode?.type === 'edit'}
          />
        </form>
      </Modal>
    </div>
  );
}

function CategoryThumb({
  imageUrl,
  name,
  size = 'md',
}: {
  imageUrl: string | null;
  name: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14';
  if (imageUrl) {
    return (
      <div className={`relative ${dim} shrink-0 overflow-hidden rounded-lg border`}>
        <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-500`}
    >
      {name.charAt(0)}
    </div>
  );
}
