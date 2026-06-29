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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const configuration_1 = require("../../config/configuration");
const upload_image_dto_1 = require("./dto/upload-image.dto");
const PURPOSE_SPECS = {
    [upload_image_dto_1.UploadImagePurpose.PRODUCT]: {
        minWidth: 512,
        minHeight: 512,
        aspectRatio: 1,
        aspectTolerance: 0.02,
    },
    [upload_image_dto_1.UploadImagePurpose.STORE_LOGO]: {
        minWidth: 256,
        minHeight: 256,
        aspectRatio: 1,
        aspectTolerance: 0.02,
    },
    [upload_image_dto_1.UploadImagePurpose.STORE_BANNER]: {
        minWidth: 1200,
        minHeight: 400,
        aspectRatio: 3,
        aspectTolerance: 0.03,
    },
    [upload_image_dto_1.UploadImagePurpose.CATEGORY]: {
        minWidth: 512,
        minHeight: 512,
        aspectRatio: 1,
        aspectTolerance: 0.02,
    },
    [upload_image_dto_1.UploadImagePurpose.REVIEW]: {
        minWidth: 256,
        minHeight: 256,
        aspectRatio: 1,
        aspectTolerance: 0.05,
    },
    [upload_image_dto_1.UploadImagePurpose.AI_PRODUCT]: {
        minWidth: 128,
        minHeight: 128,
        aspectRatio: 1,
        aspectTolerance: 10,
    },
};
let UploadService = class UploadService {
    constructor(configService) {
        this.configService = configService;
    }
    async uploadImage(dataUrl, purpose) {
        const { buffer, mime } = this.parseDataUrl(dataUrl);
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
            throw new common_1.BadRequestException('Only JPEG, PNG, and WebP images are allowed');
        }
        const dimensions = getImageDimensions(buffer);
        if (!dimensions) {
            throw new common_1.BadRequestException('Could not read image dimensions');
        }
        this.validateDimensions(dimensions, PURPOSE_SPECS[purpose]);
        const cfg = (0, configuration_1.getConfig)(this.configService);
        const uploadDir = cfg.storage.uploadDir;
        const publicBase = cfg.storage.uploadPublicUrl.replace(/\/$/, '');
        const folder = purpose;
        const ext = mime === 'image/png' ? 'png' : 'jpg';
        const finalName = `${(0, crypto_1.randomUUID)()}.${ext}`;
        const dir = (0, path_1.join)(uploadDir, folder);
        await (0, promises_1.mkdir)(dir, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(dir, finalName), buffer);
        const url = `${publicBase}/${folder}/${finalName}`;
        return { url };
    }
    parseDataUrl(dataUrl) {
        const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl.trim());
        if (!match) {
            throw new common_1.BadRequestException('Invalid image data URL');
        }
        const mime = match[1].toLowerCase();
        const buffer = Buffer.from(match[2], 'base64');
        if (buffer.length < 100) {
            throw new common_1.BadRequestException('Image file is too small');
        }
        if (buffer.length > 4_500_000) {
            throw new common_1.BadRequestException('Image file exceeds maximum size');
        }
        return { buffer, mime };
    }
    validateDimensions({ width, height }, spec) {
        if (width < spec.minWidth || height < spec.minHeight) {
            throw new common_1.BadRequestException(`Image must be at least ${spec.minWidth}×${spec.minHeight}px (got ${width}×${height})`);
        }
        const ratio = width / height;
        const delta = Math.abs(ratio - spec.aspectRatio) / spec.aspectRatio;
        if (delta > spec.aspectTolerance) {
            throw new common_1.BadRequestException(`Image aspect ratio must be ${spec.aspectRatio}:1 (got ${width}×${height})`);
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
function getImageDimensions(buffer) {
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
function getJpegDimensions(buffer) {
    let offset = 2;
    while (offset < buffer.length) {
        if (buffer[offset] !== 0xff)
            break;
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
//# sourceMappingURL=upload.service.js.map