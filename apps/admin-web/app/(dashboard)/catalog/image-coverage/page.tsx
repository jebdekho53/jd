import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ImageCoverageContent } from '@/features/catalog/image-coverage-content';

export const metadata: Metadata = { title: 'Image Coverage' };

export default function ImageCoveragePage() {
  return (
    <DashboardShell title="Image Coverage">
      <ImageCoverageContent />
    </DashboardShell>
  );
}
