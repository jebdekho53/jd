import type { Metadata } from 'next';
import { OperationsMapContent } from '@/features/operations/operations-map-content';

export const metadata: Metadata = { title: 'Operations Map' };

export default function OperationsMapPage() {
  return <OperationsMapContent />;
}
