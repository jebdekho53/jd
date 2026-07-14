import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { getConfig } from '../../../config/configuration';
import { assetPublicBase, uploadPublicBases } from '../../../common/utils/asset-url.util';
import type sharp from 'sharp';
import { ImageOutputType } from '../ai-catalog.constants';

export interface OptimizedUpload {
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  aiAnalysisUrl: string;
  sourceHash: string;
  width: number;
  height: number;
}

export interface SavedAsset {
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  format: string;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_PIXELS = 40 * 1024 * 1024; // decompression-bomb ceiling (~40MP)
const MIN_DIMENSION = 200;
const OPTIMIZED_SIZE = 1200;
const THUMB_SIZE = 300;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_SHARP_FORMATS = new Set(['jpeg', 'png', 'webp']);

/**
 * All raw-image handling for v2. Hardened against malformed/hostile uploads:
 * validates the declared MIME AND the decoded format, enforces pixel/byte
 * ceilings (decompression bombs), strips EXIF/metadata, and only ever reads
 * images from our own storage dir (no SSRF). Also computes the content hash
 * used as the first component of the image cache key.
 */
@Injectable()
export class AiCatalogImageProcessingService {
  private readonly logger = new Logger(AiCatalogImageProcessingService.name);

  constructor(private readonly config: ConfigService) {}

  async validateAndOptimizeUpload(dataUrl: string): Promise<OptimizedUpload> {
    const { buffer, mime } = this.parseDataUrl(dataUrl);
    if (!ALLOWED_MIME.has(mime)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('Image exceeds the maximum size of 8MB');
    }

    const sharp = await this.loadSharp();
    // `failOn: 'error'` rejects truncated/corrupt payloads. `limitInputPixels`
    // caps the decoded surface to stop decompression bombs.
    const base = sharp(buffer, { failOn: 'error', limitInputPixels: MAX_PIXELS }).rotate();

    const meta = await base.metadata();
    if (!meta.format || !ALLOWED_SHARP_FORMATS.has(meta.format)) {
      throw new BadRequestException('Uploaded file is not a valid JPEG/PNG/WebP image');
    }
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      throw new BadRequestException(`Image must be at least ${MIN_DIMENSION}x${MIN_DIMENSION}px`);
    }
    if (width * height > MAX_PIXELS) {
      throw new BadRequestException('Image resolution is too large to process');
    }

    const sourceHash = this.sha256(buffer);
    const { dir, folder, publicBase } = await this.ensureDir('ai-catalog-source');
    const id = randomUUID();
    const ext = meta.format === 'png' ? 'png' : meta.format === 'webp' ? 'webp' : 'jpg';

    // Re-encode (never trust raw bytes) with metadata stripped. sharp drops all
    // EXIF/ICC/XMP by default unless withMetadata() is called — which we don't.
    const originalName = `${id}-source.${ext}`;
    await writeFile(join(dir, originalName), await base.clone().toBuffer());

    const optimizedName = `${id}-optimized.webp`;
    const analysisName = `${id}-analysis.webp`;
    const thumbName = `${id}-thumb.webp`;

    await base
      .clone()
      .resize(OPTIMIZED_SIZE, OPTIMIZED_SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .webp({ quality: 82 })
      .toFile(join(dir, optimizedName));
    await base
      .clone()
      .resize(OPTIMIZED_SIZE, OPTIMIZED_SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .webp({ quality: 80 })
      .toFile(join(dir, analysisName));
    await base
      .clone()
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
      .webp({ quality: 75 })
      .toFile(join(dir, thumbName));

    return {
      originalUrl: `${publicBase}/${folder}/${originalName}`,
      optimizedUrl: `${publicBase}/${folder}/${optimizedName}`,
      aiAnalysisUrl: `${publicBase}/${folder}/${analysisName}`,
      thumbnailUrl: `${publicBase}/${folder}/${thumbName}`,
      sourceHash,
      width,
      height,
    };
  }

  /** Persist a provider-generated image. Transparent outputs keep PNG + alpha. */
  async saveGeneratedAsset(
    input: Buffer,
    outputType: ImageOutputType,
    transparent: boolean,
  ): Promise<SavedAsset> {
    const sharp = await this.loadSharp();
    const base = sharp(input, { failOn: 'none', limitInputPixels: MAX_PIXELS }).rotate();
    const { dir, folder, publicBase } = await this.ensureDir('ai-catalog-generated');
    const id = randomUUID();

    const format = transparent ? 'png' : 'webp';
    const mainName = `${id}-${outputType}.${format}`;
    const thumbName = `${id}-${outputType}-thumb.webp`;

    let pipeline = base.clone();
    if (transparent) {
      pipeline = pipeline.resize(OPTIMIZED_SIZE, OPTIMIZED_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png();
    } else {
      pipeline = pipeline
        .resize(OPTIMIZED_SIZE, OPTIMIZED_SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .webp({ quality: 88 });
    }
    const mainBuffer = await pipeline.toBuffer();
    await writeFile(join(dir, mainName), mainBuffer);

    await base
      .clone()
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .webp({ quality: 78 })
      .toFile(join(dir, thumbName));

    const outMeta = await sharp(mainBuffer).metadata();
    return {
      imageUrl: `${publicBase}/${folder}/${mainName}`,
      thumbnailUrl: `${publicBase}/${folder}/${thumbName}`,
      width: outMeta.width ?? OPTIMIZED_SIZE,
      height: outMeta.height ?? OPTIMIZED_SIZE,
      fileSizeBytes: mainBuffer.length,
      format,
    };
  }

  /** SSRF-safe read — only files under our configured storage dir are allowed. */
  async loadStored(publicUrl: string): Promise<Buffer> {
    const cfg = getConfig(this.config);
    const base = uploadPublicBases(cfg.storage).find((b) => publicUrl.startsWith(`${b}/`));
    if (!base) {
      throw new BadRequestException('Refusing to load an image from outside managed storage');
    }
    const rel = publicUrl.slice(base.length).replace(/^\//, '');
    if (rel.includes('..')) throw new BadRequestException('Invalid image path');
    // Normalize to PNG so downstream providers always receive a known format.
    const sharp = await this.loadSharp();
    const bytes = await readFile(join(cfg.storage.uploadDir, rel));
    return sharp(bytes, { failOn: 'none', limitInputPixels: MAX_PIXELS }).rotate().png().toBuffer();
  }

  sha256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private async ensureDir(folder: string): Promise<{ dir: string; folder: string; publicBase: string }> {
    const cfg = getConfig(this.config);
    const dir = join(cfg.storage.uploadDir, folder);
    await mkdir(dir, { recursive: true });
    // publicBase routes generation through CDN_PUBLIC_URL when configured, else
    // the canonical upload origin (identical to legacy behaviour when unset).
    return { dir, folder, publicBase: assetPublicBase(cfg.storage) };
  }

  private parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } {
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl.trim());
    if (!match) throw new BadRequestException('Invalid image data URL');
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length < 100) throw new BadRequestException('Image file is too small');
    return { buffer, mime: match[1].toLowerCase() };
  }

  private async loadSharp(): Promise<typeof sharp> {
    try {
      const mod: unknown = await import('sharp');
      return ((mod as { default?: typeof sharp }).default ?? mod) as typeof sharp;
    } catch {
      throw new BadRequestException('Image processing is unavailable. Please try a smaller JPG/PNG/WebP.');
    }
  }
}
