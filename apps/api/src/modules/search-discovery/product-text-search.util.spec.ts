import { buildProductTextSearchWhere } from './product-text-search.util';

describe('buildProductTextSearchWhere', () => {
  it('returns OR clause for index, name, and brand', () => {
    expect(buildProductTextSearchWhere('milk')).toEqual({
      OR: [
        { searchIndex: { searchText: { contains: 'milk' }, isActive: true } },
        { name: { contains: 'milk', mode: 'insensitive' } },
        { brand: { contains: 'milk', mode: 'insensitive' } },
      ],
    });
  });

  it('lowercases query for index contains', () => {
    const where = buildProductTextSearchWhere('Milk');
    expect(where.OR?.[0]).toEqual({
      searchIndex: { searchText: { contains: 'milk' }, isActive: true },
    });
  });
});
