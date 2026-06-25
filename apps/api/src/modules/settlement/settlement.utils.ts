import { Decimal } from '@prisma/client/runtime/library';

export function decimalToNumber(value: Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : value.toNumber();
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
