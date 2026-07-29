import { useLocalSearchParams } from 'expo-router';
import { SupportTicketScreen } from '@/features/profile/support-ticket-screen';

export default function SupportTicketPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SupportTicketScreen ticketId={id} />;
}
