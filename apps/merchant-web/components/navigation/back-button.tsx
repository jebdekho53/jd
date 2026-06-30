'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/design-system/primitives';

interface BackButtonProps {
  fallbackHref: string;
  label?: string;
  className?: string;
}

export function BackButton({ fallbackHref, label = 'Back', className }: BackButtonProps) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={goBack}
      aria-label={label}
      className={className}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
