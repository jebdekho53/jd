'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Loader2, Sparkles, Upload } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input, Textarea, Select } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import { useApprovedCategoriesQuery } from '@/hooks/use-categories-governance';
import {
  analyzeProductPhoto,
  cancelAiAnalysis,
  confirmAiProduct,
  getAiAvailability,
  type AiAnalysisResult,
  type AiChargeReceipt,
} from '@/services/products/product-creation-api';
import { AiWalletRechargeModal } from './ai-wallet-recharge-modal';

const AI_UNAVAILABLE_MSG =
  'AI product add is temporarily unavailable. Manual and CSV upload are still free.';

interface Props {
  storeId: string;
  open: boolean;
  onClose: () => void;
  onReceipt?: (receipt: AiChargeReceipt) => void;
}

export function ProductAiModal({ storeId, open, onClose, onReceipt }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState('piece');
  const [quantity, setQuantity] = useState('0');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const { data: categories } = useApprovedCategoriesQuery(storeId);

  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['merchant', 'ai-availability', storeId],
    queryFn: () => getAiAvailability(storeId),
    enabled: open,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5MB or smaller');
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Only JPG, PNG, and WEBP images are allowed');
      }
      const dataUrl = await readFileAsDataUrl(file);
      return analyzeProductPhoto(storeId, dataUrl);
    },
    onSuccess: (data) => {
      setAnalysis(data);
      applyExtracted(data);
    },
    onError: (e: Error) => {
      const msg = e.message.includes('temporarily unavailable') ? AI_UNAVAILABLE_MSG : e.message;
      toast(msg, 'error');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (publish: boolean) => {
      if (!analysis) throw new Error('No analysis');
      const categoryId = subCategoryId || parentCategoryId || undefined;
      return confirmAiProduct(storeId, analysis.id, {
        name,
        brand: brand || undefined,
        description: description || undefined,
        categoryId,
        basePrice: Number(basePrice),
        mrp: mrp ? Number(mrp) : undefined,
        unit,
        quantity: Number(quantity) || 0,
        publish,
      });
    },
    onSuccess: (data) => {
      if (data.receipt) {
        onReceipt?.(data.receipt);
      }
      toast(
        data.publish
          ? `Product published. ₹${(data.amountPaise / 100).toFixed(2)} charged`
          : `Draft saved. ₹${(data.amountPaise / 100).toFixed(2)} charged`,
        'success',
      );
      qc.invalidateQueries({ queryKey: ['products', storeId] });
      qc.invalidateQueries({ queryKey: ['merchant', 'ai-billing', storeId] });
      qc.invalidateQueries({ queryKey: ['merchant', 'ai-wallet'] });
      qc.invalidateQueries({ queryKey: ['merchant', 'ai-availability', storeId] });
      setAnalysis(null);
      onClose();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => (analysis ? cancelAiAnalysis(storeId, analysis.id) : Promise.resolve()),
    onSettled: () => {
      setAnalysis(null);
      onClose();
    },
  });

  const handleClose = () => {
    if (analysis && analysis.status === 'COMPLETED') {
      cancelMutation.mutate();
      return;
    }
    setAnalysis(null);
    onClose();
  };

  const applyExtracted = (data: AiAnalysisResult) => {
    const ex = data.extracted;
    setName(String(ex.name ?? ''));
    setBrand(String(ex.brand ?? ''));
    setDescription(String(ex.description ?? ''));
    if (ex.sellingPrice != null) setBasePrice(String(ex.sellingPrice));
    if (ex.mrp != null) setMrp(String(ex.mrp));
    if (ex.unit) setUnit(String(ex.unit));
    const matched = data.categoryMatch?.matchedCategoryId;
    if (matched && categories) {
      for (const parent of categories) {
        if (parent.id === matched) {
          setParentCategoryId(parent.id);
          setSubCategoryId('');
          return;
        }
        for (const child of parent.children ?? []) {
          if (child.id === matched) {
            setParentCategoryId(parent.id);
            setSubCategoryId(child.id);
            return;
          }
        }
      }
    }
  };

  useEffect(() => {
    if (analysis && categories) applyExtracted(analysis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  useEffect(() => {
    if (!open) setAnalysis(null);
  }, [open]);

  const subcategories = categories?.find((c) => c.id === parentCategoryId)?.children ?? [];
  const categoryWarning = analysis?.categoryMatch?.warning;
  const lowConfidence = analysis?.lowConfidence;
  const supplementBlocked = analysis?.supplementBlocked;
  const supplementWarning = analysis?.supplementWarning;
  const publishBlocked = analysis?.publishBlocked ?? lowConfidence ?? supplementBlocked;
  const missingPrice = analysis?.missingPrice;
  const aiUnavailable = availability && !availability.available;
  const insufficientBalance = availability && availability.hasSufficientBalance === false;
  const walletBalance = availability?.walletBalanceRupee;
  const displayImage = analysis?.optimizedImageUrl ?? analysis?.uploadedImageUrl ?? '';

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Add with AI" size="lg">
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p>AI suggestions may be inaccurate. Please verify before creating product.</p>
            <p className="mt-1 font-medium">
              ₹1.50 deducted from AI wallet on confirm. Analysis preview is free.
            </p>
            {walletBalance != null && (
              <p className="mt-1">Wallet balance: <strong>₹{walletBalance.toFixed(2)}</strong></p>
            )}
          </div>

          {insufficientBalance && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <p className="font-medium">Insufficient AI wallet balance.</p>
              <p className="mt-1">Recharge minimum ₹{((availability?.minimumRechargeRupee ?? 100)).toFixed(0)} to continue.</p>
              <Button size="sm" className="mt-2" onClick={() => setRechargeOpen(true)}>
                Recharge AI Wallet
              </Button>
            </div>
          )}

          {availabilityLoading && (
            <p className="text-sm text-slate-500">Checking AI availability…</p>
          )}

          {aiUnavailable && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">{AI_UNAVAILABLE_MSG}</p>
            </div>
          )}

          {!analysis && !aiUnavailable && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 p-8">
              <Sparkles className="h-8 w-8 text-indigo-500" />
              <p className="text-sm text-slate-600">Upload a product photo for free AI analysis</p>
              <Button onClick={() => fileRef.current?.click()} disabled={analyzeMutation.isPending}>
                {analyzeMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
                ) : (
                  <><Upload className="h-4 w-4" /> Upload photo</>
                )}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) analyzeMutation.mutate(file);
                }}
              />
            </div>
          )}

          {analysis && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                {displayImage && (
                <div className="relative mb-3 aspect-square overflow-hidden rounded-xl border">
                  <Image src={displayImage} alt="" fill className="object-cover" unoptimized />
                </div>
                )}
                <p className="text-sm text-slate-600">
                  Confidence: <strong>{((analysis.confidence ?? 0) * 100).toFixed(0)}%</strong>
                </p>
                {supplementWarning && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> {supplementWarning}
                  </p>
                )}
                {lowConfidence && !supplementBlocked && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    Low confidence result. Please verify and save as draft.
                  </p>
                )}
                {missingPrice && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> Price not detected — enter manually
                  </p>
                )}
                {categoryWarning && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> {categoryWarning}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Input label="Product name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
                <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Selling price (₹)" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
                  <Input label="MRP (₹)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} />
                </div>
                <Input label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
                <Input label="Stock" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <Select
                  label="Category"
                  value={parentCategoryId}
                  onChange={(e) => {
                    setParentCategoryId(e.target.value);
                    setSubCategoryId('');
                  }}
                >
                  <option value="">Select category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                {subcategories.length > 0 && (
                  <Select label="Subcategory" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}>
                    <option value="">Select subcategory</option>
                    {subcategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            {analysis && (
              <>
                <Button
                  variant="outline"
                  disabled={confirmMutation.isPending || !name || !basePrice || insufficientBalance}
                  onClick={() => confirmMutation.mutate(false)}
                >
                  Save as Draft — ₹1.50
                </Button>
                <Button
                  disabled={
                    confirmMutation.isPending ||
                    !name ||
                    !basePrice ||
                    publishBlocked ||
                    insufficientBalance
                  }
                  title={
                    insufficientBalance
                      ? 'Recharge AI wallet to continue'
                      : publishBlocked
                        ? 'Cannot publish — save as draft only'
                        : undefined
                  }
                  onClick={() => confirmMutation.mutate(true)}
                >
                  Publish Product — ₹1.50
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      <AiWalletRechargeModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        minimumRechargePaise={availability?.minimumRechargePaise ?? 10000}
        onSuccess={() => {
          void qc.invalidateQueries({ queryKey: ['merchant', 'ai-wallet'] });
          void qc.invalidateQueries({ queryKey: ['merchant', 'ai-availability', storeId] });
        }}
      />
    </>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
