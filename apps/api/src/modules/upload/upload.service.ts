import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { getConfig } from '../../config/configuration';
import { buildUploadUrl } from '../../common/utils/asset-url.util';
import { UploadImagePurpose } from './dto/upload-image.dto';

interface PurposeSpec {
  minWidth: number;
  minHeight: number;
  aspectRatio: number;
  aspectTolerance: number;
}

const PURPOSE_SPECS: Record<UploadImagePurpose, PurposeSpec> = {
  [UploadImagePurpose.PRODUCT]: {
    minWidth: 512,
    minHeight: 512,
    aspectRatio: 1,
    aspectTolerance: 0.02,
  },
  [UploadImagePurpose.STORE_LOGO]: {
    minWidth: 256,
    minHeight: 256,
    aspectRatio: 1,
    aspectTolerance: 0.02,
  },
  [UploadImagePurpose.STORE_BANNER]: {
    minWidth: 1200,
    minHeight: 400,
    aspectRatio: 3,
    aspectTolerance: 0.03,
  },
  [UploadImagePurpose.CATEGORY]: {
    minWidth: 512,
    minHeight: 512,
    aspectRatio: 1,
    aspectTolerance: 0.02,
  },
  [UploadImagePurpose.REVIEW]: {
    minWidth: 256,
    minHeight: 256,
    aspectRatio: 1,
    aspectTolerance: 0.05,
  },
  [UploadImagePurpose.AI_PRODUCT]: {
    minWidth: 128,
    minHeight: 128,
    aspectRatio: 1,
    aspectTolerance: 10,
  },
};

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  async uploadImage(dataUrl: string, purpose: UploadImagePurpose): Promise<{ url: string }> {
    const { buffer, mime } = this.parseDataUrl(dataUrl);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    const dimensions = getImageDimensions(buffer);
    if (!dimensions) {
      throw new BadRequestException('Could not read image dimensions');
    }

    this.validateDimensions(dimensions, PURPOSE_SPECS[purpose]);

    const cfg = getConfig(this.configService);
    const uploadDir = cfg.storage.uploadDir;
    const folder = purpose;
    const ext = mime === 'image/png' ? 'png' : 'jpg';
    const finalName = `${randomUUID()}.${ext}`;
    const dir = join(uploadDir, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, finalName), buffer);

    const url = buildUploadUrl(cfg.storage, folder, finalName);
    return { url };
  }

  /**
   * KYC documents. Unlike `uploadImage` this accepts PDFs and skips dimension
   * checks — a signed agreement or a PAN card is usually a PDF or a phone photo,
   * not a cropped image of a fixed size.
   */
  async uploadDocument(
    dataUrl: string,
    folder: string,
  ): Promise<{ url: string; mimeType: string; fileName: string }> {
    const match = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,(.+)$/i.exec(
      dataUrl.trim(),
    );
    if (!match) {
      throw new BadRequestException('Only PDF, JPEG, PNG, or WebP documents are allowed');
    }

    const mime = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length < 100) throw new BadRequestException('Document is too small');
    if (buffer.length > 8_000_000) throw new BadRequestException('Document exceeds 8 MB');

    const ext =
      mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const finalName = `${randomUUID()}.${ext}`;

    const cfg = getConfig(this.configService);
    const dir = join(cfg.storage.uploadDir, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, finalName), buffer);

    return {
      url: buildUploadUrl(cfg.storage, folder, finalName),
      mimeType: mime,
      fileName: finalName,
    };
  }

  private parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } {
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl.trim());
    if (!match) {
      throw new BadRequestException('Invalid image data URL');
    }
    const mime = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length < 100) {
      throw new BadRequestException('Image file is too small');
    }
    if (buffer.length > 4_500_000) {
      throw new BadRequestException('Image file exceeds maximum size');
    }
    return { buffer, mime };
  }

  private validateDimensions(
    { width, height }: { width: number; height: number },
    spec: PurposeSpec,
  ): void {
    if (width < spec.minWidth || height < spec.minHeight) {
      throw new BadRequestException(
        `Image must be at least ${spec.minWidth}×${spec.minHeight}px (got ${width}×${height})`,
      );
    }
    const ratio = width / height;
    const delta = Math.abs(ratio - spec.aspectRatio) / spec.aspectRatio;
    if (delta > spec.aspectTolerance) {
      throw new BadRequestException(
        `Image aspect ratio must be ${spec.aspectRatio}:1 (got ${width}×${height})`,
      );
    }
  }
}

function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return getJpegDimensions(buffer);
  }

  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF') {
    return {
      width: buffer.readUInt32LE(24) + 1,
      height: buffer.readUInt32LE(28) + 1,
    };
  }

  return null;
}

function getJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}
