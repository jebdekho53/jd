import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AnalyzeProductImageDto } from './dto/product-ai.dto';
import { AiProductImageService } from './ai-product-image.service';
import { OpenAiVisionClient } from './openai-vision.client';

describe('AI product image upload validation', () => {
  it('allows a valid 5MB JPEG data URL at DTO validation', async () => {
    const dataUrl = `data:image/jpeg;base64,${Buffer.alloc(5 * 1024 * 1024).toString('base64')}`;
    const dto = plainToInstance(AnalyzeProductImageDto, { dataUrl });

    const errors = await validate(dto);

    expect(errors).toEqual([]);
  });

  it('rejects actual decoded images over 5MB', async () => {
    const service = new AiProductImageService({} as never);
    const dataUrl = `data:image/jpeg;base64,${Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64')}`;

    await expect(service.optimizeForAiAnalysis(dataUrl)).rejects.toThrow(BadRequestException);
  });

  it('rejects malformed image data URLs with a clean 400', async () => {
    const service = new AiProductImageService({} as never);

    await expect(service.optimizeForAiAnalysis('not-an-image')).rejects.toThrow(BadRequestException);
  });

  it('returns a clean non-500 error when AI provider is missing', () => {
    const client = new OpenAiVisionClient({
      get: (key: string, fallback?: string) => (key === 'OPENAI_API_KEY' ? '' : fallback),
    } as never);

    expect(() => client.assertConfigured()).toThrow(ServiceUnavailableException);
  });
});
