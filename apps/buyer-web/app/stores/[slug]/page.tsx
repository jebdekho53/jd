import { StoreDetailView } from '@/features/stores/store-detail-view';

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params;
  return {
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  return <StoreDetailView slug={slug} />;
}
