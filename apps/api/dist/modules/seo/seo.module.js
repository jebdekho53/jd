"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_dashboard_module_1 = require("../merchant-dashboard/merchant-dashboard.module");
const sitemap_service_1 = require("./sitemap.service");
const programmatic_page_service_1 = require("./programmatic-page.service");
const schema_markup_service_1 = require("./schema-markup.service");
const faq_engine_service_1 = require("./faq-engine.service");
const knowledge_graph_service_1 = require("./knowledge-graph.service");
const ai_crawler_analytics_service_1 = require("./ai-crawler-analytics.service");
const seo_analytics_service_1 = require("./seo-analytics.service");
const seo_scheduler_service_1 = require("./seo-scheduler.service");
const llms_txt_service_1 = require("./llms-txt.service");
const public_seo_controller_1 = require("./public-seo.controller");
const admin_seo_controller_1 = require("./admin-seo.controller");
const merchant_seo_controller_1 = require("./merchant-seo.controller");
let SeoModule = class SeoModule {
};
exports.SeoModule = SeoModule;
exports.SeoModule = SeoModule = __decorate([
    (0, common_1.Module)({
        imports: [merchant_dashboard_module_1.MerchantDashboardModule],
        controllers: [public_seo_controller_1.PublicSeoController, public_seo_controller_1.PublicKnowledgeController, admin_seo_controller_1.AdminSeoController, merchant_seo_controller_1.MerchantSeoController],
        providers: [
            sitemap_service_1.SitemapService,
            programmatic_page_service_1.ProgrammaticPageService,
            schema_markup_service_1.SchemaMarkupService,
            faq_engine_service_1.FaqEngineService,
            knowledge_graph_service_1.KnowledgeGraphService,
            ai_crawler_analytics_service_1.AiCrawlerAnalyticsService,
            seo_analytics_service_1.SeoAnalyticsService,
            seo_scheduler_service_1.SeoSchedulerService,
            llms_txt_service_1.LlmsTxtService,
        ],
        exports: [
            sitemap_service_1.SitemapService,
            programmatic_page_service_1.ProgrammaticPageService,
            schema_markup_service_1.SchemaMarkupService,
            knowledge_graph_service_1.KnowledgeGraphService,
            seo_analytics_service_1.SeoAnalyticsService,
            ai_crawler_analytics_service_1.AiCrawlerAnalyticsService,
        ],
    })
], SeoModule);
//# sourceMappingURL=seo.module.js.map