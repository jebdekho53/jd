import Image from 'next/image';
import Link from 'next/link';
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/cn';

const SIZE_MAP = {
  xs: { px: 28, className: 'h-7' },
  sm: { px: 32, className: 'h-8' },
  md: { px: 40, className: 'h-10' },
  lg: { px: 48, className: 'h-12' },
} as const;

export type LogoSize = keyof typeof SIZE_MAP;

interface LogoProps {
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}

export function Logo({ size = 'md', className, priority = false }: LogoProps) {
  const { px, className: sizeClass } = SIZE_MAP[size];

  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt={BRAND_NAME}
      width={px}
      height={px}
      className={cn('w-auto object-contain', sizeClass, className)}
      priority={priority}
    />
  );
}

interface LogoLinkProps extends LogoProps {
  href?: string;
  linkClassName?: string;
}

export function LogoLink({
  href = '/',
  size = 'md',
  className,
  linkClassName,
  priority = false,
}: LogoLinkProps) {
  return (
    <Link
      href={href}
      className={cn('inline-flex shrink-0 items-center', linkClassName)}
      aria-label={`${BRAND_NAME} home`}
    >
      <Logo size={size} className={className} priority={priority} />
    </Link>
  );
}
