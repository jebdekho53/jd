'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactPageContent() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <StaticPageLayout title="Contact us" subtitle="We're here to help">
      {submitted ? (
        <div className="not-prose rounded-2xl bg-cream-3 p-6 text-center">
          <p className="font-semibold text-jd-text-primary">Message received!</p>
          <p className="mt-2 text-sm text-jd-text-muted">
            We&apos;ll get back to you within 24 hours at the email you provided.
          </p>
          <Link href="/help" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Browse help articles
          </Link>
        </div>
      ) : (
        <form
          className="not-prose space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div>
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input id="name" name="name" required className="mt-1.5" />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" name="email" type="email" required className="mt-1.5" />
          </div>
          <div>
            <label htmlFor="subject" className="text-sm font-medium">Subject</label>
            <Input id="subject" name="subject" required className="mt-1.5" />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-medium">Message</label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit">Send message</Button>
          <p className="text-xs text-jd-text-muted">
            Or email us directly at{' '}
            <a href="mailto:support@jebdekho.com" className="text-primary hover:underline">
              support@jebdekho.com
            </a>
          </p>
        </form>
      )}
    </StaticPageLayout>
  );
}
