import type { Metadata } from 'next';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { PublicPageShell, Section, Bullets } from '@/features/public/public-page-shell';

export const metadata: Metadata = {
  title: 'Delivery Partner Agreement | JebDekho',
  description:
    'The agreement between JebDekho and its delivery partners, served from the same source as the version riders accept at signup.',
  robots: { index: true, follow: true },
};
export const revalidate = 3600;

interface Section {
  heading: string;
  body?: string[];
  list?: string[];
}
interface Doc {
  title: string;
  version: string;
  effectiveDate: string;
  sections: Section[];
}

async function loadAgreement(): Promise<Doc | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/legal/documents/RIDER_AGREEMENT`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json())?.data ?? null;
  } catch {
    return null;
  }
}

export default async function RiderAgreementPage() {
  const doc = await loadAgreement();

  if (!doc) {
    return (
      <PublicPageShell title="Delivery Partner Agreement">
        <Section heading="Could not load the agreement">
          <p>
            Please refresh, or contact{' '}
            <a className="text-rider-accent underline" href="mailto:partners@jebdekho.com">
              partners@jebdekho.com
            </a>
            .
          </p>
        </Section>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell
      title={doc.title}
      subtitle={`Version ${doc.version} · Effective ${doc.effectiveDate}`}
    >
      {doc.sections.map((section) => (
        <Section key={section.heading} heading={section.heading}>
          {section.body?.map((p) => (
            <p key={p.slice(0, 48)}>{p}</p>
          ))}
          {section.list && <Bullets items={section.list} />}
        </Section>
      ))}
    </PublicPageShell>
  );
}
