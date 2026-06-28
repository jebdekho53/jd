import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { getConfig } from '../../config/configuration';

export interface OptimizedAiProductImages {
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  aiAnalysisUrl: string;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const OPTIMIZED_SIZE = 1200;
const THUMB_SIZE = 300;

@Injectable()
export class AiProductImageService {
  constructor(private readonly configService: ConfigService) {}

  async optimizeForAiAnalysis(dataUrl: string): Promise<OptimizedAiProductImages> {
    const { buffer, mime } = this.parseDataUrl(dataUrl);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('Image file exceeds maximum size of 5MB');
    }

    const sharp = await this.loadSharp();
    const base = sharp(buffer, { failOn: 'none' }).rotate();

    const cfg = getConfig(this.configService);
    const uploadDir = cfg.storage.uploadDir;
    const publicBase = cfg.storage.uploadPublicUrl.replace(/\/$/, '');
    const folder = 'ai-product';
    const id = randomUUID();
    const dir = join(uploadDir, folder);
    await mkdir(dir, { recursive: true });

    const originalExt = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const originalName = `${id}-original.${originalExt}`;
    await writeFile(join(dir, originalName), await base.clone().toBuffer());

    const optimizedName = `${id}-optimized.webp`;
    const thumbnailName = `${id}-thumb.webp`;
    const analysisName = `${id}-analysis.webp`;

    await base
      .clone()
      .resize(OPTIMIZED_SIZE, OPTIMIZED_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 82 })
      .toFile(join(dir, optimizedName));

    await base
      .clone()
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: 'cover',
        position: 'centre',
      })
      .webp({ quality: 75 })
      .toFile(join(dir, thumbnailName));

    await base
      .clone()
      .resize(OPTIMIZED_SIZE, OPTIMIZED_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 80 })
      .toFile(join(dir, analysisName));

    return {
      originalUrl: `${publicBase}/${folder}/${originalName}`,
      optimizedUrl: `${publicBase}/${folder}/${optimizedName}`,
      thumbnailUrl: `${publicBase}/${folder}/${thumbnailName}`,
      aiAnalysisUrl: `${publicBase}/${folder}/${analysisName}`,
    };
  }

  private parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } {
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl.trim());
    if (!match) throw new BadRequestException('Invalid image data URL');
    const mime = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length < 100) throw new BadRequestException('Image file is too small');
    return { buffer, mime };
  }

  private async loadSharp() {
    try {
      const mod = await import('sharp');
      return mod.default;
    } catch {
      throw new BadRequestException(
        'Image optimization is unavailable. Please try a smaller JPG/PNG/WebP image.',
      );
    }
  }
}
