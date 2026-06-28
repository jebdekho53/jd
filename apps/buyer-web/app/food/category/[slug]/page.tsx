import Link from 'next/link';
import { getSiteUrl } from '@jebdekho/web-config';
import { PageShell } from '@/components/layout/site-shell';
import { createPageMetadata, breadcrumbJsonLd } from '@/lib/seo/metadata';
import { VerticalNav } from '@/features/home/vertical-nav';

const FOOD_CATEGORIES: Record<string, { title: string; description: string }> = {
  pizza: {
    title: 'Pizza',
    description: 'Wood-fired, thin crust and classic pizzas from restaurants near you.',
  },
  burger: {
    title: 'Burgers',
    description: 'Gourmet burgers, fries and combos delivered fast.',
  },
  rolls: {
    title: 'Rolls & wraps',
    description: 'Kathi rolls, wraps and street-style rolls for every craving.',
  },
  chinese: {
    title: 'Chinese',
    description: 'Noodles, fried rice, manchurian and Indo-Chinese favourites.',
  },
  biryani: {
    title: 'Biryani',
    description: 'Hyderabadi, Lucknowi and dum biryani from top kitchens.',
  },
  'south-indian': {
    title: 'South Indian',
    description: 'Dosa, idli, vada and filter coffee from authentic eateries.',
  },
  'north-indian': {
    title: 'North Indian',
    description: 'Curries, naan, tandoori and homestyle North Indian meals.',
  },
  desserts: {
    title: 'Desserts',
    description: 'Cakes, ice cream, mithai and sweet treats.',
  },
  beverages: {
    title: 'Beverages',
    description: 'Shakes, juices, mocktails and refreshing drinks.',
  },
  coffee: {
    title: 'Coffee',
    description: 'Specialty coffee, espresso and café favourites.',
  },
  'fast-food': {
    title: 'Fast food',
    description: 'Quick bites, snacks and on-the-go meals.',
  },
  healthy: {
    title: 'Healthy food',
    description: 'Salads, bowls and balanced meals for everyday wellness.',
  },
  'street-food': {
    title: 'Street food',
    description: 'Local street favourites and regional snacks.',
  },
};

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const preset = FOOD_CATEGORIES[slug];
  const title = preset?.title ?? titleFromSlug(slug);
  return createPageMetadata({
    title: `${title} delivery near you`,
    description:
      preset?.description ??
      `Order ${title.toLowerCase()} online from restaurants near you on JebDekho.`,
    path: `/food/category/${slug}`,
  });
}

export default async function FoodCategoryPage({ params }: Props) {
  const { slug } = await params;
  const preset = FOOD_CATEGORIES[slug];
  const title = preset?.title ?? titleFromSlug(slug);
  const description =
    preset?.description ??
    `Discover ${title.toLowerCase()} from local restaurants with fast delivery on JebDekho.`;
  const siteUrl = getSiteUrl();

  const schema = breadcrumbJsonLd([
    { name: 'Home', url: siteUrl },
    { name: 'Food', url: `${siteUrl}/food` },
    { name: title, url: `${siteUrl}/food/category/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <VerticalNav className="-mx-1 px-1" />
          <nav className="text-sm text-jd-text-muted">
            <Link href="/food" className="hover:text-primary">Food</Link>
            <span className="mx-2">/</span>
            <span className="text-jd-text-primary">{title}</span>
          </nav>
          <header>
            <h1 className="text-2xl font-bold text-jd-text-primary md:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-jd-text-secondary md:text-base">{description}</p>
          </header>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-jd-text-secondary">
              Browse restaurants with {title.toLowerCase()} on their menu and order for delivery to your doorstep.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/food"
                className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary btn-press"
              >
                Browse food home
              </Link>
              <Link
                href="/restaurants"
                className="inline-flex rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-jd-text-primary transition hover:border-primary/40"
              >
                All restaurants
              </Link>
            </div>
          </div>
          <section>
            <h2 className="text-lg font-semibold">Popular categories</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {Object.entries(FOOD_CATEGORIES)
                .filter(([key]) => key !== slug)
                .slice(0, 8)
                .map(([key, cat]) => (
                  <li key={key}>
                    <Link
                      href={`/food/category/${key}`}
                      className="inline-block rounded-full bg-cream-3 px-3 py-1.5 text-xs font-medium text-jd-text-secondary hover:bg-primary/10 hover:text-primary"
                    >
                      {cat.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      </PageShell>
    </>
  );
}
