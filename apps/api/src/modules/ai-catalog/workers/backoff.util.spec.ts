import { jitteredExponentialBackoff } from './backoff.util';
import { BACKOFF } from '../ai-catalog.constants';

describe('jitteredExponentialBackoff', () => {
  it('grows roughly exponentially across attempts', () => {
    const a1 = median(() => jitteredExponentialBackoff(1));
    const a3 = median(() => jitteredExponentialBackoff(3));
    expect(a3).toBeGreaterThan(a1);
  });

  it('never returns below the base delay', () => {
    for (let i = 0; i < 200; i++) {
      expect(jitteredExponentialBackoff(1)).toBeGreaterThanOrEqual(BACKOFF.baseMs);
    }
  });

  it('is capped near the max (allowing for +jitter)', () => {
    const ceiling = BACKOFF.maxMs * (1 + BACKOFF.jitterRatio) + 1;
    for (let i = 0; i < 200; i++) {
      expect(jitteredExponentialBackoff(20)).toBeLessThanOrEqual(ceiling);
    }
  });

  it('introduces jitter (not all values identical)', () => {
    const values = new Set(Array.from({ length: 50 }, () => jitteredExponentialBackoff(3)));
    expect(values.size).toBeGreaterThan(1);
  });
});

function median(fn: () => number): number {
  const xs = Array.from({ length: 51 }, fn).sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}
