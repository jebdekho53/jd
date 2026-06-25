import type { Metadata } from 'next';
import { MerchantSignupContent } from '@/features/onboarding/merchant-signup-content';

export const metadata: Metadata = {
  title: 'Merchant Signup',
  description: 'Create your JebDekho merchant account and apply to sell on our platform.',
  openGraph: {
    title: 'Merchant Signup — JebDekho',
    description: 'Start selling with JebDekho in minutes.',
  },
};

export default function SignupPage() {
  return <MerchantSignupContent />;
}
