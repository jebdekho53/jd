const IST_TIMEZONE = 'Asia/Kolkata';
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

export function startOfIstDay(date = new Date()): Date {
  const { y, m, d } = istYmd(date);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}

export function startOfIstWeek(date = new Date()): Date {
  const dayStart = startOfIstDay(date);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    weekday: 'long',
  }).format(date);
  const dow = IST_WEEKDAYS.indexOf(weekday);
  return new Date(dayStart.getTime() - dow * 24 * 60 * 60 * 1000);
}
