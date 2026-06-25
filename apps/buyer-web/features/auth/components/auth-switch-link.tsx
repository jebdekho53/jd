'use client';

import Link from 'next/link';

interface AuthSwitchLinkProps {
  prompt: string;
  linkText: string;
  href: string;
}

export function AuthSwitchLink({ prompt, linkText, href }: AuthSwitchLinkProps) {
  return (
    <p className="text-sm text-jd-text-muted">
      {prompt}{' '}
      <Link href={href} className="font-semibold text-jd-primary hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
