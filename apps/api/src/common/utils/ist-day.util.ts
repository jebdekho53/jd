import { Prisma } from '@prisma/client';

export const IST_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const IST_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function istYmd(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return {
    y: Number(parts.find((p) => p.type === 'year')!.value),
    m: Number(parts.find((p) => p.type === 'month')!.value),
    d: Number(parts.find((p) => p.type === 'day')!.value),
  };
}

/** Midnight Asia/Kolkata for the given instant. */
export function startOfIstDay(date = new Date()): Date {
  const { y, m, d } = istYmd(date);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}

export function endOfIstDay(date = new Date()): Date {
  return new Date(startOfIstDay(date).getTime() + 24 * 60 * 60 * 1000);
}

export function istDayRange(date = new Date()): { start: Date; end: Date } {
  const start = startOfIstDay(date);
  return { start, end: endOfIstDay(date) };
}

export function startOfIstMonth(date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === 'year')!.value);
  const m = Number(parts.find((p) => p.type === 'month')!.value);
  return new Date(Date.UTC(y, m - 1, 1) - IST_OFFSET_MS);
}

export function istWeekdayIndex(date = new Date()): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    weekday: 'long',
  }).format(date);
  return IST_WEEKDAYS.indexOf(name);
}

/** Sunday-start week in IST. */
export function startOfIstWeek(date = new Date()): Date {
  const dayStart = startOfIstDay(date);
  const dow = istWeekdayIndex(date);
  return new Date(dayStart.getTime() - dow * 24 * 60 * 60 * 1000);
}

export function daysAgoIst(n: number, from = new Date()): Date {
  return new Date(startOfIstDay(from).getTime() - n * 24 * 60 * 60 * 1000);
}

/** @deprecated Use startOfIstDay — all platform "today" boundaries are IST. */
export const startOfUtcDay = startOfIstDay;

export function daysAgo(n: number): Date {
  return daysAgoIst(n);
}

/** Orders created or paid on the selected IST calendar day. */
export function orderIstDayFilter(opts: {
  today?: boolean;
  yesterday?: boolean;
}): Prisma.OrderWhereInput | undefined {
  if (!opts.today && !opts.yesterday) return undefined;

  const dayStart = startOfIstDay();
  const yesterdayStart = daysAgoIst(1);

  if (opts.today) {
    return {
      OR: [
        { createdAt: { gte: dayStart } },
        { paidAt: { gte: dayStart } },
      ],
    };
  }

  return {
    OR: [
      { createdAt: { gte: yesterdayStart, lt: dayStart } },
      { paidAt: { gte: yesterdayStart, lt: dayStart } },
    ],
  };
}

export const merchantOrderDayFilter = orderIstDayFilter;

export function istHourRange(date = new Date()): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === 'year')!.value);
  const m = Number(parts.find((p) => p.type === 'month')!.value);
  const d = Number(parts.find((p) => p.type === 'day')!.value);
  const h = Number(parts.find((p) => p.type === 'hour')!.value);
  const start = new Date(Date.UTC(y, m - 1, d, h) - IST_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 60 * 60 * 1000) };
}
