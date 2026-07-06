import { AICommerceOrchestratorService } from './ai-commerce-orchestrator.service';
import { HotspotService } from './hotspot.service';
import { DemandForecastService } from './demand-forecast.service';
export declare class AdminAICommerceController {
    private readonly orchestrator;
    private readonly hotspots;
    private readonly demand;
    constructor(orchestrator: AICommerceOrchestratorService, hotspots: HotspotService, demand: DemandForecastService);
    overview(): Promise<{
        success: boolean;
        data: {
            forecasts: any;
            hotspots: any;
            accuracy: any;
            crises: any;
            recommendations: any;
            trending: any;
        };
    }>;
    hotspotList(): Promise<{
        success: boolean;
        data: any;
    }>;
    forecasts(): Promise<{
        success: boolean;
        data: any;
    }>;
}
