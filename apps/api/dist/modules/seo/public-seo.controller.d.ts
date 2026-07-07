import type { Request } from 'express';
import { SitemapService } from './sitemap.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { LlmsTxtService } from './llms-txt.service';
import { ProgrammaticPageService } from './programmatic-page.service';
import { SchemaMarkupService } from './schema-markup.service';
import { AiCrawlerAnalyticsService } from './ai-crawler-analytics.service';
import { FaqEngineService } from './faq-engine.service';
export declare class PublicSeoController {
    private readonly sitemap;
    private readonly llms;
    private readonly crawlers;
    constructor(sitemap: SitemapService, llms: LlmsTxtService, crawlers: AiCrawlerAnalyticsService);
    sitemapIndex(req: Request): Promise<string>;
    sitemapProducts(req: Request): Promise<string>;
    sitemapStores(req: Request): Promise<string>;
    sitemapCategories(req: Request): Promise<string>;
    sitemapCities(req: Request): Promise<string>;
    sitemapFaq(req: Request): Promise<string>;
    sitemapBrands(req: Request): Promise<string>;
    robots(req: Request): string;
    llmsTxt(req: Request): string;
    private trackCrawler;
}
export declare class PublicKnowledgeController {
    private readonly knowledgeGraph;
    private readonly faq;
    private readonly schema;
    private readonly pages;
    private readonly crawlers;
    constructor(knowledgeGraph: KnowledgeGraphService, faq: FaqEngineService, schema: SchemaMarkupService, pages: ProgrammaticPageService, crawlers: AiCrawlerAnalyticsService);
    knowledge(req: Request): Promise<{
        success: boolean;
        data: {
            schema: {
                organization: {
                    '@context': string;
                    '@type': string;
                    name: string;
                    url: string;
                    logo: string;
                    sameAs: never[];
                };
                webSite: {
                    '@context': string;
                    '@type': string;
                    name: string;
                    url: string;
                    potentialAction: {
                        '@type': string;
                        target: string;
                        'query-input': string;
                    };
                };
                faqPage: {
                    '@context': string;
                    '@type': string;
                    mainEntity: {
                        '@type': string;
                        name: string;
                        acceptedAnswer: {
                            '@type': string;
                            text: string;
                        };
                    }[];
                };
            };
            platform: {
                name: string;
                description: string;
            };
            plus: {
                name: string;
                benefits: string[];
            };
            cities: {
                id: string;
                name: string;
                state: string;
                latitude: number;
                longitude: number;
                slug: string;
            }[];
            stores: {
                city: {
                    name: string;
                    slug: string;
                };
                id: string;
                name: string;
                ratingAvg: number;
                ratingCount: number;
                slug: string;
            }[];
            categories: {
                id: string;
                name: string;
                description: string | null;
                slug: string;
            }[];
            brands: {
                name: string | null;
                productCount: number;
            }[];
            faqs: {
                slug: string;
                question: string;
                answer: string;
            }[];
            entities: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                slug: string;
                entityType: import("@prisma/client").$Enums.SeoEntityType;
                entityId: string | null;
                relations: import("@prisma/client/runtime/library").JsonValue;
                knowledgeJson: import("@prisma/client/runtime/library").JsonValue | null;
                coverageScore: number;
            }[];
            deliveryCoverage: {
                city: string;
                slug: string;
                state: string;
            }[];
            generatedAt: string;
        };
    }>;
    seoPage(path: string, req: Request): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            page: {
                city: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    state: string;
                    isActive: boolean;
                    latitude: number;
                    longitude: number;
                    slug: string;
                    country: string;
                    timezone: string;
                } | null;
                store: {
                    id: string;
                    status: import("@prisma/client").$Enums.StoreStatus;
                    name: string;
                    createdAt: Date;
                    email: string | null;
                    phone: string | null;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    description: string | null;
                    deliveryFee: import("@prisma/client/runtime/library").Decimal;
                    minOrderAmount: import("@prisma/client/runtime/library").Decimal;
                    isActive: boolean;
                    ratingAvg: number;
                    ratingCount: number;
                    latitude: number;
                    longitude: number;
                    submittedAt: Date | null;
                    rejectionReason: string | null;
                    merchantProfileId: string;
                    cityId: string;
                    slug: string;
                    logoUrl: string | null;
                    bannerUrl: string | null;
                    line1: string;
                    line2: string | null;
                    pincode: string;
                    locality: string | null;
                    locationPincodeId: string | null;
                    locationAreaId: string | null;
                    locationCityId: string | null;
                    deliveryRadiusKm: number;
                    storeType: import("@prisma/client").$Enums.StoreType;
                    reviewedAt: Date | null;
                    reviewedBy: string | null;
                    rejectionType: import("@prisma/client").$Enums.RejectionType | null;
                    rejectionRevokedAt: Date | null;
                    rejectionRevokedBy: string | null;
                    rejectionRevokeReason: string | null;
                    documentRequestReason: string | null;
                    documentRequestAt: Date | null;
                    documentRequestBy: string | null;
                    requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
                    avgPrepTimeMins: number;
                    reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
                } | null;
                category: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    description: string | null;
                    storeId: string | null;
                    scope: import("@prisma/client").$Enums.CategoryScope;
                    isActive: boolean;
                    slug: string;
                    sortOrder: number;
                    parentId: string | null;
                    icon: string | null;
                    imageUrl: string | null;
                    catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
                } | null;
                faqs: {
                    category: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    cityId: string | null;
                    slug: string;
                    impressions: number;
                    clicks: number;
                    pageId: string | null;
                    question: string;
                    answer: string;
                    featured: boolean;
                    aeoScore: number;
                }[];
            } & {
                path: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                storeId: string | null;
                title: string;
                categoryId: string | null;
                cityId: string | null;
                slug: string;
                entityType: string | null;
                entityId: string | null;
                pageType: import("@prisma/client").$Enums.SeoPageType;
                h1: string | null;
                canonicalUrl: string | null;
                brandSlug: string | null;
                metaJson: import("@prisma/client/runtime/library").JsonValue | null;
                indexable: boolean;
            };
            schemas: Record<string, unknown>[];
            featuredAnswer: {
                answer: string;
                direct: boolean;
                snippet: string;
            } | null;
        };
        message?: undefined;
    }>;
}
