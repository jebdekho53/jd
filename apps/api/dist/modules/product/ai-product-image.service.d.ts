import { ConfigService } from '@nestjs/config';
export interface OptimizedAiProductImages {
    originalUrl: string;
    optimizedUrl: string;
    thumbnailUrl: string;
    aiAnalysisUrl: string;
}
export declare class AiProductImageService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    optimizeForAiAnalysis(dataUrl: string): Promise<OptimizedAiProductImages>;
    saveGeneratedImage(input: Buffer): Promise<{
        originalUrl: string;
        optimizedUrl: string;
        thumbnailUrl: string;
    }>;
    loadStoredImage(publicUrl: string): Promise<Buffer>;
    cleanBackgroundFromStored(publicUrl: string): Promise<{
        originalUrl: string;
        optimizedUrl: string;
        thumbnailUrl: string;
    }>;
    private removeBackgroundToWhite;
    private runRembg;
    private parseDataUrl;
    private loadSharp;
}
