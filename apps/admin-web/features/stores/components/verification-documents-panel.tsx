'use client';

import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import type { StoreDocumentType, StoreVerificationDocument } from '@/types/store';
import { DOCUMENT_TYPE_LABELS } from '@/types/store';
import { Button } from '@/design-system';

function DocumentPreview({ doc }: { doc: StoreVerificationDocument }) {
  const isImage = doc.mimeType.startsWith('image/');
  const isPdf = doc.mimeType === 'application/pdf' || doc.fileName.toLowerCase().endsWith('.pdf');

  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={doc.fileUrl}
        alt={doc.fileName}
        className="max-h-64 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
      />
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={doc.fileUrl}
        title={doc.fileName}
        sandbox=""
        className="h-72 w-full rounded-lg border border-slate-200 bg-white"
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      <FileText className="h-5 w-5 shrink-0" />
      Preview not available for this file type.
    </div>
  );
}

export function VerificationDocumentsPanel({
  documents,
  requestedTypes,
}: {
  documents: StoreVerificationDocument[];
  requestedTypes?: StoreDocumentType[] | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    documents[0]?.id ?? null,
  );

  const requested = requestedTypes ?? [];
  const uploadedTypes = new Set(documents.map((d) => d.documentType));
  const missing = requested.filter((t) => !uploadedTypes.has(t));

  if (!documents.length && !requested.length) {
    return (
      <p className="text-sm text-slate-500">
        No verification documents uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {requested.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
          <p className="font-medium">Requested document types</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {requested.map((type) => (
              <li
                key={type}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  uploadedTypes.has(type)
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {DOCUMENT_TYPE_LABELS[type]}
                {uploadedTypes.has(type) ? ' ✓' : ' — missing'}
              </li>
            ))}
          </ul>
          {missing.length > 0 && (
            <p className="mt-2 text-xs text-amber-800">
              Waiting on: {missing.map((t) => DOCUMENT_TYPE_LABELS[t]).join(', ')}
            </p>
          )}
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-amber-700">Merchant has not uploaded any documents yet.</p>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => {
            const expanded = expandedId === doc.id;
            return (
              <li
                key={doc.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.fileName} · uploaded{' '}
                      {new Date(doc.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedId(expanded ? null : doc.id)}
                    >
                      {expanded ? 'Hide' : 'View'}
                    </Button>
                    <a href={doc.fileUrl} download={doc.fileName} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="gap-1">
                        <ExternalLink className="h-3 w-3" /> Download
                      </Button>
                    </a>
                  </div>
                </div>
                {expanded && (
                  <div className="border-t border-slate-100 p-4">
                    <DocumentPreview doc={doc} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
