import { ContactPageContent } from '@/features/help/contact-page-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Contact support',
  description: 'Contact JebDekho customer support for order and account help.',
  path: '/contact',
});

export default function ContactPage() {
  return <ContactPageContent />;
}
