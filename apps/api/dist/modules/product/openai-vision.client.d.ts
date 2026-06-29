import { ConfigService } from '@nestjs/config';
export interface AiExtractedProduct {
    name: string;
    brand: string;
    categoryName: string;
    subcategoryName: string;
    unit: string;
    weight: string;
    mrp: number | null;
    sellingPrice: number | null;
    description: string;
    highlights: string[];
    tags: string[];
    ingredients: string | null;
    shelfLife: string | null;
    manufacturerName: string | null;
    fssaiLicense: string | null;
    barcode: string | null;
    isSupplement: boolean;
    requiresClearLabel: boolean;
    labelReadable: boolean | null;
    canPublishDirectly: boolean;
    imageQualityScore: number;
    confidence: number;
    productType?: string;
    cuisine?: string | null;
    dietType?: string | null;
    prepTimeMins?: number | null;
    servingSize?: string | null;
}
export declare class OpenAiVisionClient {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    isConfigured(): boolean;
    assertConfigured(): void;
    analyzeProductImage(imageUrl: string): Promise<AiExtractedProduct>;
    analyzeWithCustomPrompt(imageUrl: string, prompt: string): Promise<Record<string, unknown>>;
    parseExtractedJson(raw: string): AiExtractedProduct;
    private nullableString;
    private parseNullableNumber;
    private clamp01;
}
