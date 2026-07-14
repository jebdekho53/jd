'use client';

import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { CheckCircle2, Clock, Upload, XCircle } from 'lucide-react';

type DocumentType =
  | 'PAN_CARD'
  | 'CANCELLED_CHEQUE'
  | 'GST_CERTIFICATE'
  | 'AADHAAR'
  | 'ADDRESS_PROOF'
  | 'SIGNED_AGREEMENT'
  | 'OTHER';

interface Doc {
  id: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string | null;
}

interface KycStatus {
  agreementAccepted: boolean;
  bankVerified: boolean;
  panVerified: boolean;
  requiredDocuments: DocumentType[];
  missingDocuments: DocumentType[];
  documents: Doc[];
  payoutReady: boolean;
}

const LABEL: Record<DocumentType, string> = {
  PAN_CARD: 'PAN card',
  CANCELLED_CHEQUE: 'Cancelled cheque',
  GST_CERTIFICATE: 'GST certificate',
  AADHAAR: 'Aadhaar',
  ADDRESS_PROOF: 'Address proof',
  SIGNED_AGREEMENT: 'Signed agreement',
  OTHER: 'Other',
};

const UPLOADABLE: DocumentType[] = [
  'PAN_CARD',
  'CANCELLED_CHEQUE',
  'GST_CERTIFICATE',
  'SIGNED_AGREEMENT',
  'ADDRESS_PROOF',
];

function KycInner() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: kyc, isLoading } = useQuery<KycStatus>({
    queryKey: ['franchise', 'kyc'],
    queryFn: async () => (await (await fetch('/api/franchise/kyc')).json()).data,
  });

  const upload = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: DocumentType }) => {
      const dataUrl = await toDataUrl(file);

      // Two steps by design: the file goes to storage first, then the KYC record is
      // created with the returned URL — the same shape merchants already use.
      const up = await fetch('/api/uploads/document', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dataUrl, purpose: 'franchise-document' }),
      });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.message ?? 'Upload failed');

      const res = await fetch('/api/franchise/documents', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          documentType,
          fileName: file.name,
          fileUrl: upJson.data.url,
          mimeType: upJson.data.mimeType,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not save the document');
      return json.data;
    },
    onMutate: ({ documentType }) => {
      setUploading(documentType);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
    onSettled: async () => {
      setUploading(null);
      await queryClient.invalidateQueries({ queryKey: ['franchise', 'kyc'] });
    },
  });

  const acceptAgreement = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/franchise/agreement/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accepted: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not record acceptance');
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['franchise', 'kyc'] }),
  });

  const byType = new Map((kyc?.documents ?? []).map((d) => [d.documentType, d]));

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Verification</h1>
        <p className="mt-1 text-sm text-slate-400">
          We can only pay you once these are done.
        </p>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      {kyc && (
        <>
          {/* Say plainly what is blocking the money, rather than making them guess. */}
          <div
            className={`rounded-xl border p-4 ${
              kyc.payoutReady
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-amber-500/30 bg-amber-500/10'
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                kyc.payoutReady ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {kyc.payoutReady ? 'You are ready to be paid' : 'Payouts are on hold'}
            </p>
            {!kyc.payoutReady && (
              <ul className="mt-2 space-y-1 text-xs text-amber-200/90">
                {!kyc.agreementAccepted && <li>• Accept the franchise agreement</li>}
                {!kyc.panVerified && <li>• Upload a PAN card and wait for it to be verified</li>}
                {!kyc.bankVerified && <li>• Add a bank account and wait for it to be verified</li>}
              </ul>
            )}
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-200">Franchise agreement</h2>
            {kyc.agreementAccepted ? (
              <p className="flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Accepted
              </p>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-300">
                  I have read and accept the JebDekho franchise partner agreement, including
                  the exclusive-territory and commission terms.
                </p>
                <button
                  onClick={() => acceptAgreement.mutate()}
                  disabled={acceptAgreement.isPending}
                  className="mt-3 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
                >
                  {acceptAgreement.isPending ? 'Recording…' : 'I accept'}
                </button>
                {acceptAgreement.isError && (
                  <p className="mt-2 text-xs text-red-300">
                    {(acceptAgreement.error as Error).message}
                  </p>
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-1 text-sm font-semibold text-slate-200">Documents</h2>
            <p className="mb-3 text-xs text-slate-500">
              PDF or photo, up to 8 MB. PAN and cancelled cheque are required.
            </p>

            {error && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
            )}

            <div className="space-y-2">
              {UPLOADABLE.map((type) => (
                <DocumentRow
                  key={type}
                  type={type}
                  required={kyc.requiredDocuments.includes(type)}
                  doc={byType.get(type)}
                  uploading={uploading === type}
                  onPick={(file) => upload.mutate({ file, documentType: type })}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function DocumentRow({
  type,
  required,
  doc,
  uploading,
  onPick,
}: {
  type: DocumentType;
  required: boolean;
  doc?: Doc;
  uploading: boolean;
  onPick: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-200">
          {LABEL[type]}
          {required && <span className="ml-1 text-xs text-amber-400">required</span>}
        </p>
        {doc ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs">
            {doc.status === 'VERIFIED' && (
              <span className="flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {doc.status === 'PENDING' && (
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="h-3.5 w-3.5" /> Awaiting review
              </span>
            )}
            {doc.status === 'REJECTED' && (
              <span className="flex items-center gap-1 text-red-300">
                <XCircle className="h-3.5 w-3.5" /> Rejected — {doc.rejectionReason}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-500">Not uploaded</p>
        )}
      </div>

      <div className="shrink-0">
        <input
          ref={input}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-500 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

export default function KycPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <KycInner />
    </QueryClientProvider>
  );
}
