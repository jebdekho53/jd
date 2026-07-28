import Image from 'next/image';
import Link from 'next/link';
import { BRAND_ICON_SRC, BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/cn';

interface BrandLockupProps {
  subtitle: string;
  href?: string;
  className?: string;
}

export function BrandLockup({ subtitle, href, className }: BrandLockupProps) {
  const inner = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1">
        <Image src={BRAND_ICON_SRC} alt={BRAND_NAME} width={28} height={28} className="h-7 w-7 object-contain" priority />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{BRAND_NAME}</p>
        <p className="truncate text-[10px] uppercase tracking-wider text-slate-400">{subtitle}</p>
      </div>
    </>
  );

  const wrapperClass = cn('flex items-center gap-2.5', className);

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {inner}
      </Link>
    );
  }

  return <div className={wrapperClass}>{inner}</div>;
}
