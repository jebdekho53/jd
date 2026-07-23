'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, FileUp, XCircle } from 'lucide-react';
import { getMe, listRiderDocuments, type KycStatus, type RiderDocumentType } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';

const REQUIRED_DOCS: { type: RiderDocumentType; label: string }[] = [
  { type: 'ID_PROOF', label: 'ID proof' },
  { type: 'DRIVING_LICENSE', label: 'Driving licence' },
  { type: 'PROFILE_PHOTO', label: 'Profile photo' },
  { type: 'PAN_CARD', label: 'PAN card' },
  { type: 'VEHICLE_RC', label: 'Vehicle RC' },
];

const STAGE_COPY: Record<KycStatus, { title: string; body: string; tone: 'wait' | 'good' | 'bad' }> = {
  PENDING: {
    title: 'Documents not submitted yet',
    body: 'Upload every required document and submit them for review. Nothing reaches our team until you submit.',
    tone: 'wait',
  },
  SUBMITTED: {
    title: 'Under review',
    body: 'Our compliance team is checking your documents. This usually takes up to two working days.',
    tone: 'wait',
  },
  APPROVED: {
    title: 'Approved',
    body: 'You can start a shift, go online, and accept delivery offers.',
    tone: 'good',
  },
  REJECTED: {
    title: 'Changes needed',
    body: 'One or more documents were rejected. Fix the ones flagged below and submit again.',
    tone: 'bad',
  },
};

const TONE_CLASS = {
  wait: 'border-rider-info/40 bg-rider-info/10 text-rider-info',
  good: 'border-rider-online/40 bg-rider-online/10 text-rider-online',
  bad: 'border-rider-danger/40 bg-rider-danger/10 text-rider-danger',
} as const;

export default function OnboardingStatusPage() {
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe });
  const documents = useQuery({ queryKey: ['rider', 'kyc', 'documents'], queryFn: listRiderDocuments });

  const profile = me.data?.profile ?? null;
  const kycStatus: KycStatus = profile?.kycStatus ?? 'PENDING';
  const stage = STAGE_COPY[kycStatus];
  const byType = new Map((documents.data ?? []).map((doc) => [doc.documentType, doc]));

  return (
    <CaptainPageShell title="Application status" subtitle="Where your partner application stands.">
      <div className={`rounded-2xl border p-5 ${TONE_CLASS[stage.tone]}`}>
        <p className="text-lg font-black">{stage.title}</p>
        <p className="mt-1 text-sm opacity-90">{stage.body}</p>
      </div>

      <Panel title="Your details">
        <dl className="space-y-2 text-sm">
          <Row label="Name" value={profile?.name ?? '—'} />
          <Row label="Mobile" value={me.data?.user.phone ?? '—'} />
          <Row label="Vehicle" value={profile?.vehicleType ?? '—'} />
          <Row label="Vehicle number" value={profile?.vehicleNumber || 'Not provided'} />
          <Row label="Licence number" value={profile?.licenseNumber || 'Not provided'} />
          <Row
            label="Applied on"
            value={profile ? new Date(profile.createdAt).toLocaleDateString('en-IN') : '—'}
          />
        </dl>
        <Link href="/account/edit" className="mt-4 inline-block text-sm font-bold text-rider-accent">
          Edit my details
        </Link>
      </Panel>

      <Panel title="Documents">
        {documents.isLoading ? (
          <p className="text-sm text-rider-muted">Loading documents…</p>
        ) : documents.isError ? (
          <p className="text-sm text-rider-danger">Could not load your documents. Pull to refresh.</p>
        ) : (
          <ul className="space-y-2">
            {REQUIRED_DOCS.map(({ type, label }) => {
              const doc = byType.get(type);
              return (
                <li key={type} className="rounded-xl bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-rider-text">{label}</b>
                    <DocState status={doc?.status} />
                  </div>
                  {doc?.rejectionReason && (
                    <p className="mt-1 text-xs text-rider-danger">{doc.rejectionReason}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/kyc"
          className="mt-4 grid h-12 w-full place-items-center rounded-xl bg-rider-accent font-bold text-rider-accent-foreground"
        >
          {kycStatus === 'APPROVED' ? 'View my documents' : 'Upload or fix documents'}
        </Link>
      </Panel>

      <Panel title="What happens next">
        <ol className="space-y-2 text-sm text-rider-muted">
          <Step done={Boolean(profile)} label="Profile created" />
          <Step done={kycStatus !== 'PENDING'} label="Documents submitted for review" />
          <Step done={kycStatus === 'APPROVED'} label="Compliance approval" />
          <Step done={kycStatus === 'APPROVED'} label="Start a shift and go online" />
        </ol>
        <p className="mt-3 text-xs text-rider-muted">
          Stuck for more than two working days? Raise a ticket from{' '}
          <Link href="/support" className="text-rider-accent underline">
            Support
          </Link>
          .
        </p>
      </Panel>
    </CaptainPageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-rider-muted">{label}</dt>
      <dd className="text-right font-semibold text-rider-text">{value}</dd>
    </div>
  );
}

function DocState({ status }: { status?: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' }) {
  if (status === 'APPROVED') {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-rider-online">
        <CheckCircle2 className="h-4 w-4" /> Approved
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-rider-danger">
        <XCircle className="h-4 w-4" /> Rejected
      </span>
    );
  }
  if (status) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-rider-info">
        <Clock className="h-4 w-4" /> In review
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-rider-muted">
      <FileUp className="h-4 w-4" /> Not uploaded
    </span>
  );
}

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black ${
          done ? 'bg-rider-online text-rider-bg' : 'bg-rider-border text-rider-muted'
        }`}
      >
        {done ? '✓' : ''}
      </span>
      <span className={done ? 'text-rider-text' : ''}>{label}</span>
    </li>
  );
}
