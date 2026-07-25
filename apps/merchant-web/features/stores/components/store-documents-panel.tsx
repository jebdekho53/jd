'use client';

import { useRef, useState } from 'react';
import { Upload, FileCheck } from 'lucide-react';
import { Button } from '@/design-system/primitives';
import type { Store, StoreDocumentType } from '@/types/store';
import { DOCUMENT_TYPE_LABELS } from '@/types/store';

/** The standard compliance document set a merchant may be missing (excludes
 *  the catch-all OTHER type, which isn't something to solicit proactively). */
const STANDARD_DOCUMENT_TYPES: StoreDocumentType[] = [
  'GST_CERTIFICATE',
  'PAN_CARD',
  'FSSAI_LICENSE',
  'TRADE_LICENSE',
  'BANK_PROOF',
];

interface StoreDocumentsPanelProps {
  store: Store;
  onUpload: (payload: {
    documentType: StoreDocumentType;
    fileName: string;
    mimeType: string;
    fileUrl: string;
  }) => Promise<void>;
  onSubmitDocuments: () => Promise<void>;
  isUploading: boolean;
  isSubmitting: boolean;
  /** 'requested' (default) = admin flagged specific gaps, must resubmit for
   *  review once filled. 'all' = an approved merchant browsing their full
   *  standard document set to fill in whatever they skipped — no review step. */
  mode?: 'requested' | 'all';
}

const MAX_FILE_SIZE = 4 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function StoreDocumentsPanel({
  store,
  onUpload,
  onSubmitDocuments,
  isUploading,
  isSubmitting,
  mode = 'requested',
}: StoreDocumentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeType, setActiveType] = useState<StoreDocumentType | null>(null);

  const requestedTypes = (store.requestedDocumentTypes ?? []) as StoreDocumentType[];
  const displayTypes = mode === 'all' ? STANDARD_DOCUMENT_TYPES : requestedTypes;
  const uploadedTypes = new Set(store.verificationDocuments.map((d) => d.documentType));
  const allUploaded = requestedTypes.every((t) => uploadedTypes.has(t));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeType) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('File must be under 4 MB');
      e.target.value = '';
      return;
    }

    const fileUrl = await readFileAsDataUrl(file);
    await onUpload({
      documentType: activeType,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileUrl,
    });

    e.target.value = '';
    setActiveType(null);
  };

  const triggerUpload = (documentType: StoreDocumentType) => {
    setActiveType(documentType);
    fileInputRef.current?.click();
  };

  const containerClass =
    mode === 'all'
      ? 'mb-4 rounded-xl border border-slate-200 bg-white p-4'
      : 'mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4';

  return (
    <div className={containerClass}>
      <h3 className={mode === 'all' ? 'text-sm font-semibold text-slate-900' : 'text-sm font-semibold text-blue-900'}>
        {mode === 'all' ? 'Store documents' : 'Documents required'}
      </h3>
      {mode === 'all' ? (
        <p className="mt-1 text-xs text-slate-500">
          Add or update any compliance document you skipped earlier — no admin request needed.
        </p>
      ) : (
        store.documentRequestReason && (
          <p className="mt-2 text-sm text-blue-800">{store.documentRequestReason}</p>
        )
      )}

      <ul className="mt-4 space-y-2">
        {displayTypes.map((type) => {
          const uploaded = store.verificationDocuments.find((d) => d.documentType === type);
          return (
            <li
              key={type}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                {uploaded ? (
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Upload className="h-4 w-4 text-slate-400" />
                )}
                <span className="font-medium text-slate-800">{DOCUMENT_TYPE_LABELS[type]}</span>
                {uploaded && (
                  <span className="text-xs text-slate-500">({uploaded.fileName})</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => triggerUpload(type)}
                disabled={isUploading}
              >
                {uploaded ? 'Replace' : 'Upload'}
              </Button>
            </li>
          );
        })}
      </ul>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {mode === 'requested' && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={onSubmitDocuments}
            loading={isSubmitting}
            disabled={!allUploaded || isUploading}
          >
            Submit documents for review
          </Button>
        </div>
      )}
    </div>
  );
}
