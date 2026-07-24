import type { Metadata } from 'next';
import { CaptainChrome } from '@/features/rider/captain-chrome';
import { SupportTicketDetail } from '@/features/rider/support-ticket-detail';

export const metadata: Metadata = { title: 'Ticket | JebDekho Rider' };

export default async function SupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <CaptainChrome>
      <SupportTicketDetail ticketId={id} />
    </CaptainChrome>
  );
}
