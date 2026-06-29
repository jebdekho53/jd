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
var MenuOcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuOcrService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const openai_vision_client_1 = require("../product/openai-vision.client");
const store_category_access_service_1 = require("../category-governance/store-category-access.service");
const menu_service_1 = require("./menu.service");
const vertical_constants_1 = require("./vertical.constants");
const trusted_upload_url_util_1 = require("../../common/utils/trusted-upload-url.util");
const configuration_1 = require("../../config/configuration");
const MENU_OCR_PROMPT = `You are a restaurant menu OCR assistant for an Indian food delivery platform.

Extract menu structure from the uploaded printed menu image. Return strict JSON only.

Schema:
{
  "categories": [
    {
      "name": "",
      "items": [
        {
          "name": "",
          "description": "",
          "price": null,
          "dietType": "VEG",
          "prepTimeMins": null,
          "servingSize": null
        }
      ]
    }
  ],
  "confidence": 0
}

Rules:
- dietType: VEG, NON_VEG, or EGG — only if clearly indicated (green dot, egg icon, etc.)
- Do NOT invent ingredients or descriptions not visible on menu
- price: only if clearly printed; null if unreadable
- prepTimeMins: only if printed on menu
- Return JSON only`;
let MenuOcrService = MenuOcrService_1 = class MenuOcrService {
    constructor(prisma, vision, menu, categoryAccess, config) {
        this.prisma = prisma;
        this.vision = vision;
        this.menu = menu;
        this.categoryAccess = categoryAccess;
        this.config = config;
        this.logger = new common_1.Logger(MenuOcrService_1.name);
    }
    async uploadMenuForOcr(merchantProfileId, storeId, imageUrl) {
        await this.menu.assertStoreOwnership(merchantProfileId, storeId);
        const uploadBase = (0, configuration_1.getConfig)(this.config).storage.uploadPublicUrl;
        (0, trusted_upload_url_util_1.assertTrustedUploadUrl)(imageUrl, uploadBase);
        const job = await this.prisma.menuOcrJob.create({
            data: { storeId, imageUrl, status: client_1.MenuOcrStatus.UPLOADED },
        });
        void this.processJob(job.id).catch((err) => {
            this.logger.error(`Menu OCR failed for ${job.id}: ${err}`);
        });
        return job;
    }
    async processJob(jobId) {
        const job = await this.prisma.menuOcrJob.findUnique({ where: { id: jobId } });
        if (!job)
            return;
        await this.prisma.menuOcrJob.update({
            where: { id: jobId },
            data: { status: client_1.MenuOcrStatus.PROCESSING },
        });
        try {
            if (!this.config.get('OPENAI_API_KEY')) {
                throw new common_1.ServiceUnavailableException('AI not configured');
            }
            const extracted = await this.vision.analyzeWithCustomPrompt(job.imageUrl, MENU_OCR_PROMPT);
            await this.prisma.menuOcrJob.update({
                where: { id: jobId },
                data: {
                    status: client_1.MenuOcrStatus.DRAFT_READY,
                    extractedJson: extracted,
                    draftMenuJson: extracted,
                },
            });
        }
        catch (err) {
            await this.prisma.menuOcrJob.update({
                where: { id: jobId },
                data: {
                    status: client_1.MenuOcrStatus.FAILED,
                    errorMessage: err instanceof Error ? err.message : 'OCR failed',
                },
            });
        }
    }
    async publishDraftMenu(merchantProfileId, storeId, jobId) {
        await this.menu.assertStoreOwnership(merchantProfileId, storeId);
        const job = await this.prisma.menuOcrJob.findFirst({
            where: { id: jobId, storeId, status: client_1.MenuOcrStatus.DRAFT_READY },
        });
        if (!job || !job.draftMenuJson) {
            throw new common_1.ServiceUnavailableException('Draft menu not ready');
        }
        const draft = job.draftMenuJson;
        const approvedTree = await this.categoryAccess.listApprovedCategoryTree(storeId, client_1.CategoryCatalogKind.MENU);
        const approvedByName = new Map(approvedTree.flatMap((p) => p.children.map((c) => [c.name.trim().toLowerCase(), c.id])));
        for (const [ci, cat] of (draft.categories ?? []).entries()) {
            const platformCategoryId = approvedByName.get(cat.name.trim().toLowerCase());
            if (!platformCategoryId) {
                throw new common_1.BadRequestException(`OCR category "${cat.name}" has no matching approved menu subcategory. Request access on Store Categories first.`);
            }
            const category = await this.menu.createCategory(merchantProfileId, storeId, {
                platformCategoryId,
                name: cat.name,
                slug: (0, vertical_constants_1.slugifyMenu)(cat.name),
                sortOrder: ci,
            });
            for (const item of cat.items ?? []) {
                if (!item.name || item.price == null)
                    continue;
                await this.menu.createMenuItem(merchantProfileId, storeId, {
                    categoryId: category.id,
                    name: item.name,
                    description: item.description,
                    basePrice: item.price,
                    dietType: item.dietType ?? 'VEG',
                    prepTimeMins: item.prepTimeMins,
                    servingSize: item.servingSize,
                });
            }
        }
        return this.prisma.menuOcrJob.update({
            where: { id: jobId },
            data: { status: client_1.MenuOcrStatus.PUBLISHED },
        });
    }
    async getJob(merchantProfileId, storeId, jobId) {
        await this.menu.assertStoreOwnership(merchantProfileId, storeId);
        const job = await this.prisma.menuOcrJob.findFirst({ where: { id: jobId, storeId } });
        if (!job)
            throw new common_1.ServiceUnavailableException('OCR job not found');
        return job;
    }
};
exports.MenuOcrService = MenuOcrService;
exports.MenuOcrService = MenuOcrService = MenuOcrService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        openai_vision_client_1.OpenAiVisionClient,
        menu_service_1.MenuService,
        store_category_access_service_1.StoreCategoryAccessService,
        config_1.ConfigService])
], MenuOcrService);
//# sourceMappingURL=menu-ocr.service.js.map