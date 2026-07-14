'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button, Input, useToast } from '@/design-system/primitives';
import {
  aiCatalogApi,
  type AnalysisView,
  type ImageAssetView,
  type JobStatus,
} from '@/services/ai-catalog/ai-catalog-api';

const ON_DEMAND = ['lifestyle', 'infographic', 'social_square', 'social_story', 'alternate_background'];
const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  ocr: { label: 'On label', className: 'bg-green-100 text-green-800' },
  ai_inferred: { label: 'AI guess', className: 'bg-amber-100 text-amber-800' },
  merchant: { label: 'You edited', className: 'bg-blue-100 text-blue-800' },
  default: { label: 'Default', className: 'bg-gray-100 text-gray-700' },
};

const TERMINAL = ['COMPLETED', 'FAILED', 'MODERATION_PENDING', 'MODERATION_APPROVED', 'MODERATION_REJECTED'];

/**
 * AI Catalog v2 studio (feature-flagged). Drives the full flow:
 * upload → queued → live progress → review attributes/category → choose images
 * → cost preview → confirm. Progress uses job-status polling as the reliable
 * source of truth (WS is an optional accelerant handled elsewhere); the DB
 * always wins, so a reload/reconnect recovers cleanly.
 */
export function AiCatalogStudio({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisView | null>(null);
  const [busy, setBusy] = useState(false);
  const [categoryId, setCategoryId] = useState<string>('');
  const [basePrice, setBasePrice] = useState<string>('');
  const [publish, setPublish] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onFile = useCallback((file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast('Image too large — please use an image under 8MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, [toast]);

  const startAnalysis = useCallback(async () => {
    if (!dataUrl) return;
    setBusy(true);
    try {
      const res = await aiCatalogApi.analyze(storeId, dataUrl, true);
      setJobId(res.jobLedgerId);
      setAnalysisId(res.analysisId);
    } catch (e) {
      toast((e as Error).message || 'Could not start analysis', 'error');
    } finally {
      setBusy(false);
    }
  }, [dataUrl, storeId, toast]);

  // Poll the durable job state until it reaches a terminal status, then load
  // the full analysis view (attributes, category candidates, images).
  useEffect(() => {
    if (!jobId || !analysisId) return;
    const tick = async () => {
      try {
        const j = await aiCatalogApi.getJob(storeId, jobId);
        setJob(j);
        if (TERMINAL.includes(j.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          const view = await aiCatalogApi.getAnalysis(storeId, analysisId);
          setAnalysis(view);
          if (view.categoryMatch?.autoSelected) setCategoryId(view.categoryMatch.autoSelected.categoryId);
        }
      } catch {
        /* transient; keep polling */
      }
    };
    void tick();
    pollRef.current = setInterval(tick, 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId, analysisId, storeId]);

  const refreshAnalysis = useCallback(async () => {
    if (!analysisId) return;
    setAnalysis(await aiCatalogApi.getAnalysis(storeId, analysisId));
  }, [analysisId, storeId]);

  const generateExtra = useCallback(
    async (outputType: string) => {
      if (!analysisId) return;
      setBusy(true);
      try {
        const res = await aiCatalogApi.generateImages(storeId, analysisId, [outputType]);
        toast(res.estimate.totalPaise > 0 ? `Queued · est. ₹${(res.estimate.totalPaise / 100).toFixed(2)}` : 'Queued · free (cached)', 'success');
        setTimeout(refreshAnalysis, 3000);
      } catch (e) {
        toast((e as Error).message || 'Generation failed', 'error');
      } finally {
        setBusy(false);
      }
    },
    [analysisId, storeId, toast, refreshAnalysis],
  );

  const imageAction = useCallback(
    async (asset: ImageAssetView, action: 'approve' | 'select') => {
      await aiCatalogApi.imageAction(storeId, asset.id, action);
      await refreshAnalysis();
    },
    [storeId, refreshAnalysis],
  );

  const confirm = useCallback(async () => {
    if (!analysisId) return;
    if (!categoryId) return toast('Choose a category', 'error');
    if (!basePrice) return toast('Enter a price', 'error');
    const attrs = analysis?.attributes as Record<string, unknown> | null;
    setBusy(true);
    try {
      const selected = analysis?.imageAssets.find((a) => a.isSelected);
      const res = await aiCatalogApi.confirm(storeId, analysisId, {
        name: (attrs?.productName as string) || 'Untitled product',
        description: (attrs?.shortDescription as string) || undefined,
        brand: (attrs?.brand as string) || undefined,
        categoryId,
        basePrice: Number(basePrice),
        publish,
        primaryImageAssetId: selected?.id,
        complianceConfirmed: true,
      });
      toast(publish ? `Product published (${res.productId})` : `Draft created (${res.productId})`, 'success');
    } catch (e) {
      toast((e as Error).message || 'Could not create product', 'error');
    } finally {
      setBusy(false);
    }
  }, [analysisId, categoryId, basePrice, publish, analysis, storeId, toast]);

  const attrs = (analysis?.attributes ?? null) as Record<string, unknown> | null;
  const fieldMeta = (attrs?.fieldMeta ?? {}) as Record<string, { source?: string; confidence?: number }>;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold">AI Product Studio</h2>
        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">v2 · beta</span>
      </header>

      {/* Upload + start */}
      {!jobId && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          {dataUrl ? (
            <Image src={dataUrl} alt="preview" width={200} height={200} className="mx-auto rounded object-contain" />
          ) : (
            <ImagePlus className="mx-auto h-10 w-10 text-gray-400" />
          )}
          <div className="mt-4 flex justify-center gap-2">
            <label className="cursor-pointer rounded border px-3 py-2 text-sm hover:bg-gray-50">
              Choose photo
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </label>
            <Button onClick={startAnalysis} disabled={!dataUrl || busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze'}
            </Button>
          </div>
        </div>
      )}

      {/* Progress */}
      {job && !TERMINAL.includes(job.status) && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            <span className="capitalize">{job.status.toLowerCase()}…</span>
            <span className="ml-auto text-gray-500">{job.progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded bg-gray-100">
            <div className="h-2 rounded bg-purple-600 transition-all" style={{ width: `${job.progress}%` }} />
          </div>
        </div>
      )}

      {job?.status === 'MODERATION_PENDING' && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          This product needs a quick review by our team before it can be published.
        </div>
      )}

      {/* Review */}
      {analysis && analysis.status === 'COMPLETED' && attrs && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attributes */}
          <section className="space-y-3">
            <h3 className="font-medium">Detected details</h3>
            <div className="rounded-lg border divide-y">
              {['productName', 'brand', 'variant', 'flavor', 'color', 'material', 'weight', 'volume', 'gender', 'countryOfOrigin']
                .filter((k) => attrs[k])
                .map((k) => {
                  const meta = fieldMeta[k];
                  const badge = SOURCE_BADGE[meta?.source ?? 'default'] ?? SOURCE_BADGE.default;
                  return (
                    <div key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{String(attrs[k])}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${badge.className}`}>{badge.label}</span>
                      </span>
                    </div>
                  );
                })}
            </div>

            <h3 className="font-medium">Category</h3>
            <div className="space-y-1">
              {analysis.categoryMatch?.candidates.map((c) => (
                <label key={c.categoryId} className="flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm">
                  <input type="radio" name="cat" checked={categoryId === c.categoryId} onChange={() => setCategoryId(c.categoryId)} />
                  <span>{c.path.join(' → ')}</span>
                  <span className="ml-auto text-xs text-gray-400">{Math.round(c.score * 100)}%</span>
                </label>
              ))}
              {analysis.categoryMatch?.requiresConfirmation && (
                <p className="text-xs text-amber-600">Please confirm the category — AI was not confident enough to auto-select.</p>
              )}
            </div>
          </section>

          {/* Images */}
          <section className="space-y-3">
            <h3 className="font-medium">Images</h3>
            <div className="grid grid-cols-3 gap-2">
              {analysis.imageAssets.filter((a) => a.imageUrl).map((a) => (
                <div key={a.id} className={`relative rounded border p-1 ${a.isSelected ? 'ring-2 ring-purple-500' : ''}`}>
                  <Image src={a.imageUrl!} alt={a.outputType} width={120} height={120} className="h-24 w-full rounded object-contain" />
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] capitalize text-gray-500">{a.outputType.replace(/_/g, ' ')}</span>
                    <button className="text-[10px] text-purple-600" onClick={() => imageAction(a, 'select')}>
                      {a.isSelected ? '✓ primary' : 'use'}
                    </button>
                  </div>
                  {a.syntheticGeometry && <span className="absolute right-1 top-1 text-[9px] text-amber-500" title="AI-styled scene">✦</span>}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {ON_DEMAND.map((o) => (
                <Button key={o} size="sm" variant="outline" disabled={busy} onClick={() => generateExtra(o)}>
                  <Wand2 className="mr-1 h-3 w-3" /> {o.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </section>

          {/* Confirm */}
          <section className="lg:col-span-2 space-y-3 rounded-lg border p-4">
            <h3 className="font-medium">Create product</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500">Selling price (₹)</label>
                <Input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} type="number" className="w-32" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
                Publish immediately
              </label>
              <Button onClick={confirm} disabled={busy} className="ml-auto">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-1 h-4 w-4" /> {publish ? 'Publish' : 'Save draft'}</>}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
