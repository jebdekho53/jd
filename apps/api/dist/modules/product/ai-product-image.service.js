"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiProductImageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiProductImageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const configuration_1 = require("../../config/configuration");
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const OPTIMIZED_SIZE = 1200;
const THUMB_SIZE = 300;
let AiProductImageService = AiProductImageService_1 = class AiProductImageService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AiProductImageService_1.name);
    }
    async optimizeForAiAnalysis(dataUrl) {
        const { buffer, mime } = this.parseDataUrl(dataUrl);
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
            throw new common_1.BadRequestException('Only JPEG, PNG, and WebP images are allowed');
        }
        if (buffer.length > MAX_UPLOAD_BYTES) {
            throw new common_1.BadRequestException('Image file exceeds maximum size of 5MB');
        }
        const sharp = await this.loadSharp();
        const base = sharp(buffer, { failOn: 'none' }).rotate();
        const cfg = (0, configuration_1.getConfig)(this.configService);
        const uploadDir = cfg.storage.uploadDir;
        const publicBase = cfg.storage.uploadPublicUrl.replace(/\/$/, '');
        const folder = 'ai-product';
        const id = (0, crypto_1.randomUUID)();
        const dir = (0, path_1.join)(uploadDir, folder);
        await (0, promises_1.mkdir)(dir, { recursive: true });
        const originalExt = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
        const originalName = `${id}-original.${originalExt}`;
        await (0, promises_1.writeFile)((0, path_1.join)(dir, originalName), await base.clone().toBuffer());
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
            .toFile((0, path_1.join)(dir, optimizedName));
        await base
            .clone()
            .resize(THUMB_SIZE, THUMB_SIZE, {
            fit: 'cover',
            position: 'centre',
        })
            .webp({ quality: 75 })
            .toFile((0, path_1.join)(dir, thumbnailName));
        await base
            .clone()
            .resize(OPTIMIZED_SIZE, OPTIMIZED_SIZE, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
            .webp({ quality: 80 })
            .toFile((0, path_1.join)(dir, analysisName));
        return {
            originalUrl: `${publicBase}/${folder}/${originalName}`,
            optimizedUrl: `${publicBase}/${folder}/${optimizedName}`,
            thumbnailUrl: `${publicBase}/${folder}/${thumbnailName}`,
            aiAnalysisUrl: `${publicBase}/${folder}/${analysisName}`,
        };
    }
    async saveGeneratedImage(input) {
        const sharp = await this.loadSharp();
        const base = sharp(input, { failOn: 'none' }).rotate();
        const cfg = (0, configuration_1.getConfig)(this.configService);
        const uploadDir = cfg.storage.uploadDir;
        const publicBase = cfg.storage.uploadPublicUrl.replace(/\/$/, '');
        const folder = 'ai-product-generated';
        const id = (0, crypto_1.randomUUID)();
        const dir = (0, path_1.join)(uploadDir, folder);
        await (0, promises_1.mkdir)(dir, { recursive: true });
        const optimizedName = `${id}-generated.webp`;
        const thumbnailName = `${id}-generated-thumb.webp`;
        await base
            .clone()
            .resize(OPTIMIZED_SIZE, OPTIMIZED_SIZE, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
            .webp({ quality: 85 })
            .toFile((0, path_1.join)(dir, optimizedName));
        await base
            .clone()
            .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
            .webp({ quality: 78 })
            .toFile((0, path_1.join)(dir, thumbnailName));
        return {
            originalUrl: `${publicBase}/${folder}/${optimizedName}`,
            optimizedUrl: `${publicBase}/${folder}/${optimizedName}`,
            thumbnailUrl: `${publicBase}/${folder}/${thumbnailName}`,
        };
    }
    async loadStoredImage(publicUrl) {
        const cfg = (0, configuration_1.getConfig)(this.configService);
        const publicBase = cfg.storage.uploadPublicUrl.replace(/\/$/, '');
        if (publicUrl.startsWith(publicBase)) {
            const rel = publicUrl.slice(publicBase.length).replace(/^\//, '');
            return (0, promises_1.readFile)((0, path_1.join)(cfg.storage.uploadDir, rel));
        }
        const res = await fetch(publicUrl);
        if (!res.ok)
            throw new common_1.BadRequestException('Could not load the source product image');
        return Buffer.from(await res.arrayBuffer());
    }
    async cleanBackgroundFromStored(publicUrl) {
        const source = await this.loadStoredImage(publicUrl);
        const whiteBg = await this.removeBackgroundToWhite(source);
        return this.saveGeneratedImage(whiteBg);
    }
    async removeBackgroundToWhite(input) {
        const sharp = await this.loadSharp();
        const png = await sharp(input, { failOn: 'none' }).rotate().png().toBuffer();
        const cutout = await this.runRembg(png);
        return sharp(cutout).flatten({ background: { r: 255, g: 255, b: 255 } }).png().toBuffer();
    }
    runRembg(pngInput) {
        const python = this.configService.get('REMBG_PYTHON', '/var/www/jebdekho/.venv-rembg/bin/python');
        const script = this.configService.get('REMBG_SCRIPT', (0, path_1.join)(process.cwd(), 'scripts', 'remove-bg.py'));
        return new Promise((resolve, reject) => {
            const proc = (0, child_process_1.spawn)(python, [script], { stdio: ['pipe', 'pipe', 'pipe'] });
            const out = [];
            const err = [];
            proc.stdout.on('data', (d) => out.push(d));
            proc.stderr.on('data', (d) => err.push(d));
            proc.on('error', (e) => {
                this.logger.error(`rembg spawn failed: ${e.message}`);
                reject(new common_1.BadRequestException('Background removal is unavailable right now. Please try again.'));
            });
            proc.on('close', (code) => {
                if (code === 0 && out.length > 0) {
                    resolve(Buffer.concat(out));
                }
                else {
                    this.logger.error(`rembg exited ${code}: ${Buffer.concat(err).toString().slice(0, 500)}`);
                    reject(new common_1.BadRequestException('Background removal failed for this image. Please try again.'));
                }
            });
            proc.stdin.write(pngInput);
            proc.stdin.end();
        });
    }
    parseDataUrl(dataUrl) {
        const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl.trim());
        if (!match)
            throw new common_1.BadRequestException('Invalid image data URL');
        const mime = match[1].toLowerCase();
        const buffer = Buffer.from(match[2], 'base64');
        if (buffer.length < 100)
            throw new common_1.BadRequestException('Image file is too small');
        return { buffer, mime };
    }
    async loadSharp() {
        try {
            const mod = await Promise.resolve().then(() => require('sharp'));
            return mod.default ?? mod;
        }
        catch {
            throw new common_1.BadRequestException('Image optimization is unavailable. Please try a smaller JPG/PNG/WebP image.');
        }
    }
};
exports.AiProductImageService = AiProductImageService;
exports.AiProductImageService = AiProductImageService = AiProductImageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiProductImageService);
//# sourceMappingURL=ai-product-image.service.js.map