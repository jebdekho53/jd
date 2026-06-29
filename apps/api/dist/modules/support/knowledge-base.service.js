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
exports.KnowledgeBaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let KnowledgeBaseService = class KnowledgeBaseService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(query, category, audience) {
        const where = { isPublished: true };
        if (category)
            where.category = category;
        if (audience)
            where.audience = audience;
        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { body: { contains: query, mode: 'insensitive' } },
            ];
        }
        return this.prisma.helpArticle.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
            take: 50,
        });
    }
    async getBySlug(slug) {
        return this.prisma.helpArticle.findUnique({ where: { slug } });
    }
    async listCategories(audience) {
        const articles = await this.prisma.helpArticle.findMany({
            where: { isPublished: true, ...(audience ? { audience: audience } : {}) },
            select: { category: true },
            distinct: ['category'],
        });
        return articles.map((a) => a.category);
    }
};
exports.KnowledgeBaseService = KnowledgeBaseService;
exports.KnowledgeBaseService = KnowledgeBaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KnowledgeBaseService);
//# sourceMappingURL=knowledge-base.service.js.map