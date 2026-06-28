import { VerticalBusinessType } from '@prisma/client';
import { isFoodVertical, slugifyMenu, FOOD_VERTICALS } from './vertical.constants';

describe('vertical.constants', () => {
  it('identifies food verticals', () => {
    expect(isFoodVertical(VerticalBusinessType.RESTAURANT)).toBe(true);
    expect(isFoodVertical(VerticalBusinessType.CLOUD_KITCHEN)).toBe(true);
    expect(isFoodVertical(VerticalBusinessType.GROCERY)).toBe(false);
    expect(FOOD_VERTICALS.has(VerticalBusinessType.CAFE)).toBe(true);
  });

  it('slugifies menu names', () => {
    expect(slugifyMenu('Paneer Butter Masala')).toBe('paneer-butter-masala');
    expect(slugifyMenu('  ')).toBe('item');
  });
});
