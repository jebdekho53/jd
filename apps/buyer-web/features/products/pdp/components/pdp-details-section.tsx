'use client';

import type { BuyerProductWithStore } from '@/types/buyer';

interface PdpDetailsSectionProps {
  product: BuyerProductWithStore;
}

const META_ROWS: { key: keyof NonNullable<BuyerProductWithStore['metadata']>; label: string }[] = [
  { key: 'ingredients', label: 'Ingredients' },
  { key: 'shelfLife', label: 'Shelf life' },
  { key: 'countryOfOrigin', label: 'Country of origin' },
  { key: 'manufacturerName', label: 'Manufacturer' },
  { key: 'manufacturerAddress', label: 'Manufacturer address' },
  { key: 'fssaiLicense', label: 'FSSAI license' },
  { key: 'hsnCode', label: 'HSN code' },
  { key: 'storageInstructions', label: 'Storage' },
  { key: 'disclaimer', label: 'Disclaimer' },
];

export function PdpDetailsSection({ product }: PdpDetailsSectionProps) {
  const tags = product.tags ?? [];
  const meta = product.metadata;
  const metaRows = meta
    ? META_ROWS.filter((row) => {
        const val = meta[row.key];
        if (row.key === 'taxInclusive') return false;
        return val != null && String(val).trim() !== '';
      })
    : [];
  const hasContent =
    Boolean(product.description) || tags.length > 0 || metaRows.length > 0 || meta?.taxInclusive;

  if (!hasContent) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5" aria-labelledby="pdp-details-heading">
      <h2 id="pdp-details-heading" className="mb-4 text-lg font-semibold text-jd-text-primary">
        Product details
      </h2>

      {product.description && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-jd-text-primary">Description</h3>
          <p className="mt-1 text-sm leading-relaxed text-jd-text-muted">{product.description}</p>
        </div>
      )}

      {tags.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-jd-text-primary">Highlights</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-jd-text-muted">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      )}

      <dl className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-jd-text-muted">Unit</dt>
          <dd className="font-medium text-jd-text-primary">{product.unit}</dd>
        </div>
        {product.brand && (
          <div>
            <dt className="text-jd-text-muted">Brand</dt>
            <dd className="font-medium text-jd-text-primary">{product.brand}</dd>
          </div>
        )}
        {product.category && (
          <div>
            <dt className="text-jd-text-muted">Category</dt>
            <dd className="font-medium text-jd-text-primary">{product.category.name}</dd>
          </div>
        )}
        <div>
          <dt className="text-jd-text-muted">Sold by</dt>
          <dd className="font-medium text-jd-text-primary">{product.store.name}</dd>
        </div>
        {meta?.taxInclusive && (
          <div>
            <dt className="text-jd-text-muted">Tax</dt>
            <dd className="font-medium text-jd-text-primary">Price inclusive of taxes</dd>
          </div>
        )}
        {metaRows.map(({ key, label }) => (
          <div key={key} className={key === 'ingredients' || key === 'disclaimer' ? 'sm:col-span-2' : undefined}>
            <dt className="text-jd-text-muted">{label}</dt>
            <dd className="font-medium text-jd-text-primary">{String(meta![key])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
