"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTrustedUploadUrl = assertTrustedUploadUrl;
const common_1 = require("@nestjs/common");
const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file):/i;
function assertTrustedUploadUrl(url, uploadPublicBase) {
    const trimmed = url?.trim();
    if (!trimmed) {
        throw new common_1.BadRequestException('File URL is required');
    }
    if (BLOCKED_SCHEMES.test(trimmed)) {
        throw new common_1.BadRequestException('Invalid file URL scheme');
    }
    if (!trimmed.startsWith('https://')) {
        throw new common_1.BadRequestException('File URLs must use HTTPS');
    }
    const base = uploadPublicBase.replace(/\/$/, '');
    if (!base.startsWith('https://')) {
        throw new common_1.BadRequestException('Upload public URL is not configured for HTTPS');
    }
    if (!trimmed.startsWith(`${base}/`)) {
        throw new common_1.BadRequestException('Files must be uploaded via JebDekho');
    }
}
//# sourceMappingURL=trusted-upload-url.util.js.map