import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AiProductImageService } from './ai-product-image.service';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

const mockSharpInstance = {
  rotate: jest.fn().mockReturnThis(),
  clone: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(200)),
  toFile: jest.fn().mockResolvedValue(undefined),
};

jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => mockSharpInstance),
}));

describe('AiProductImageService', () => {
  let service: AiProductImageService;

  const tinyJpeg = `data:image/jpeg;base64,${Buffer.alloc(200).toString('base64')}`;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiProductImageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: unknown) => {
              if (key === 'UPLOAD_DIR') return '/tmp/uploads';
              if (key === 'UPLOAD_PUBLIC_URL') return 'https://cdn.test/uploads';
              if (key === 'JWT_PRIVATE_KEY') return '';
              if (key === 'JWT_PUBLIC_KEY') return '';
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AiProductImageService);
    jest.clearAllMocks();
    mockSharpInstance.rotate.mockReturnThis();
    mockSharpInstance.clone.mockReturnThis();
    mockSharpInstance.resize.mockReturnThis();
    mockSharpInstance.webp.mockReturnThis();
  });

  it('rejects unsupported image types', async () => {
    const gif = `data:image/gif;base64,${Buffer.alloc(200).toString('base64')}`;
    await expect(service.optimizeForAiAnalysis(gif)).rejects.toThrow(BadRequestException);
  });

  it('rejects images over 5MB', async () => {
    const big = `data:image/jpeg;base64,${Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64')}`;
    await expect(service.optimizeForAiAnalysis(big)).rejects.toThrow(BadRequestException);
  });

  it('creates 1:1 optimized, thumbnail, and analysis outputs', async () => {
    const result = await service.optimizeForAiAnalysis(tinyJpeg);

    expect(result.originalUrl).toContain('-original.');
    expect(result.optimizedUrl).toContain('-optimized.webp');
    expect(result.thumbnailUrl).toContain('-thumb.webp');
    expect(result.aiAnalysisUrl).toContain('-analysis.webp');
    expect(mockSharpInstance.resize).toHaveBeenCalledWith(1200, 1200, expect.objectContaining({ fit: 'contain' }));
    expect(mockSharpInstance.resize).toHaveBeenCalledWith(300, 300, expect.objectContaining({ fit: 'cover' }));
  });
});
