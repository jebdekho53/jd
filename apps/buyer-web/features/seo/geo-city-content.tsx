import { getApiBaseUrl } from '@jebdekho/web-config';
import Link from 'next/link';

interface GeoCityContentProps {
  citySlug: string;
  featuredAnswer?: string | null;
}

async function fetchCityData(citySlug: string) {
  const base = getApiBaseUrl();
  const [storesRes, categoriesRes] = await Promise.all([
    fetch(`${base}/buyer/stores?limit=6`, { next: { revalidate: 3600 } }).catch(() => null),
    fetch(`${base}/buyer/categories`, { next: { revalidate: 3600 } }).catch(() => null),
  ]);

  const stores = storesRes?.ok
    ? ((await storesRes.json()) as { data?: Array<{ id: string; name: string; slug: string; locality?: string }> }).data ?? []
    : [];
  const categories = categoriesRes?.ok
    ? ((await categoriesRes.json()) as { data?: Array<{ id: string; name: string; slug: string }> }).data?.slice(0, 8) ?? []
    : [];

  return { stores, categories };
}

export async function GeoCityContent({ citySlug, featuredAnswer }: GeoCityContentProps) {
  const { stores, categories } = await fetchCityData(citySlug);
  const cityLabel = citySlug.replace(/-/g, ' ');

  return (
    <div className="not-prose mt-8 space-y-8">
      {featuredAnswer && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Quick answer</p>
          <p className="mt-1 text-sm text-jd-text-primary">{featuredAnswer}</p>
        </div>
      )}

      <p className="text-sm text-jd-text-muted">
        JebDekho delivers across India including {cityLabel} — compare prices from nearby stores.
      </p>

      {categories.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Popular categories in {cityLabel}</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/city/${citySlug}/${c.slug}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {stores.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Stores delivering near you</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {stores.map((s) => (
              <li key={s.id}>
                <Link href={`/store/${s.slug}`} className="block rounded-xl border border-border bg-card p-4 hover:border-primary">
                  <p className="font-medium">{s.name}</p>
                  {s.locality && <p className="text-xs text-jd-text-muted">{s.locality}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Compare & save</h2>
        <p className="text-sm text-jd-text-muted">
          Use JebDekho to compare milk, atta, and daily essentials across local stores in {cityLabel}.
        </p>
        <Link href={`/search?q=grocery`} className="mt-3 inline-block font-medium text-primary hover:underline">
          Search products →
        </Link>
      </section>
    </div>
  );
}
