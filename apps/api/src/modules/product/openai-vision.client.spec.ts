import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiVisionClient } from './openai-vision.client';
import { AI_PRODUCT_UNAVAILABLE_MESSAGE } from './product-ai.constants';

describe('OpenAiVisionClient', () => {
  const config = {
    get: jest.fn((key: string, def?: string) => {
      if (key === 'OPENAI_API_KEY') return '';
      return def;
    }),
  } as unknown as ConfigService;

  let client: OpenAiVisionClient;

  beforeEach(() => {
    client = new OpenAiVisionClient(config);
  });

  it('reports not configured', () => {
    expect(client.isConfigured()).toBe(false);
  });

  it('throws friendly error when API key missing', () => {
    expect(() => client.assertConfigured()).toThrow(ServiceUnavailableException);
    try {
      client.assertConfigured();
    } catch (e) {
      const err = e as ServiceUnavailableException;
      expect((err.getResponse() as { message: string }).message).toBe(AI_PRODUCT_UNAVAILABLE_MESSAGE);
    }
  });

  it('parses valid AI JSON', () => {
    const result = client.parseExtractedJson(
      JSON.stringify({
        name: 'Milk',
        brand: 'Amul',
        categoryName: 'Dairy',
        subcategoryName: 'Milk',
        unit: 'litre',
        weight: '500ml',
        mrp: 59,
        sellingPrice: null,
        description: 'Fresh milk',
        highlights: ['creamy'],
        tags: ['dairy'],
        ingredients: 'Milk',
        shelfLife: '3 days',
        manufacturerName: 'Amul',
        fssaiLicense: '',
        barcode: '',
        confidence: 0.82,
      }),
    );
    expect(result.name).toBe('Milk');
    expect(result.confidence).toBe(0.82);
  });
});
