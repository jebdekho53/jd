import { ConfigService } from '@nestjs/config';
export interface OptimizedAiProductImages {
    originalUrl: string;
    optimizedUrl: string;
    thumbnailUrl: string;
    aiAnalysisUrl: string;
}
export declare class AiProductImageService {
    private readonly configService;
    constructor(configService: ConfigService);
    optimizeForAiAnalysis(dataUrl: string): Promise<OptimizedAiProductImages>;
    private parseDataUrl;
    private loadSharp;
}
