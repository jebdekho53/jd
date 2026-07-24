'use client';

import { useState } from 'react';
import { CheckCircle2, FileUp, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listRiderDocuments,
  saveRiderDocument,
  submitRiderKyc,
  uploadDocument,
  type RiderDocumentType,
} from '@/lib/api';
import { fileToDataUrl } from '@/lib/rider-helpers';
import { Panel } from '@/design-system/primitives';

const DOCS: Array<{ type: RiderDocumentType; label: string }> = [
  { type: 'ID_PROOF', label: 'ID proof' },
  { type: 'DRIVING_LICENSE', label: 'Driving licence' },
  { type: 'PROFILE_PHOTO', label: 'Profile photo' },
  { type: 'PAN_CARD', label: 'PAN card' },
  { type: 'VEHICLE_RC', label: 'Vehicle RC' },
];

/** The document upload + submit-for-review UI — shared by the standalone
 *  /kyc screen and the combined signup-then-KYC onboarding flow, so a rider
 *  doesn't have to remember to come back and do this as a separate step. */
export function KycUploadPanel({ onSubmitted }: { onSubmitted?: () => void }) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['rider', 'kyc', 'documents'], queryFn: listRiderDocuments });
  const [activeType, setActiveType] = useState<RiderDocumentType>('ID_PROOF');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a document file first.');
      const dataUrl = await fileToDataUrl(file);
      const uploaded = await uploadDocument(dataUrl);
      return saveRiderDocument(activeType, uploaded.url);
    },
    onSuccess: () => {
      setFile(null);
      setFileError(null);
      qc.invalidateQueries({ queryKey: ['rider', 'kyc', 'documents'] });
    },
  });

  const submit = useMutation({
    mutationFn: submitRiderKyc,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['rider', 'me'] });
      onSubmitted?.();
    },
  });

  return (
    <>
      <Panel title="Upload document">
        <div className="space-y-3">
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value as RiderDocumentType)}
            className="h-11 w-full rounded-xl border border-rider-border bg-rider-bg px-3 text-sm text-rider-text"
          >
            {DOCS.map((doc) => (
              <option key={doc.type} value={doc.type}>
                {doc.label}
              </option>
            ))}
          </select>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-rider-border bg-rider-bg px-3 py-5 text-center text-sm text-rider-muted">
            <FileUp className="mb-2 h-7 w-7 text-rider-muted" />
            <span className="font-semibold text-rider-text">{file ? file.name : 'Choose file'}</span>
            <span className="mt-1 text-xs">JPG, PNG, WEBP, or PDF. Max 5 MB.</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                setFile(next);
                setFileError(null);
              }}
            />
          </label>
          {fileError && <p className="rounded-xl bg-rider-danger/10 p-2 text-sm text-rider-danger">{fileError}</p>}
          <button
            onClick={() => upload.mutate()}
            disabled={upload.isPending || !file}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rider-accent text-sm font-bold text-rider-accent-foreground disabled:opacity-50"
          >
            {upload.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            {upload.isPending ? 'Uploading...' : 'Upload document'}
          </button>
          {upload.isError && <p className="text-sm text-rider-danger">{(upload.error as Error).message}</p>}
        </div>
      </Panel>

      <Panel title="Document status">
        <ul className="space-y-2">
          {DOCS.map((doc) => {
            const row = query.data?.find((item) => item.documentType === doc.type);
            return (
              <li key={doc.type} className="rounded-xl bg-white/5 p-3 text-sm text-rider-text">
                <div className="flex items-center justify-between gap-3">
                  <span>{doc.label}</span>
                  <span className="inline-flex items-center gap-1 font-bold">
                    {row?.status === 'APPROVED' && <CheckCircle2 className="h-4 w-4 text-rider-online" />}
                    {row?.status === 'REJECTED' && <XCircle className="h-4 w-4 text-rider-danger" />}
                    {!row && <ShieldAlert className="h-4 w-4 text-rider-accent" />}
                    {row?.status ?? 'MISSING'}
                  </span>
                </div>
                {row?.rejectionReason && (
                  <p className="mt-2 rounded-md bg-rider-danger/10 p-2 text-xs text-rider-danger">{row.rejectionReason}</p>
                )}
              </li>
            );
          })}
        </ul>
        <button
          onClick={() => submit.mutate()}
          disabled={submit.isPending}
          className="mt-3 h-12 w-full rounded-xl bg-rider-online text-sm font-bold text-rider-bg disabled:opacity-50"
        >
          {submit.isPending ? 'Submitting...' : 'Submit KYC for review'}
        </button>
        {submit.isError && <p className="mt-2 text-sm text-rider-danger">{(submit.error as Error).message}</p>}
      </Panel>
    </>
  );
}
