import { productJsonLd, buildProductPdpFaqs, faqPageJsonLd } from './metadata';

describe('productJsonLd', () => {
  it('includes aggregateRating and review images when reviews exist', () => {
    const json = productJsonLd({
      name: 'Amul Milk',
      description: 'Fresh milk',
      imageUrls: ['https://cdn.example.com/milk.jpg'],
      price: 49,
      brand: 'Amul',
      seller: { name: 'Neighbourhood Store', url: 'https://jebdekho.com/stores/test' },
      inStock: true,
      aggregateRating: { ratingValue: 4.6, reviewCount: 12 },
      reviews: [
        {
          rating: 5,
          comment: 'Fresh',
          images: ['https://cdn.example.com/review.jpg'],
          author: 'Rahul',
        },
      ],
    });

    expect(json.aggregateRating).toBeDefined();
    expect(json.review).toHaveLength(1);
    expect(json.image).toContain('https://cdn.example.com/review.jpg');
  });

  it('omits aggregateRating when no reviews', () => {
    const json = productJsonLd({
      name: 'Bread',
      imageUrls: [],
      price: 30,
      inStock: false,
    });
    expect(json.aggregateRating).toBeUndefined();
    expect(json.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('builds PDP FAQ entries', () => {
    const faqs = buildProductPdpFaqs({
      name: 'Milk',
      unit: '1L',
      store: { name: 'Local Store' },
      metadata: { shelfLife: '2 days' },
      reviewSummary: { ratingAvg: 4.5, ratingCount: 3 },
    });
    expect(faqs.length).toBeGreaterThan(2);
    const json = faqPageJsonLd(faqs);
    expect(json.mainEntity).toHaveLength(faqs.length);
  });
});
