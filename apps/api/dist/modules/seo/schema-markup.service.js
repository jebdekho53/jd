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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaMarkupService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const seo_util_1 = require("./seo.util");
let SchemaMarkupService = class SchemaMarkupService {
    constructor(config) {
        this.siteUrl = config.get('BUYER_SITE_URL', 'https://jebdekho.com');
    }
    organization() {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: seo_util_1.SITE_NAME,
            url: this.siteUrl,
            logo: (0, seo_util_1.absoluteUrl)('/logo.png', this.siteUrl),
            sameAs: [],
        };
    }
    webSite() {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: seo_util_1.SITE_NAME,
            url: this.siteUrl,
            potentialAction: {
                '@type': 'SearchAction',
                target: `${this.siteUrl}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
            },
        };
    }
    localBusiness(store) {
        return {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: store.name,
            image: store.logoUrl,
            url: (0, seo_util_1.absoluteUrl)(`/store/${store.slug}`, this.siteUrl),
            address: store.address ?? store.city,
            aggregateRating: store.ratingAvg && store.ratingCount
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: store.ratingAvg,
                    reviewCount: store.ratingCount,
                }
                : undefined,
        };
    }
    product(product) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description ?? product.name,
            image: product.imageUrls,
            offers: {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: product.currency ?? 'INR',
                availability: 'https://schema.org/InStock',
            },
            aggregateRating: product.ratingAvg && product.ratingCount
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: product.ratingAvg,
                    reviewCount: product.ratingCount,
                }
                : undefined,
        };
    }
    faqPage(faqs) {
        return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
        };
    }
    breadcrumbList(items) {
        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items.map((item, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: item.name,
                item: (0, seo_util_1.absoluteUrl)(item.path, this.siteUrl),
            })),
        };
    }
    forPage(page) {
        const schemas = [this.organization(), this.webSite()];
        if (page.faqs?.length)
            schemas.push(this.faqPage(page.faqs));
        return schemas;
    }
};
exports.SchemaMarkupService = SchemaMarkupService;
exports.SchemaMarkupService = SchemaMarkupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], SchemaMarkupService);
//# sourceMappingURL=schema-markup.service.js.map