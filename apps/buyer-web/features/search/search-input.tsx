'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search products…',
  className,
  autoFocus,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border-border/60 bg-card pl-10 shadow-sm"
        autoFocus={autoFocus}
        aria-label={placeholder}
      />
    </div>
  );
}
