import type { Metadata } from 'next';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { LegalDocumentView, type LegalDocumentData } from '@/features/legal/legal-document-view';

export const metadata: Metadata = {
  title: 'Merchant Partner Agreement | JebDekho',
  description:
    'The agreement between UrbanMove Services Private Limited and merchants selling on JebDekho.',
};

// The agreement changes only when a new version is published.
export const revalidate = 3600;

async function loadAgreement(): Promise<LegalDocumentData | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/legal/documents/MERCHANT_AGREEMENT`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export default async function MerchantAgreementPage() {
  const doc = await loadAgreement();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      {doc ? (
        <LegalDocumentView doc={doc} />
      ) : (
        <p className="text-sm text-slate-600">
          The agreement could not be loaded right now. Please refresh, or contact{' '}
          <a className="font-medium text-brand-600 hover:underline" href="mailto:merchant@jebdekho.com">
            merchant@jebdekho.com
          </a>
          .
        </p>
      )}
    </main>
  );
}
