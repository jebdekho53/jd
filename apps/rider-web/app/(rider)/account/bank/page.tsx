'use client';

import { useRouter } from 'next/navigation';
import { RiderBankAccountScreen } from '@/features/rider/rider-bank-account';

export default function AccountBankPage() {
  const router = useRouter();
  return <RiderBankAccountScreen onBack={() => router.push('/account')} />;
}
