import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AiCatalogMonitorContent } from '@/features/ai-catalog/ai-catalog-monitor-content';

export const metadata: Metadata = { title: 'AI Catalog' };

export default function AiCatalogPage() {
  return (
    <DashboardShell title="AI Catalog v2">
      <AiCatalogMonitorContent />
    </DashboardShell>
  );
}
