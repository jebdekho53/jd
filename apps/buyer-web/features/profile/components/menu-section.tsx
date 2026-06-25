import { cn } from '@/lib/utils';

interface MenuSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function MenuSection({ title, children, className }: MenuSectionProps) {
  return (
    <section className={cn('space-y-2', className)} aria-label={title}>
      {title && (
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">
          {title}
        </h2>
      )}
      <div className="space-y-2">{children}</div>
    </section>
  );
}
