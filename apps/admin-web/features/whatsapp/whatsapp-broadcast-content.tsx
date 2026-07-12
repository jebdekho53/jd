'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2, Send, Upload, XCircle } from 'lucide-react';
import { Badge, Button, Input } from '@/design-system';
import {
  createWhatsAppBroadcast,
  getWhatsAppBroadcast,
  listWhatsAppBroadcasts,
  listWhatsAppTemplates,
  type WhatsAppBroadcast,
  type WhatsAppBroadcastMode,
} from '@/services/whatsapp-api';

/** Poll while a broadcast is still sending. */
const POLL_MS = 3_000;

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500';

/** Header row + row count, so the operator sees what the CSV actually contains. */
function inspectCsv(csv: string): { headers: string[]; rowCount: number; firstRow: Record<string, string> } {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rowCount: 0, firstRow: {} };
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const firstRow: Record<string, string> = {};
  if (lines[1]) {
    const cells = lines[1].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    headers.forEach((h, i) => {
      firstRow[h] = cells[i] ?? '';
    });
  }
  return { headers, rowCount: Math.max(lines.length - 1, 0), firstRow };
}

function renderPreview(text: string, fields: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_m, key: string) => fields[key.toLowerCase()] ?? '');
}

function StatusBadge({ status }: { status: WhatsAppBroadcast['status'] }) {
  if (status === 'COMPLETED') return <Badge tone="success">Completed</Badge>;
  if (status === 'FAILED') return <Badge tone="danger">Failed</Badge>;
  if (status === 'RUNNING') return <Badge tone="info">Sending…</Badge>;
  return <Badge tone="neutral">Queued</Badge>;
}

export function WhatsAppBroadcastContent() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [mode, setMode] = useState<WhatsAppBroadcastMode>('TEMPLATE');
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [bodyTemplate, setBodyTemplate] = useState('Hi {{name}}, ');
  const [templateName, setTemplateName] = useState('');
  const [templateParams, setTemplateParams] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<string | null>(null);

  const templatesQuery = useQuery({ queryKey: ['whatsapp', 'templates'], queryFn: listWhatsAppTemplates });
  const broadcastsQuery = useQuery({
    queryKey: ['whatsapp', 'broadcasts'],
    queryFn: () => listWhatsAppBroadcasts({ limit: 20 }),
    refetchInterval: (query) =>
      query.state.data?.items.some((b) => b.status === 'QUEUED' || b.status === 'RUNNING')
        ? POLL_MS
        : false,
  });

  const detailQuery = useQuery({
    queryKey: ['whatsapp', 'broadcast', watchId],
    queryFn: () => getWhatsAppBroadcast(watchId as string),
    enabled: Boolean(watchId),
    refetchInterval: (query) =>
      query.state.data && (query.state.data.status === 'QUEUED' || query.state.data.status === 'RUNNING')
        ? POLL_MS
        : false,
  });

  const templates = templatesQuery.data ?? [];
  const selectedTemplate = templates.find((t) => t.name === templateName) ?? null;
  const { headers, rowCount, firstRow } = useMemo(() => inspectCsv(csv), [csv]);

  // Resize the variable→column mapping whenever a different template is chosen.
  useEffect(() => {
    if (!selectedTemplate) return;
    setTemplateParams((prev) => {
      const next = Array.from({ length: selectedTemplate.variableCount }, (_, i) => prev[i] ?? '');
      return next;
    });
  }, [selectedTemplate]);

  const create = useMutation({
    mutationFn: createWhatsAppBroadcast,
    onSuccess: (data) => {
      setFormError(null);
      setWatchId(data.broadcast.id);
      setCsv('');
      setFileName(null);
      setName('');
      if (fileRef.current) fileRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'broadcasts'] });
    },
    onError: (err: Error) => setFormError(err.message || 'Could not start the broadcast'),
  });

  const readFile = async (file: File) => {
    setFileName(file.name);
    setCsv(await file.text());
  };

  const previewText = selectedTemplate
    ? selectedTemplate.bodyText.replace(/\{\{\s*(\d+)\s*\}\}/g, (_m, n: string) => {
        const column = templateParams[Number(n) - 1];
        return column ? (firstRow[column] ?? `«${column}»`) : `{{${n}}}`;
      })
    : renderPreview(bodyTemplate, firstRow);

  const submit = () => {
    setFormError(null);
    if (!csv.trim()) return setFormError('Upload a CSV with a "phone" column first');
    if (!headers.includes('phone')) return setFormError('The CSV needs a "phone" column');

    if (mode === 'TEMPLATE') {
      if (!selectedTemplate) return setFormError('Pick an approved template');
      const unmapped = templateParams.findIndex((c) => !c);
      if (unmapped !== -1) return setFormError(`Map a CSV column to variable {{${unmapped + 1}}}`);
      return create.mutate({
        name,
        mode,
        csv,
        templateName: selectedTemplate.name,
        templateLang: selectedTemplate.language,
        templateParams,
      });
    }
    if (!bodyTemplate.trim()) return setFormError('Write the message body');
    return create.mutate({ name, mode, csv, bodyTemplate });
  };

  const detail = detailQuery.data;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold">New broadcast</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV with a <code className="rounded bg-muted px-1">phone</code> column. Every other
          column becomes a personalization field.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="bc-name">
                Broadcast name
              </label>
              <Input
                id="bc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Weekend grocery offer"
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium">Message type</span>
              <div className="flex gap-2">
                <Button
                  variant={mode === 'TEMPLATE' ? 'primary' : 'outline'}
                  onClick={() => setMode('TEMPLATE')}
                >
                  Approved template
                </Button>
                <Button variant={mode === 'TEXT' ? 'primary' : 'outline'} onClick={() => setMode('TEXT')}>
                  Free-form text
                </Button>
              </div>
              {mode === 'TEXT' && (
                <p className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Free-form messages only reach people who messaged you in the last 24 hours. Everyone
                  else will be recorded as failed.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="bc-csv">
                Recipients CSV
              </label>
              <input
                ref={fileRef}
                id="bc-csv"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void readFile(file);
                }}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
              />
              {csv && (
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                  {fileName} · {rowCount} recipients · columns: {headers.join(', ')}
                </p>
              )}
            </div>

            {mode === 'TEMPLATE' ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="bc-template">
                    Template
                  </label>
                  {templatesQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading templates from Meta…</p>
                  ) : templatesQuery.isError ? (
                    <p className="text-sm text-red-600">
                      {(templatesQuery.error as Error).message}
                    </p>
                  ) : (
                    <select
                      id="bc-template"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select an approved template…</option>
                      {templates.map((t) => (
                        <option key={`${t.name}:${t.language}`} value={t.name}>
                          {t.name} ({t.language}) · {t.category} · {t.variableCount} variable
                          {t.variableCount === 1 ? '' : 's'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedTemplate && selectedTemplate.variableCount > 0 && (
                  <div className="space-y-2">
                    <span className="block text-sm font-medium">Map variables to CSV columns</span>
                    {templateParams.map((column, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <code className="w-14 shrink-0 rounded bg-muted px-2 py-1 text-center text-xs">
                          {`{{${index + 1}}}`}
                        </code>
                        <select
                          value={column}
                          onChange={(e) => {
                            const next = [...templateParams];
                            next[index] = e.target.value;
                            setTemplateParams(next);
                          }}
                          className={inputClass}
                          aria-label={`CSV column for variable ${index + 1}`}
                        >
                          <option value="">Choose a column…</option>
                          {headers
                            .filter((h) => h !== 'phone')
                            .map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                        </select>
                      </div>
                    ))}
                    {headers.length === 0 && (
                      <p className="text-xs text-muted-foreground">Upload the CSV to pick columns.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="bc-body">
                  Message body
                </label>
                <textarea
                  id="bc-body"
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  rows={4}
                  maxLength={4096}
                  className={inputClass}
                  placeholder="Hi {{name}}, your favourite store has 20% off today."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use {'{{column}}'} to insert a CSV field.
                </p>
              </div>
            )}
          </div>

          {/* Live preview built from the CSV's first row. */}
          <div className="space-y-3">
            <span className="block text-sm font-medium">Preview (first recipient)</span>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-600 px-3 py-2 text-sm text-white">
                <p className="whitespace-pre-wrap break-words">
                  {previewText || 'Your message will appear here.'}
                </p>
              </div>
            </div>
            {rowCount > 0 && (
              <p className="text-xs text-muted-foreground">
                This will send {rowCount} message{rowCount === 1 ? '' : 's'}, paced to stay inside
                WhatsApp&apos;s rate limits. Duplicates and unparseable numbers are skipped.
              </p>
            )}
          </div>
        </div>

        {formError && (
          <p className="mt-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {formError}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={submit} disabled={create.isPending || !csv || name.trim().length < 3}>
            {create.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="mr-2 h-4 w-4" aria-hidden />
            )}
            Send to {rowCount || 0} recipient{rowCount === 1 ? '' : 's'}
          </Button>
        </div>
      </section>

      {/* Live progress of the broadcast just started. */}
      {detail && (
        <section className="rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{detail.name}</h2>
            <StatusBadge status={detail.status} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sent</p>
              <p className="text-lg font-semibold text-emerald-600">{detail.sentCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold text-red-600">{detail.failedCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{detail.totalRecipients}</p>
            </div>
          </div>

          {detail.errorMessage && (
            <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
              Batch stopped early: {detail.errorMessage}
            </p>
          )}

          {detail.failures.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Failed recipients</p>
              <ul className="max-h-56 space-y-1 overflow-y-auto text-xs">
                {detail.failures.map((failure) => (
                  <li key={failure.waId} className="flex items-start gap-2 rounded-md bg-muted/40 p-2">
                    <code className="shrink-0">+{failure.waId}</code>
                    <span className="text-muted-foreground">
                      {failure.errorMessage}
                      {failure.errorCode ? ` (code ${failure.errorCode})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {detail.status === 'COMPLETED' && detail.failedCount === 0 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              All {detail.sentCount} messages accepted by WhatsApp.
            </p>
          )}
        </section>
      )}

      <section className="rounded-xl border bg-card">
        <h2 className="border-b p-4 text-base font-semibold">Past broadcasts</h2>
        {broadcastsQuery.isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : broadcastsQuery.isError ? (
          <p className="p-8 text-center text-sm text-red-600">
            {(broadcastsQuery.error as Error).message}
          </p>
        ) : (broadcastsQuery.data?.items.length ?? 0) === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No broadcasts yet.</p>
        ) : (
          <ul className="divide-y">
            {broadcastsQuery.data?.items.map((broadcast) => (
              <li key={broadcast.id}>
                <button
                  type="button"
                  onClick={() => setWatchId(broadcast.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{broadcast.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {broadcast.mode === 'TEMPLATE' ? broadcast.templateName : 'Free-form text'} ·{' '}
                      {new Date(broadcast.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {broadcast.sentCount}/{broadcast.totalRecipients}
                  </span>
                  <StatusBadge status={broadcast.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
