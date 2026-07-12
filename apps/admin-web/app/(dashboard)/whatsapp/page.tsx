import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { WhatsAppInboxContent } from '@/features/whatsapp/whatsapp-inbox-content';

export const metadata: Metadata = { title: 'WhatsApp Inbox' };

export default function WhatsAppInboxPage() {
  return (
    <DashboardShell title="WhatsApp Inbox">
      <WhatsAppInboxContent />
    </DashboardShell>
  );
}
