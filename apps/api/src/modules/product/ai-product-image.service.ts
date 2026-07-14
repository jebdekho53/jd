import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { getConfig } from '../../config/configuration';
import { buildUploadUrl, uploadPublicBases } from '../../common/utils/asset-url.util';
import type sharp from 'sharp';

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
  private readonly logger = new Logger(AiProductImageService.name);

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
      originalUrl: buildUploadUrl(cfg.storage, folder, originalName),
      optimizedUrl: buildUploadUrl(cfg.storage, folder, optimizedName),
      thumbnailUrl: buildUploadUrl(cfg.storage, folder, thumbnailName),
      aiAnalysisUrl: buildUploadUrl(cfg.storage, folder, analysisName),
    };
  }

  /**
   * Persist an AI-generated product image (raw PNG/JPEG bytes) to storage,
   * producing an optimized square webp + thumbnail. Returns public URLs.
   */
  async saveGeneratedImage(
    input: Buffer,
  ): Promise<{ originalUrl: string; optimizedUrl: string; thumbnailUrl: string }> {
    const sharp = await this.loadSharp();
    const base = sharp(input, { failOn: 'none' }).rotate();

    const cfg = getConfig(this.configService);
    const uploadDir = cfg.storage.uploadDir;
    const folder = 'ai-product-generated';
    const id = randomUUID();
    const dir = join(uploadDir, folder);
    await mkdir(dir, { recursive: true });

    const optimizedName = `${id}-generated.webp`;
    const thumbnailName = `${id}-generated-thumb.webp`;

    await base
      .clone()
      .resize(OPTIMIZED_SIZE, OPTIMIZED_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 85 })
      .toFile(join(dir, optimizedName));

    await base
      .clone()
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
      .webp({ quality: 78 })
      .toFile(join(dir, thumbnailName));

    return {
      originalUrl: buildUploadUrl(cfg.storage, folder, optimizedName),
      optimizedUrl: buildUploadUrl(cfg.storage, folder, optimizedName),
      thumbnailUrl: buildUploadUrl(cfg.storage, folder, thumbnailName),
    };
  }

  /**
   * Load the bytes of a previously-stored upload from its public URL. Reads the
   * local file directly when it lives under the configured storage dir, else
   * fetches over HTTP.
   */
  async loadStoredImage(publicUrl: string): Promise<Buffer> {
    const cfg = getConfig(this.configService);
    for (const base of uploadPublicBases(cfg.storage)) {
      if (publicUrl.startsWith(`${base}/`)) {
        const rel = publicUrl.slice(base.length).replace(/^\//, '');
        return readFile(join(cfg.storage.uploadDir, rel));
      }
    }
    const res = await fetch(publicUrl);
    if (!res.ok) throw new BadRequestException('Could not load the source product image');
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Remove the background from a stored product photo (preserving the real
   * product and its printed label) and composite it onto a clean white studio
   * background. Returns public URLs for the saved result.
   */
  async cleanBackgroundFromStored(
    publicUrl: string,
  ): Promise<{ originalUrl: string; optimizedUrl: string; thumbnailUrl: string }> {
    const source = await this.loadStoredImage(publicUrl);
    const whiteBg = await this.removeBackgroundToWhite(source);
    return this.saveGeneratedImage(whiteBg);
  }

  private async removeBackgroundToWhite(input: Buffer): Promise<Buffer> {
    const sharp = await this.loadSharp();
    // Normalize to PNG first so the segmentation model always gets a known format.
    const png = await sharp(input, { failOn: 'none' }).rotate().png().toBuffer();

    // Run the rembg (u2net) Python helper — true segmentation preserves the
    // product's real pixels (label/text intact); only the background is removed.
    const cutout = await this.runRembg(png);

    // Flatten the transparent cutout onto a solid white background.
    return sharp(cutout).flatten({ background: { r: 255, g: 255, b: 255 } }).png().toBuffer();
  }

  private runRembg(pngInput: Buffer): Promise<Buffer> {
    const python = this.configService.get<string>(
      'REMBG_PYTHON',
      '/var/www/jebdekho/.venv-rembg/bin/python',
    );
    const script = this.configService.get<string>(
      'REMBG_SCRIPT',
      join(process.cwd(), 'scripts', 'remove-bg.py'),
    );

    return new Promise<Buffer>((resolve, reject) => {
      const proc = spawn(python, [script], { stdio: ['pipe', 'pipe', 'pipe'] });
      const out: Buffer[] = [];
      const err: Buffer[] = [];
      proc.stdout.on('data', (d: Buffer) => out.push(d));
      proc.stderr.on('data', (d: Buffer) => err.push(d));
      proc.on('error', (e) => {
        this.logger.error(`rembg spawn failed: ${e.message}`);
        reject(
          new BadRequestException('Background removal is unavailable right now. Please try again.'),
        );
      });
      proc.on('close', (code) => {
        if (code === 0 && out.length > 0) {
          resolve(Buffer.concat(out));
        } else {
          this.logger.error(`rembg exited ${code}: ${Buffer.concat(err).toString().slice(0, 500)}`);
          reject(
            new BadRequestException('Background removal failed for this image. Please try again.'),
          );
        }
      });
      proc.stdin.write(pngInput);
      proc.stdin.end();
    });
  }

  private parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } {
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl.trim());
    if (!match) throw new BadRequestException('Invalid image data URL');
    const mime = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length < 100) throw new BadRequestException('Image file is too small');
    return { buffer, mime };
  }

  private async loadSharp(): Promise<typeof sharp> {
    try {
      const mod: any = await import('sharp');
      return mod.default ?? mod;
    } catch {
      throw new BadRequestException(
        'Image optimization is unavailable. Please try a smaller JPG/PNG/WebP image.',
      );
    }
  }
}
