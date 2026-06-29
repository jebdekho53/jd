"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertClaimEvidenceUrls = assertClaimEvidenceUrls;
const common_1 = require("@nestjs/common");
const order_claim_constants_1 = require("./order-claim.constants");
function assertClaimEvidenceUrls(evidence, uploadPublicBase) {
    if (evidence.length > order_claim_constants_1.MAX_CLAIM_EVIDENCE_ITEMS) {
        throw new common_1.BadRequestException(`At most ${order_claim_constants_1.MAX_CLAIM_EVIDENCE_ITEMS} evidence items are allowed`);
    }
    const base = uploadPublicBase.replace(/\/$/, '');
    if (!base.startsWith('https://')) {
        throw new common_1.BadRequestException('Upload public URL is not configured for HTTPS');
    }
    for (const item of evidence) {
        if (!item.url.startsWith('https://')) {
            throw new common_1.BadRequestException('Evidence URLs must use HTTPS');
        }
        if (!item.url.startsWith(`${base}/`)) {
            throw new common_1.BadRequestException('Evidence must be uploaded via JebDekho');
        }
    }
}
//# sourceMappingURL=claim-evidence.util.js.map