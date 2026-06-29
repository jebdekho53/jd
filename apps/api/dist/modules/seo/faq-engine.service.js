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
exports.FaqEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const seo_util_1 = require("./seo.util");
const SEED_FAQS = [
    {
        question: 'What is the fastest grocery delivery app in Varanasi?',
        answer: 'JebDekho offers hyperlocal delivery from trusted stores in Varanasi with average delivery times under 30 minutes in supported zones.',
        category: 'delivery',
        featured: true,
    },
    {
        question: 'How does JebDekho Plus work?',
        answer: 'JebDekho Plus is a membership that unlocks free delivery, extra rewards, priority delivery, VIP support, and exclusive offers on eligible orders.',
        category: 'membership',
        featured: true,
    },
    {
        question: 'What are the delivery charges?',
        answer: 'Delivery fees depend on store, distance, and order value. JebDekho Plus members get free delivery on eligible orders.',
        category: 'delivery',
        featured: true,
    },
    {
        question: 'Which stores deliver whey protein near Lanka?',
        answer: 'Search "whey protein" on JebDekho and filter by your location near Lanka, Varanasi to see nutrition and supplement stores that deliver to you.',
        category: 'products',
        featured: true,
    },
];
let FaqEngineService = class FaqEngineService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedDefaultFaqs() {
        for (const faq of SEED_FAQS) {
            const slug = (0, seo_util_1.slugify)(faq.question).slice(0, 120);
            await this.prisma.seoFaq.upsert({
                where: { slug },
                create: { ...faq, slug, aeoScore: faq.featured ? 85 : 60 },
                update: { answer: faq.answer, featured: faq.featured, aeoScore: faq.featured ? 85 : 60 },
            });
        }
    }
    async listFeatured(limit = 20) {
        return this.prisma.seoFaq.findMany({
            where: { featured: true },
            orderBy: { aeoScore: 'desc' },
            take: limit,
        });
    }
    async generateFeaturedAnswer(question, context) {
        const faq = await this.prisma.seoFaq.findFirst({
            where: { question: { contains: question.slice(0, 40), mode: 'insensitive' } },
        });
        if (faq)
            return { answer: faq.answer, direct: true, snippet: faq.answer.slice(0, 160) };
        return {
            answer: context
                ? `JebDekho helps you discover local stores and get fast delivery. ${context}`
                : 'JebDekho is a hyperlocal marketplace connecting you with nearby stores for fast delivery.',
            direct: false,
            snippet: 'JebDekho — hyperlocal delivery from trusted local stores.',
        };
    }
    async getAeoMetrics() {
        const [total, featured, top] = await Promise.all([
            this.prisma.seoFaq.count(),
            this.prisma.seoFaq.count({ where: { featured: true } }),
            this.prisma.seoFaq.findMany({ orderBy: { impressions: 'desc' }, take: 10 }),
        ]);
        const avgScore = await this.prisma.seoFaq.aggregate({ _avg: { aeoScore: true } });
        return { total, featured, avgAeoScore: avgScore._avg.aeoScore ?? 0, topFaqs: top };
    }
};
exports.FaqEngineService = FaqEngineService;
exports.FaqEngineService = FaqEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FaqEngineService);
//# sourceMappingURL=faq-engine.service.js.map