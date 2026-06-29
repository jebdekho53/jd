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
var SeoSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const sitemap_service_1 = require("./sitemap.service");
const programmatic_page_service_1 = require("./programmatic-page.service");
const knowledge_graph_service_1 = require("./knowledge-graph.service");
const faq_engine_service_1 = require("./faq-engine.service");
const seo_analytics_service_1 = require("./seo-analytics.service");
let SeoSchedulerService = SeoSchedulerService_1 = class SeoSchedulerService {
    constructor(sitemap, pages, knowledge, faq, analytics) {
        this.sitemap = sitemap;
        this.pages = pages;
        this.knowledge = knowledge;
        this.faq = faq;
        this.analytics = analytics;
        this.logger = new common_1.Logger(SeoSchedulerService_1.name);
    }
    onModuleInit() {
        void this.refreshSeoAssets();
    }
    async refreshSeoAssets() {
        this.logger.log('Starting SEO refresh (sitemaps, pages, knowledge graph)');
        try {
            await this.faq.seedDefaultFaqs();
            const pageCount = await this.pages.syncAll();
            const entityCount = await this.knowledge.syncEntities();
            await this.sitemap.generateAll();
            await this.analytics.recordDailySnapshot();
            this.logger.log(`SEO refresh complete: ${pageCount} pages, ${entityCount} entities`);
        }
        catch (err) {
            this.logger.error({ err }, 'SEO refresh failed');
        }
    }
};
exports.SeoSchedulerService = SeoSchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 */6 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeoSchedulerService.prototype, "refreshSeoAssets", null);
exports.SeoSchedulerService = SeoSchedulerService = SeoSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sitemap_service_1.SitemapService,
        programmatic_page_service_1.ProgrammaticPageService,
        knowledge_graph_service_1.KnowledgeGraphService,
        faq_engine_service_1.FaqEngineService,
        seo_analytics_service_1.SeoAnalyticsService])
], SeoSchedulerService);
//# sourceMappingURL=seo-scheduler.service.js.map