import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { WhatsAppBroadcastContent } from '@/features/whatsapp/whatsapp-broadcast-content';

export const metadata: Metadata = { title: 'WhatsApp Broadcast' };

export default function WhatsAppBroadcastPage() {
  return (
    <DashboardShell title="WhatsApp Broadcast">
      <WhatsAppBroadcastContent />
    </DashboardShell>
  );
}
