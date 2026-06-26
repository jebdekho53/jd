import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { UploadService } from './upload.service';
import { UploadImagePurpose } from './dto/upload-image.dto';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

function makeJpegDataUrl(width: number, height: number): string {
  const buf = Buffer.alloc(200);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xc0;
  buf[4] = 0x00;
  buf[5] = 0x11;
  buf[6] = 0x08;
  buf.writeUInt16BE(height, 7);
  buf.writeUInt16BE(width, 9);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: unknown) => {
              if (key === 'UPLOAD_DIR') return '/tmp/uploads';
              if (key === 'UPLOAD_PUBLIC_URL') return 'http://localhost/uploads';
              return defaultValue;
            },
          },
        },
      ],
    }).compile();

    service = module.get(UploadService);
    jest.clearAllMocks();
  });

  it('accepts square product image at minimum dimensions', async () => {
    const dataUrl = makeJpegDataUrl(512, 512);
    const result = await service.uploadImage(dataUrl, UploadImagePurpose.PRODUCT);
    expect(result.url).toMatch(/^http:\/\/localhost\/uploads\/product\//);
    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
  });

  it('rejects banner aspect ratio for product purpose', async () => {
    const dataUrl = makeJpegDataUrl(1200, 400);
    await expect(
      service.uploadImage(dataUrl, UploadImagePurpose.PRODUCT),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts 3:1 banner for store-banner purpose', async () => {
    const dataUrl = makeJpegDataUrl(1200, 400);
    const result = await service.uploadImage(dataUrl, UploadImagePurpose.STORE_BANNER);
    expect(result.url).toMatch(/^http:\/\/localhost\/uploads\/store-banner\//);
  });

  it('rejects square image for store-banner purpose', async () => {
    const dataUrl = makeJpegDataUrl(512, 512);
    await expect(
      service.uploadImage(dataUrl, UploadImagePurpose.STORE_BANNER),
    ).rejects.toThrow(BadRequestException);
  });
});
