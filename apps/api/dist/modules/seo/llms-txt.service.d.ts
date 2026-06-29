import { ConfigService } from '@nestjs/config';
export declare class LlmsTxtService {
    private readonly siteUrl;
    constructor(config: ConfigService);
    generate(): string;
    robotsTxt(): string;
}
