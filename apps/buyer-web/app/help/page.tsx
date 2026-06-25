import { HelpPageContent } from '@/features/help/help-page-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Help center',
  description: 'Get help with orders, payments, delivery, and refunds on JebDekho.',
  path: '/help',
});

export default function HelpPage() {
  return <HelpPageContent />;
}
