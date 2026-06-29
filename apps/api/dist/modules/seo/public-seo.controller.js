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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicKnowledgeController = exports.PublicSeoController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const sitemap_service_1 = require("./sitemap.service");
const knowledge_graph_service_1 = require("./knowledge-graph.service");
const llms_txt_service_1 = require("./llms-txt.service");
const programmatic_page_service_1 = require("./programmatic-page.service");
const schema_markup_service_1 = require("./schema-markup.service");
const ai_crawler_analytics_service_1 = require("./ai-crawler-analytics.service");
const faq_engine_service_1 = require("./faq-engine.service");
let PublicSeoController = class PublicSeoController {
    constructor(sitemap, llms, crawlers) {
        this.sitemap = sitemap;
        this.llms = llms;
        this.crawlers = crawlers;
    }
    async sitemapIndex(req) {
        void this.trackCrawler(req, '/sitemap.xml');
        return this.sitemap.getXml(client_1.SitemapType.INDEX);
    }
    async sitemapProducts(req) {
        void this.trackCrawler(req, '/sitemap-products.xml');
        return this.sitemap.getXml(client_1.SitemapType.PRODUCTS);
    }
    async sitemapStores(req) {
        void this.trackCrawler(req, '/sitemap-stores.xml');
        return this.sitemap.getXml(client_1.SitemapType.STORES);
    }
    async sitemapCategories(req) {
        void this.trackCrawler(req, '/sitemap-categories.xml');
        return this.sitemap.getXml(client_1.SitemapType.CATEGORIES);
    }
    async sitemapCities(req) {
        void this.trackCrawler(req, '/sitemap-cities.xml');
        return this.sitemap.getXml(client_1.SitemapType.CITIES);
    }
    async sitemapFaq(req) {
        void this.trackCrawler(req, '/sitemap-faq.xml');
        return this.sitemap.getXml(client_1.SitemapType.FAQ);
    }
    async sitemapBrands(req) {
        void this.trackCrawler(req, '/sitemap-brands.xml');
        return this.sitemap.getBrandsXml();
    }
    robots(req) {
        void this.trackCrawler(req, '/robots.txt');
        return this.llms.robotsTxt();
    }
    llmsTxt(req) {
        void this.trackCrawler(req, '/llms.txt');
        return this.llms.generate();
    }
    trackCrawler(req, path) {
        void this.crawlers.recordVisit({
            userAgent: req.headers['user-agent'],
            path,
            ipAddress: req.ip,
        });
    }
};
exports.PublicSeoController = PublicSeoController;
__decorate([
    (0, common_1.Get)('sitemap.xml'),
    (0, common_1.Header)('Content-Type', 'application/xml'),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicSeoController.prototype, "sitemapIndex", null);
__decorate([
    (0, common_1.Get)('sitemap-products.xml'),
    (0, common_1.Header)('Content-Type', 'application/xml'),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicSeoController.prototype, "sitemapProducts", null);
__decorate([
    (0, common_1.Get)('sitemap-stores.xml'),
    (0, common_1.Header)('Content-Type', 'application/xml'),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicSeoController.prototype, "sitemapStores", null);
__decorate([
    (0, common_1.Get)('sitemap-categories.xml'),
    (0, common_1.Header)('Content-Type', 'application/xml'),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicSeoController.prototype, "sitemapCategories", null);
__decorate([
    (0, common_1.Get)('sitemap-cities.xml'),
    (0, common_1.Header)('Content-Type', 'application/xml'),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicSeoController.prototype, "sitemapCities", null);
__decorate([
    (0, common_1.Get)('sitemap-faq.xml'),
    (0, common_1.Header)('Content-Type', 'application/xml'),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicSeoController.prototype, "sitemapFaq", null);
__decorate([
    (0, common_1.Get)('sitemap-brands.xml'),
    (0, common_1.Header)('Content-Type', 'application/xml'),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicSeoController.prototype, "sitemapBrands", null);
__decorate([
    (0, common_1.Get)('robots.txt'),
    (0, common_1.Header)('Content-Type', 'text/plain'),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PublicSeoController.prototype, "robots", null);
__decorate([
    (0, common_1.Get)('llms.txt'),
    (0, common_1.Header)('Content-Type', 'text/plain'),
    openapi.ApiResponse({ status: 200, type: String }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PublicSeoController.prototype, "llmsTxt", null);
exports.PublicSeoController = PublicSeoController = __decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [sitemap_service_1.SitemapService,
        llms_txt_service_1.LlmsTxtService,
        ai_crawler_analytics_service_1.AiCrawlerAnalyticsService])
], PublicSeoController);
let PublicKnowledgeController = class PublicKnowledgeController {
    constructor(knowledgeGraph, faq, schema, pages, crawlers) {
        this.knowledgeGraph = knowledgeGraph;
        this.faq = faq;
        this.schema = schema;
        this.pages = pages;
        this.crawlers = crawlers;
    }
    async knowledge(req) {
        void this.crawlers.recordVisit({
            userAgent: req.headers['user-agent'],
            path: '/api/public/knowledge',
            ipAddress: req.ip,
        });
        const data = await this.knowledgeGraph.getPublicKnowledge();
        return {
            success: true,
            data: {
                ...data,
                schema: {
                    organization: this.schema.organization(),
                    webSite: this.schema.webSite(),
                    faqPage: this.schema.faqPage(data.faqs.map((f) => ({ question: f.question, answer: f.answer }))),
                },
            },
        };
    }
    async seoPage(path, req) {
        if (!path)
            return { success: false, message: 'path required' };
        void this.crawlers.recordVisit({
            userAgent: req.headers['user-agent'],
            path,
            ipAddress: req.ip,
        });
        const page = await this.pages.getPageByPath(path);
        if (!page)
            return { success: false, message: 'Page not found' };
        const schemas = this.schema.forPage({
            pageType: page.pageType,
            title: page.title,
            faqs: page.faqs.map((f) => ({ question: f.question, answer: f.answer })),
        });
        const featuredAnswer = page.faqs[0]
            ? await this.faq.generateFeaturedAnswer(page.faqs[0].question)
            : null;
        return { success: true, data: { page, schemas, featuredAnswer } };
    }
};
exports.PublicKnowledgeController = PublicKnowledgeController;
__decorate([
    (0, common_1.Get)('knowledge'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicKnowledgeController.prototype, "knowledge", null);
__decorate([
    (0, common_1.Get)('seo/page'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)('path')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicKnowledgeController.prototype, "seoPage", null);
exports.PublicKnowledgeController = PublicKnowledgeController = __decorate([
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiTags)('public'),
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [knowledge_graph_service_1.KnowledgeGraphService,
        faq_engine_service_1.FaqEngineService,
        schema_markup_service_1.SchemaMarkupService,
        programmatic_page_service_1.ProgrammaticPageService,
        ai_crawler_analytics_service_1.AiCrawlerAnalyticsService])
], PublicKnowledgeController);
//# sourceMappingURL=public-seo.controller.js.map