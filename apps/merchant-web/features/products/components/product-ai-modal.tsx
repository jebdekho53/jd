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
import { HsnPicker, type HsnOption } from './hsn-picker';

const AI_UNAVAILABLE_MSG =
  'AI product add is temporarily unavailable. Manual and CSV upload are still free.';

type AiFieldMeta = NonNullable<AiAnalysisResult['fields']>[string];

function fieldValue(data: AiAnalysisResult, key: string): unknown {
  return data.fields?.[key]?.value ?? data.extracted[key];
}

function fieldHint(meta?: AiFieldMeta) {
  if (!meta) return undefined;
  const source = meta.source.replace('_', ' ');
  const confidence = Math.round((meta.confidence ?? 0) * 100);
  return `${meta.requiresReview ? 'AI suggested — please verify. ' : ''}Source: ${source}. Confidence: ${confidence}%.`;
}

function stringField(data: AiAnalysisResult, key: string) {
  const value = fieldValue(data, key);
  return value == null ? '' : String(value);
}

function numberField(data: AiAnalysisResult, key: string) {
  const value = fieldValue(data, key);
  return value == null || value === '' ? '' : String(value);
}

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
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState('piece');
  const [quantity, setQuantity] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [taxCategory, setTaxCategory] = useState<'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED'>('GOODS');
  const [ingredients, setIngredients] = useState('');
  const [shelfLife, setShelfLife] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [manufacturerName, setManufacturerName] = useState('');
  const [manufacturerAddress, setManufacturerAddress] = useState('');
  const [storageInstructions, setStorageInstructions] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [returnAllowed, setReturnAllowed] = useState(false);
  const [refundAllowed, setRefundAllowed] = useState(true);
  const [replacementAllowed, setReplacementAllowed] = useState(true);
  const [returnWindowHours, setReturnWindowHours] = useState('24');
  const [proofRequired, setProofRequired] = useState('PHOTO_OR_VIDEO');
  const [approvalMode, setApprovalMode] = useState('MANUAL');
  const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');
  const [allowCustomerChangedMind, setAllowCustomerChangedMind] = useState(false);
  const [returnPolicyText, setReturnPolicyText] = useState('');
  const [replacementPolicyText, setReplacementPolicyText] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [hsn, setHsn] = useState<HsnOption | null>(null);
  const [hsnError, setHsnError] = useState<string | null>(null);
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
      if (!hsn) throw new Error('HSN code is required for every product');
      const categoryId = subCategoryId || parentCategoryId || undefined;
      return confirmAiProduct(storeId, analysis.id, {
        name,
        brand: brand || undefined,
        sku: sku || undefined,
        description: description || undefined,
        categoryId,
        basePrice: Number(basePrice),
        mrp: mrp ? Number(mrp) : undefined,
        unit,
        quantity: Number(quantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || undefined,
        ingredients: ingredients || undefined,
        shelfLife: shelfLife || undefined,
        countryOfOrigin: countryOfOrigin || undefined,
        manufacturerName: manufacturerName || undefined,
        manufacturerAddress: manufacturerAddress || undefined,
        storageInstructions: storageInstructions || undefined,
        disclaimer: disclaimer || undefined,
        taxInclusive,
        hsnCodeId: hsn.id,
        gstSlab: hsn.defaultGstSlab,
        taxCategory,
        isReturnable: returnAllowed,
        isRefundable: refundAllowed,
        isReplaceable: replacementAllowed,
        returnWindowHours: Number(returnWindowHours) || undefined,
        approvalMode,
        proofRequired,
        refundMethod,
        allowCustomerChangedMind,
        returnPolicyText: returnPolicyText || undefined,
        replacementPolicyText: replacementPolicyText || undefined,
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
      setHsn(null);
      setHsnError(null);
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
    setHsn(null);
    setHsnError(null);
    onClose();
  };

  const applyExtracted = (data: AiAnalysisResult) => {
    const ex = data.extracted;
    setName(stringField(data, 'productName') || stringField(data, 'name'));
    setBrand(stringField(data, 'brand'));
    setSku(stringField(data, 'sku'));
    setDescription(stringField(data, 'description'));
    setBasePrice(numberField(data, 'basePrice') || numberField(data, 'price'));
    setMrp(numberField(data, 'mrp'));
    setUnit(stringField(data, 'unit') || 'piece');
    setQuantity(numberField(data, 'quantity') || numberField(data, 'openingStock') || '10');
    setLowStockThreshold(numberField(data, 'lowStockThreshold') || numberField(data, 'lowStockAlert') || '5');
    setTaxCategory((stringField(data, 'taxCategory') as typeof taxCategory) || 'GOODS');
    setIngredients(stringField(data, 'ingredients'));
    setShelfLife(stringField(data, 'shelfLife'));
    setCountryOfOrigin(stringField(data, 'countryOfOrigin'));
    setManufacturerName(stringField(data, 'manufacturerName'));
    setManufacturerAddress(stringField(data, 'manufacturerAddress'));
    setStorageInstructions(stringField(data, 'storageInstructions'));
    setDisclaimer(stringField(data, 'disclaimer'));
    setTaxInclusive(Boolean(fieldValue(data, 'priceInclusiveOfTax') ?? true));
    setReturnAllowed(Boolean(fieldValue(data, 'returnAllowed') ?? false));
    setRefundAllowed(Boolean(fieldValue(data, 'refundAllowed') ?? true));
    setReplacementAllowed(Boolean(fieldValue(data, 'replacementAllowed') ?? true));
    setReturnWindowHours(numberField(data, 'returnWindowHours') || '24');
    setProofRequired(stringField(data, 'proofRequired') || 'PHOTO_OR_VIDEO');
    setApprovalMode(stringField(data, 'approvalMode') || 'MANUAL');
    setRefundMethod(stringField(data, 'refundMethod') || 'ORIGINAL_PAYMENT');
    setAllowCustomerChangedMind(Boolean(fieldValue(data, 'allowCustomerChangedMind') ?? false));
    setReturnPolicyText(stringField(data, 'returnPolicyText'));
    setReplacementPolicyText(stringField(data, 'replacementPolicyText'));
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
    if (!open) {
      setAnalysis(null);
      setHsn(null);
      setHsnError(null);
    }
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
                  <><Loader2 className="h-4 w-4 animate-spin" /> Uploading image…</>
                ) : (
                  <><Upload className="h-4 w-4" /> Upload photo</>
                )}
              </Button>
              {analyzeMutation.isPending && (
                <div className="space-y-1 text-center text-xs text-slate-500">
                  <p>Extracting OCR text…</p>
                  <p>Enriching product fields…</p>
                  <p>Applying suggestions…</p>
                </div>
              )}
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
                <p className="mt-1 text-xs text-slate-500">Analysis ID: {analysis.analysisId ?? analysis.id}</p>
                {analysis.ocrText && (
                  <details className="mt-2 rounded-lg border border-slate-200 p-2 text-xs text-slate-600">
                    <summary className="cursor-pointer font-medium text-slate-700">OCR text</summary>
                    <pre className="mt-2 max-h-40 whitespace-pre-wrap overflow-auto">{analysis.ocrText}</pre>
                  </details>
                )}
                {(analysis.warnings?.length ?? 0) > 0 && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                    {analysis.warnings?.map((warning) => <p key={warning}>{warning}</p>)}
                  </div>
                )}
                {(analysis.missingFields?.length ?? 0) > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Missing or merchant-required: {analysis.missingFields?.slice(0, 12).join(', ')}
                  </p>
                )}
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
                <Input label="Product name" value={name} onChange={(e) => setName(e.target.value)} hint={fieldHint(analysis.fields?.productName ?? analysis.fields?.name)} />
                <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} hint={fieldHint(analysis.fields?.brand)} />
                <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} hint={fieldHint(analysis.fields?.description)} />
                <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} hint={fieldHint(analysis.fields?.sku)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Selling price (₹)" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} hint={fieldHint(analysis.fields?.basePrice ?? analysis.fields?.price)} />
                  <Input label="MRP (₹)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} hint={fieldHint(analysis.fields?.mrp)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} hint={fieldHint(analysis.fields?.unit)} />
                  <Input label="Stock" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} hint={fieldHint(analysis.fields?.quantity)} />
                  <Input label="Low stock" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} hint={fieldHint(analysis.fields?.lowStockThreshold)} />
                </div>
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
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Tax category" value={taxCategory} onChange={(e) => setTaxCategory(e.target.value as typeof taxCategory)} hint={fieldHint(analysis.fields?.taxCategory)}>
                    <option value="GOODS">Goods</option>
                    <option value="SERVICES">Services</option>
                    <option value="EXEMPT">Exempt</option>
                    <option value="NIL_RATED">Nil rated</option>
                  </Select>
                  <Input label="GST suggestion" value={String(fieldValue(analysis, 'gstPercent') ?? fieldValue(analysis, 'gstSlab') ?? '')} readOnly hint={fieldHint(analysis.fields?.gstPercent ?? analysis.fields?.gstSlab)} />
                </div>
                <Input label="HSN suggestion" value={String(fieldValue(analysis, 'hsnCode') ?? '')} readOnly hint={fieldHint(analysis.fields?.hsnCode)} />
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
                <details open className="rounded-lg border border-slate-200 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">Return & refund suggestions</summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={returnAllowed} onChange={(e) => setReturnAllowed(e.target.checked)} /> Return allowed</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={refundAllowed} onChange={(e) => setRefundAllowed(e.target.checked)} /> Refund allowed</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={replacementAllowed} onChange={(e) => setReplacementAllowed(e.target.checked)} /> Replacement allowed</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allowCustomerChangedMind} onChange={(e) => setAllowCustomerChangedMind(e.target.checked)} /> Changed mind allowed</label>
                    <Input label="Return window hours" type="number" value={returnWindowHours} onChange={(e) => setReturnWindowHours(e.target.value)} />
                    <Input label="Proof required" value={proofRequired} onChange={(e) => setProofRequired(e.target.value)} />
                    <Input label="Approval mode" value={approvalMode} onChange={(e) => setApprovalMode(e.target.value)} />
                    <Input label="Refund method" value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} />
                  </div>
                  <Textarea className="mt-2" label="Return policy text" value={returnPolicyText} onChange={(e) => setReturnPolicyText(e.target.value)} rows={2} />
                  <Textarea className="mt-2" label="Replacement policy text" value={replacementPolicyText} onChange={(e) => setReplacementPolicyText(e.target.value)} rows={2} />
                </details>
                <details open className="rounded-lg border border-slate-200 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">Compliance suggestions</summary>
                  <div className="mt-3 space-y-2">
                    <Textarea label="Ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={2} hint={fieldHint(analysis.fields?.ingredients)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Shelf life" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} hint={fieldHint(analysis.fields?.shelfLife)} />
                      <Input label="Country of origin" value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} hint={fieldHint(analysis.fields?.countryOfOrigin)} />
                    </div>
                    <Input label="Manufacturer name" value={manufacturerName} onChange={(e) => setManufacturerName(e.target.value)} hint={fieldHint(analysis.fields?.manufacturerName)} />
                    <Textarea label="Manufacturer address" value={manufacturerAddress} onChange={(e) => setManufacturerAddress(e.target.value)} rows={2} hint={fieldHint(analysis.fields?.manufacturerAddress)} />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={taxInclusive} onChange={(e) => setTaxInclusive(e.target.checked)} /> Price inclusive of tax</label>
                    <Textarea label="Storage instructions" value={storageInstructions} onChange={(e) => setStorageInstructions(e.target.value)} rows={2} hint={fieldHint(analysis.fields?.storageInstructions)} />
                    <Textarea label="Disclaimer" value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} rows={2} hint={fieldHint(analysis.fields?.disclaimer)} />
                  </div>
                </details>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            {analysis && (
              <>
                <Button
                  variant="outline"
                  disabled={confirmMutation.isPending || !name || !basePrice || !hsn || insufficientBalance}
                  onClick={() => {
                    if (!hsn) {
                      setHsnError('HSN code is required for every product');
                      toast('Select an HSN code for GST compliance and shipping', 'error');
                      return;
                    }
                    confirmMutation.mutate(false);
                  }}
                >
                  Save as Draft — ₹1.50
                </Button>
                <Button
                  disabled={
                    confirmMutation.isPending ||
                    !name ||
                    !basePrice ||
                    !hsn ||
                    publishBlocked ||
                    insufficientBalance
                  }
                  title={
                    insufficientBalance
                      ? 'Recharge AI wallet to continue'
                      : !hsn
                        ? 'Select an HSN code before saving'
                      : publishBlocked
                        ? 'Cannot publish — save as draft only'
                        : undefined
                  }
                  onClick={() => {
                    if (!hsn) {
                      setHsnError('HSN code is required for every product');
                      toast('Select an HSN code for GST compliance and shipping', 'error');
                      return;
                    }
                    confirmMutation.mutate(true);
                  }}
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
