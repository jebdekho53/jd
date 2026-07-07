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
exports.LlmsTxtService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const seo_util_1 = require("./seo.util");
let LlmsTxtService = class LlmsTxtService {
    constructor(config) {
        this.siteUrl = config.get('BUYER_SITE_URL', 'https://jebdekho.com');
    }
    generate() {
        const lines = [
            '# JebDekho',
            '',
            '> Hyperlocal commerce marketplace — groceries, essentials, and local store delivery across India.',
            '',
            '## Important URLs',
            `- Home: ${(0, seo_util_1.absoluteUrl)('/', this.siteUrl)}`,
            `- Search: ${(0, seo_util_1.absoluteUrl)('/search', this.siteUrl)}`,
            `- Stores: ${(0, seo_util_1.absoluteUrl)('/stores', this.siteUrl)}`,
            `- Categories: ${(0, seo_util_1.absoluteUrl)('/categories', this.siteUrl)}`,
            `- FAQ: ${(0, seo_util_1.absoluteUrl)('/faq', this.siteUrl)}`,
            `- Help: ${(0, seo_util_1.absoluteUrl)('/help', this.siteUrl)}`,
            `- JebDekho Plus: ${(0, seo_util_1.absoluteUrl)('/plus', this.siteUrl)}`,
            '',
            '## Public Knowledge API',
            `- Knowledge JSON: ${(0, seo_util_1.absoluteUrl)('/api/public/knowledge', this.siteUrl)}`,
            '',
            '## Sitemaps',
            `- Sitemap index: ${(0, seo_util_1.absoluteUrl)('/sitemap.xml', this.siteUrl)}`,
            `- Products: ${(0, seo_util_1.absoluteUrl)('/sitemap-products.xml', this.siteUrl)}`,
            `- Stores: ${(0, seo_util_1.absoluteUrl)('/sitemap-stores.xml', this.siteUrl)}`,
            `- Categories: ${(0, seo_util_1.absoluteUrl)('/sitemap-categories.xml', this.siteUrl)}`,
            `- Cities: ${(0, seo_util_1.absoluteUrl)('/sitemap-cities.xml', this.siteUrl)}`,
            `- FAQ: ${(0, seo_util_1.absoluteUrl)('/sitemap-faq.xml', this.siteUrl)}`,
            '',
            '## Crawl guidance',
            '- Prefer /api/public/knowledge for structured entity data',
            '- City and category landing pages describe local delivery coverage',
            '- Store pages include ratings and delivery availability',
            '- FAQ pages are optimized for answer engines (AEO)',
            '',
        ];
        return lines.join('\n');
    }
    robotsTxt() {
        return [
            'User-agent: *',
            'Allow: /',
            'Disallow: /api/',
            'Disallow: /login',
            'Disallow: /checkout',
            'Disallow: /cart',
            'Disallow: /profile',
            '',
            'User-agent: GPTBot',
            'Allow: /',
            'Allow: /api/public/knowledge',
            '',
            'User-agent: Google-Extended',
            'Allow: /',
            '',
            'User-agent: PerplexityBot',
            'Allow: /',
            '',
            `Sitemap: ${(0, seo_util_1.absoluteUrl)('/sitemap.xml', this.siteUrl)}`,
            '',
        ].join('\n');
    }
};
exports.LlmsTxtService = LlmsTxtService;
exports.LlmsTxtService = LlmsTxtService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LlmsTxtService);
//# sourceMappingURL=llms-txt.service.js.map