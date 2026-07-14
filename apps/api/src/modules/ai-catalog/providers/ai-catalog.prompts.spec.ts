import { buildImagePrompt } from './ai-catalog.prompts';
import { IMAGE_OUTPUT } from '../ai-catalog.constants';
import type { ImageGenerationRequest } from './ai-provider.interface';

const req = (overrides: Partial<ImageGenerationRequest> = {}): ImageGenerationRequest => ({
  outputType: IMAGE_OUTPUT.MAIN,
  sourceImage: Buffer.from(''),
  transparent: false,
  context: { brand: 'Acme', productName: 'Whey Gold', category: 'Whey Protein', color: 'blue', material: null, packageType: 'tub' },
  ...overrides,
});

describe('buildImagePrompt', () => {
  it('always instructs the model to preserve brand, label and shape', () => {
    const { prompt } = buildImagePrompt(req());
    expect(prompt).toContain('Acme Whey Gold');
    expect(prompt.toLowerCase()).toContain('unchanged');
    expect(prompt.toLowerCase()).toContain('do not redraw');
  });

  it('requests transparent output only for the transparent PNG type', () => {
    const transparent = buildImagePrompt(req({ outputType: IMAGE_OUTPUT.TRANSPARENT_PNG, transparent: true }));
    expect(transparent.prompt.toLowerCase()).toContain('transparent');
  });

  it('carries a negative prompt forbidding watermarks and product distortion', () => {
    const { negativePrompt } = buildImagePrompt(req());
    expect(negativePrompt.toLowerCase()).toContain('no watermark');
    expect(negativePrompt.toLowerCase()).toContain('distort');
  });

  it('caps prompt length', () => {
    const { prompt } = buildImagePrompt(req({ context: { productName: 'x'.repeat(9000) } }));
    expect(prompt.length).toBeLessThanOrEqual(3900);
  });

  it('produces distinct prompts per output type', () => {
    const main = buildImagePrompt(req({ outputType: IMAGE_OUTPUT.MAIN })).prompt;
    const hero = buildImagePrompt(req({ outputType: IMAGE_OUTPUT.HERO })).prompt;
    expect(main).not.toBe(hero);
  });
});
