'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Mail, MessageSquare } from 'lucide-react';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { Button } from '@/design-system/primitives';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function ContactPageContent() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <StaticPageLayout title="Contact us" subtitle="We're here to help — typically within 24 hours">
      {submitted ? (
        <div className="not-prose flex flex-col items-center rounded-2xl border border-success/20 bg-success/5 px-6 py-10 text-center">
          <CheckCircle className="h-12 w-12 text-success" aria-hidden />
          <p className="mt-4 text-lg font-semibold text-jd-text-primary">Message received!</p>
          <p className="mt-2 max-w-sm text-sm text-jd-text-muted">
            We&apos;ll get back to you within 24 hours at the email you provided.
          </p>
          <Link
            href="/help"
            className="mt-6 inline-flex min-h-touch items-center text-sm font-semibold text-primary hover:underline"
          >
            Browse help articles
          </Link>
        </div>
      ) : (
        <form
          className="not-prose space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-jd-text-primary">
                Name
              </label>
              <Input id="name" name="name" required className="mt-2 h-11 rounded-xl" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-jd-text-primary">
                Email
              </label>
              <Input id="email" name="email" type="email" required className="mt-2 h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="text-sm font-medium text-jd-text-primary">
              Subject
            </label>
            <Input id="subject" name="subject" required className="mt-2 h-11 rounded-xl" />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-medium text-jd-text-primary">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className={cn(
                'mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            />
          </div>
          <Button type="submit" className="min-h-touch w-full sm:w-auto">
            <MessageSquare className="mr-2 h-4 w-4" aria-hidden />
            Send message
          </Button>
          <p className="flex items-center gap-2 text-xs text-jd-text-muted">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Or email us at{' '}
            <a href="mailto:support@jebdekho.com" className="font-medium text-primary hover:underline">
              support@jebdekho.com
            </a>
          </p>
        </form>
      )}
    </StaticPageLayout>
  );
}
