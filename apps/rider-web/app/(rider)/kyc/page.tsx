'use client';

import { CaptainPageShell } from '@/features/rider/captain-page-shell';
import { KycUploadPanel } from '@/features/rider/kyc-upload-panel';

export default function KycPage() {
  return (
    <CaptainPageShell title="KYC Documents" subtitle="Upload and submit required documents for approval.">
      <KycUploadPanel />
    </CaptainPageShell>
  );
}
