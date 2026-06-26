import {
  daysAgoIst,
  istDayRange,
  orderIstDayFilter,
  startOfIstDay,
  startOfIstMonth,
  startOfIstWeek,
} from './ist-day.util';

describe('startOfIstDay', () => {
  it('returns midnight IST for a midday IST instant', () => {
    const noonIst = new Date('2026-06-26T06:30:00.000Z');
    expect(startOfIstDay(noonIst).toISOString()).toBe('2026-06-25T18:30:00.000Z');
  });
});

describe('istDayRange', () => {
  it('spans 24 hours in IST', () => {
    const { start, end } = istDayRange(new Date('2026-06-26T06:30:00.000Z'));
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});

describe('startOfIstMonth', () => {
  it('returns first day of month in IST', () => {
    expect(startOfIstMonth(new Date('2026-06-15T06:30:00.000Z')).toISOString()).toBe(
      '2026-05-31T18:30:00.000Z',
    );
  });
});

describe('startOfIstWeek', () => {
  it('returns Sunday midnight IST for a Thursday', () => {
    const thursday = new Date('2026-06-25T06:30:00.000Z');
    const weekStart = startOfIstWeek(thursday);
    expect(weekStart.toISOString()).toBe('2026-06-20T18:30:00.000Z');
  });
});

describe('daysAgoIst', () => {
  it('steps back full IST calendar days', () => {
    const ref = new Date('2026-06-26T06:30:00.000Z');
    expect(daysAgoIst(1, ref).toISOString()).toBe('2026-06-24T18:30:00.000Z');
  });
});

describe('orderIstDayFilter', () => {
  it('matches orders paid today even when created earlier', () => {
    expect(orderIstDayFilter({ today: true })).toEqual({
      OR: [
        { createdAt: { gte: expect.any(Date) } },
        { paidAt: { gte: expect.any(Date) } },
      ],
    });
  });
});
