import { MapDiscoveryView } from '@/features/map/map-discovery-view';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Map — Jebdekho' };

export default function MapPage() {
  return <MapDiscoveryView />;
}
