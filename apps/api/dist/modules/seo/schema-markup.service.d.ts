import { ConfigService } from '@nestjs/config';
export declare class SchemaMarkupService {
    private readonly siteUrl;
    constructor(config: ConfigService);
    organization(): {
        '@context': string;
        '@type': string;
        name: string;
        url: string;
        logo: string;
        sameAs: never[];
    };
    webSite(): {
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
    localBusiness(store: {
        name: string;
        slug: string;
        address?: string | null;
        city?: string;
        ratingAvg?: number;
        ratingCount?: number;
        logoUrl?: string | null;
    }): {
        '@context': string;
        '@type': string;
        name: string;
        image: string | null | undefined;
        url: string;
        address: string | undefined;
        aggregateRating: {
            '@type': string;
            ratingValue: number;
            reviewCount: number;
        } | undefined;
    };
    product(product: {
        name: string;
        description?: string | null;
        imageUrls: string[];
        price: number;
        currency?: string;
        ratingAvg?: number;
        ratingCount?: number;
    }): {
        '@context': string;
        '@type': string;
        name: string;
        description: string;
        image: string[];
        offers: {
            '@type': string;
            price: number;
            priceCurrency: string;
            availability: string;
        };
        aggregateRating: {
            '@type': string;
            ratingValue: number;
            reviewCount: number;
        } | undefined;
    };
    faqPage(faqs: Array<{
        question: string;
        answer: string;
    }>): {
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
    breadcrumbList(items: Array<{
        name: string;
        path: string;
    }>): {
        '@context': string;
        '@type': string;
        itemListElement: {
            '@type': string;
            position: number;
            name: string;
            item: string;
        }[];
    };
    forPage(page: {
        pageType: string;
        title: string;
        faqs?: Array<{
            question: string;
            answer: string;
        }>;
    }): Record<string, unknown>[];
}
