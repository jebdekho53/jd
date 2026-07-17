import type { Metadata } from 'next';
import { getApiBaseUrl } from '@jebdekho/web-config';

export const metadata: Metadata = { title: 'Delivery Partner Agreement | JebDekho' };
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
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-300">
        <p className="mx-auto max-w-2xl text-sm">
          The agreement could not be loaded right now. Please refresh, or contact{' '}
          <a className="text-cyan-300 underline" href="mailto:partners@jebdekho.com">
            partners@jebdekho.com
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-300">
      <div className="mx-auto w-full max-w-2xl">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-white">{doc.title}</h1>
          <p className="mt-1 text-xs text-slate-500">
            Version {doc.version} · Effective {doc.effectiveDate}
          </p>
        </header>

        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-6">
            <h2 className="text-sm font-semibold text-slate-100">{section.heading}</h2>
            {section.body?.map((p) => (
              <p key={p.slice(0, 48)} className="mt-2 text-sm leading-relaxed text-slate-400">
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-400">
                {section.list.map((item) => (
                  <li key={item.slice(0, 48)}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
