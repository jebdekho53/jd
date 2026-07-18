'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, ImagePlus, Loader2, Sparkles, Upload } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input, Textarea, Select } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import { useApprovedCategoriesQuery } from '@/hooks/use-categories-governance';
import {
  analyzeProductPhoto,
  cancelAiAnalysis,
  confirmAiProduct,
  generateAiProductImage,
  getAiAvailability,
  type AiAnalysisResult,
  type AiChargeReceipt,
  type AiGeneratedImage,
} from '@/services/products/product-creation-api';
import { AiWalletRechargeModal } from './ai-wallet-recharge-modal';
import { HsnPicker, type HsnOption } from './hsn-picker';
import { CategoryCascadeSelect, findCategoryPath } from './category-cascade-select';
import { PRODUCT_UNITS, normalizeUnit } from '@/features/products/product-units';

const AI_UNAVAILABLE_MSG =
  'AI product add is temporarily unavailable. Manual and CSV upload are still free.';

type AiFieldMeta = NonNullable<AiAnalysisResult['fields']>[string];

function fieldValue(data: AiAnalysisResult, key: string): unknown {
  return data.fields?.[key]?.value ?? data.extracted[key];
}

function fieldHint(_meta?: AiFieldMeta): string | undefined {
  // Field-level source/confidence hints are intentionally hidden — the AI now
  // pre-fills a complete draft and merchants review the values directly.
  return undefined;
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
  const [proofRequired, setProofRequired] = useState('PHOTO_AND_VIDEO');
  const [approvalMode, setApprovalMode] = useState('MANUAL');
  const [refundMethod, setRefundMethod] = useState('ORIGINAL_PAYMENT');
  const [allowCustomerChangedMind, setAllowCustomerChangedMind] = useState(false);
  const [returnPolicyText, setReturnPolicyText] = useState('');
  const [replacementPolicyText, setReplacementPolicyText] = useState('');
  // The DEEPEST category the merchant picked. The cascade picker walks the tree to
  // whatever depth it has, so this can be an L3/L4 node — the form used to hold only
  // parent+sub, which made anything below level 2 unreachable.
  const [categoryId, setCategoryId] = useState('');
  const [hsn, setHsn] = useState<HsnOption | null>(null);
  const [hsnError, setHsnError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<AiGeneratedImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [supplementCompliance, setSupplementCompliance] = useState(false);
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
      setGeneratedImages(data.generatedImages ?? []);
      setSelectedImageUrl(null);
      setSupplementCompliance(false);
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
      return confirmAiProduct(storeId, analysis.id, {
        name,
        brand: brand || undefined,
        sku: sku || undefined,
        description: description || undefined,
        categoryId: categoryId || undefined,
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
        primaryImageUrl: selectedImageUrl ?? undefined,
        supplementComplianceConfirmed: supplementCompliance,
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
      // Products list is cached under ['merchant', userId, storeId, 'products', …];
      // match it by predicate so the new draft/product shows without a reload.
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return Array.isArray(k) && k[0] === 'merchant' && k[2] === storeId && k[3] === 'products';
        },
      });
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

  const generateImageMutation = useMutation({
    mutationFn: (mode: 'bg_removal' | 'ai_edit') => {
      if (!analysis) throw new Error('No analysis');
      return generateAiProductImage(storeId, analysis.id, mode);
    },
    onSuccess: (data) => {
      setGeneratedImages(data.generatedImages ?? []);
      setSelectedImageUrl(data.imageUrl);
      toast(`Image ready. ₹${(data.amountPaise / 100).toFixed(2)} charged`, 'success');
      qc.invalidateQueries({ queryKey: ['merchant', 'ai-wallet'] });
      qc.invalidateQueries({ queryKey: ['merchant', 'ai-availability', storeId] });
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
    // Snap the OCR-extracted unit to a canonical option so the dropdown always
    // shows a valid selection (e.g. "grams" → "g", unknown → "piece").
    setUnit(normalizeUnit(stringField(data, 'unit')));
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
    setProofRequired(stringField(data, 'proofRequired') || 'PHOTO_AND_VIDEO');
    setApprovalMode(stringField(data, 'approvalMode') || 'MANUAL');
    setRefundMethod(stringField(data, 'refundMethod') || 'ORIGINAL_PAYMENT');
    setAllowCustomerChangedMind(Boolean(fieldValue(data, 'allowCustomerChangedMind') ?? false));
    setReturnPolicyText(stringField(data, 'returnPolicyText'));
    setReplacementPolicyText(stringField(data, 'replacementPolicyText'));
    // The AI can match a category at ANY depth. The old restore only looked two
    // levels down, so an L3/L4 match silently left the picker empty.
    const matched = data.categoryMatch?.matchedCategoryId;
    if (matched && categories && findCategoryPath(categories, matched).length > 0) {
      setCategoryId(matched);
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
      setGeneratedImages([]);
      setSelectedImageUrl(null);
      setSupplementCompliance(false);
    }
  }, [open]);

  const categoryWarning = analysis?.categoryMatch?.warning;
  const lowConfidence = analysis?.lowConfidence;
  const supplementBlocked = analysis?.supplementBlocked;
  const supplementWarning = analysis?.supplementWarning;
  const backendPublishBlocked = analysis?.publishBlocked ?? lowConfidence ?? supplementBlocked;
  // A merchant compliance attestation can bypass ONLY the supplement "unclear
  // label" block — never low-confidence or restaurant-food blocks.
  const restaurantBlocked =
    analysis?.productType === 'RESTAURANT_FOOD' ||
    analysis?.detectedProductType === 'RESTAURANT_FOOD';
  const hardPublishBlocked = Boolean(lowConfidence) || Boolean(restaurantBlocked);
  const needsSupplementConfirm = Boolean(supplementBlocked) && !hardPublishBlocked;
  const publishBlocked = hardPublishBlocked || (Boolean(supplementBlocked) && !supplementCompliance);
  const missingPrice = analysis?.missingPrice;
  const aiUnavailable = availability && !availability.available;
  const insufficientBalance = availability && availability.hasSufficientBalance === false;
  const walletBalance = availability?.walletBalanceRupee;
  const displayImage = selectedImageUrl ?? analysis?.optimizedImageUrl ?? analysis?.uploadedImageUrl ?? '';
  const imageGenPriceRupee = availability?.imageGenerationPriceRupee ?? 5;

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
                  {selectedImageUrl && (
                    <span className="absolute left-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                      AI generated
                    </span>
                  )}
                </div>
                )}

                <div className="mb-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={generateImageMutation.isPending || insufficientBalance}
                    onClick={() => generateImageMutation.mutate('bg_removal')}
                  >
                    {generateImageMutation.isPending && generateImageMutation.variables === 'bg_removal' ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Cleaning background…</>
                    ) : (
                      <><ImagePlus className="h-4 w-4" /> Clean background — ₹{imageGenPriceRupee.toFixed(2)}</>
                    )}
                  </Button>
                  <p className="mt-2 text-xs text-slate-500">
                    Removes the background from your uploaded photo and places the same product on a clean white background — your label and text stay exactly the same. Charged per image.
                  </p>
                  {generatedImages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      disabled={generateImageMutation.isPending || insufficientBalance}
                      onClick={() => generateImageMutation.mutate('ai_edit')}
                    >
                      {generateImageMutation.isPending && generateImageMutation.variables === 'ai_edit' ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Regenerating with AI…</>
                      ) : (
                        <>Don&apos;t like it? Regenerate with AI — ₹{imageGenPriceRupee.toFixed(2)}</>
                      )}
                    </Button>
                  )}
                  {generatedImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedImageUrl(null)}
                        className={`relative aspect-square overflow-hidden rounded-lg border-2 ${selectedImageUrl === null ? 'border-indigo-500' : 'border-transparent'}`}
                        title="Use original photo"
                      >
                        <Image src={analysis.optimizedImageUrl ?? analysis.uploadedImageUrl} alt="original" fill className="object-cover" unoptimized />
                        <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[10px] text-white">Original</span>
                      </button>
                      {generatedImages.map((img) => (
                        <button
                          key={img.url}
                          type="button"
                          onClick={() => setSelectedImageUrl(img.url)}
                          className={`relative aspect-square overflow-hidden rounded-lg border-2 ${selectedImageUrl === img.url ? 'border-indigo-500' : 'border-transparent'}`}
                          title="Use this generated image"
                        >
                          <Image src={img.thumbnailUrl ?? img.url} alt="generated" fill className="object-cover" unoptimized />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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
                  <Select label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} hint={fieldHint(analysis.fields?.unit)}>
                    {PRODUCT_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </Select>
                  <Input label="Stock" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} hint={fieldHint(analysis.fields?.quantity)} />
                  <Input label="Low stock" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} hint={fieldHint(analysis.fields?.lowStockThreshold)} />
                </div>
                <CategoryCascadeSelect
                  categories={categories ?? []}
                  value={categoryId}
                  onChange={setCategoryId}
                />
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

          {analysis && needsSupplementConfirm && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <label className="flex items-start gap-2 text-sm text-amber-900">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={supplementCompliance}
                  onChange={(e) => setSupplementCompliance(e.target.checked)}
                />
                <span>
                  This is a supplement and its label could not be auto-verified. I confirm I have
                  reviewed the <strong>ingredients, allergens, FSSAI license, manufacturer and
                  regulatory details</strong> and take responsibility for their accuracy before
                  publishing.
                </span>
              </label>
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
                      : needsSupplementConfirm && !supplementCompliance
                        ? 'Tick the supplement compliance confirmation to publish'
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
