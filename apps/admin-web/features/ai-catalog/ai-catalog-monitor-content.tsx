'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, ShieldCheck, ShieldX } from 'lucide-react';
import { aiCatalogAdminApi } from '@/services/ai-catalog-admin-api';

/**
 * Admin control room for AI Catalog v2: feature flag, live queue health,
 * dead-lettered jobs (with re-drive) and the moderation review queue. The
 * database is the source of truth; this view polls it every few seconds.
 */
export function AiCatalogMonitorContent() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'health' | 'failed' | 'moderation'>('health');

  const config = useQuery({ queryKey: ['ai-catalog', 'config'], queryFn: aiCatalogAdminApi.getConfig });
  const health = useQuery({ queryKey: ['ai-catalog', 'health'], queryFn: aiCatalogAdminApi.queueHealth, refetchInterval: 5000 });
  const failed = useQuery({ queryKey: ['ai-catalog', 'failed'], queryFn: () => aiCatalogAdminApi.failedJobs(1), enabled: tab === 'failed' });
  const moderation = useQuery({ queryKey: ['ai-catalog', 'moderation'], queryFn: () => aiCatalogAdminApi.moderation(1), enabled: tab === 'moderation' });

  const toggleFlag = useMutation({
    mutationFn: (enabled: boolean) => aiCatalogAdminApi.setConfig('feature.enabled', enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-catalog', 'config'] }),
  });
  const redrive = useMutation({
    mutationFn: (jobId: string) => aiCatalogAdminApi.redrive(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-catalog', 'failed'] }),
  });
  const resolve = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => aiCatalogAdminApi.resolveModeration(v.id, v.approve),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-catalog', 'moderation'] }),
  });

  return (
    <div className="space-y-6">
      {/* Feature flag */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <div>
          <p className="font-medium">AI Catalog v2</p>
          <p className="text-sm text-gray-500">
            {config.data?.enabled ? 'Enabled — merchants can use the async studio' : 'Disabled — v1 flow only'}
          </p>
        </div>
        <button
          className={`rounded px-4 py-2 text-sm font-medium text-white ${config.data?.enabled ? 'bg-red-600' : 'bg-green-600'}`}
          disabled={toggleFlag.isPending || config.isLoading}
          onClick={() => toggleFlag.mutate(!config.data?.enabled)}
        >
          {config.data?.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['health', 'failed', 'moderation'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm capitalize ${tab === t ? 'border-b-2 border-purple-600 font-medium' : 'text-gray-500'}`}>
            {t === 'health' ? 'Queue health' : t === 'failed' ? `Failed (${health.data?.ledger.failed ?? 0})` : `Moderation (${health.data?.ledger.moderationPending ?? 0})`}
          </button>
        ))}
      </div>

      {tab === 'health' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(health.data?.queues ?? {}).map(([queue, counts]) => (
            <div key={queue} className="rounded-lg border bg-white p-4">
              <p className="truncate text-sm font-medium">{queue}</p>
              <dl className="mt-2 space-y-1 text-xs text-gray-600">
                {Object.entries(counts).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="capitalize">{k}</dt><dd className="font-mono">{v}</dd></div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}

      {tab === 'failed' && (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr><th className="p-3">Queue</th><th className="p-3">Error</th><th className="p-3">When</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {failed.data?.items.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{j.queueName}</td>
                  <td className="max-w-md truncate p-3 text-gray-600">{j.errorMessage}</td>
                  <td className="p-3 text-xs text-gray-400">{new Date(j.updatedAt).toLocaleString()}</td>
                  <td className="p-3">
                    <button className="flex items-center gap-1 text-purple-600" disabled={redrive.isPending} onClick={() => redrive.mutate(j.id)}>
                      <RefreshCw className="h-3 w-3" /> Re-drive
                    </button>
                  </td>
                </tr>
              ))}
              {!failed.data?.items.length && <tr><td colSpan={4} className="p-6 text-center text-gray-400">No failed jobs</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'moderation' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moderation.data?.items.map((m) => (
            <div key={m.id} className="rounded-lg border bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.uploadedImageUrl} alt="" className="h-32 w-full rounded object-contain" />
              <p className="mt-2 text-xs text-gray-500">Confidence {m.confidence != null ? `${Math.round(m.confidence * 100)}%` : '—'}</p>
              <div className="mt-2 flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1 rounded bg-green-600 py-1.5 text-xs text-white"
                  disabled={resolve.isPending} onClick={() => resolve.mutate({ id: m.id, approve: true })}>
                  <ShieldCheck className="h-3 w-3" /> Approve
                </button>
                <button className="flex flex-1 items-center justify-center gap-1 rounded bg-red-600 py-1.5 text-xs text-white"
                  disabled={resolve.isPending} onClick={() => resolve.mutate({ id: m.id, approve: false })}>
                  <ShieldX className="h-3 w-3" /> Reject
                </button>
              </div>
            </div>
          ))}
          {!moderation.data?.items.length && <p className="col-span-full p-6 text-center text-gray-400">Nothing awaiting review</p>}
        </div>
      )}
    </div>
  );
}
