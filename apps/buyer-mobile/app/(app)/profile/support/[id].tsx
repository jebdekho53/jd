import { useLocalSearchParams } from 'expo-router';
import { AuthGuard } from '@/features/auth/auth-guard';
import { SupportTicketScreen } from '@/features/profile/support-ticket-screen';

export default function SupportTicketPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <AuthGuard>
      <SupportTicketScreen ticketId={id} />
    </AuthGuard>
  );
}
