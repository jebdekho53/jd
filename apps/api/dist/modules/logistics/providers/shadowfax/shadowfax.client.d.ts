import { ConfigService } from '@nestjs/config';
import { type ShadowfaxApiMode } from './shadowfax-url.util';
export interface ShadowfaxCreatePayload {
    order_details: {
        client_order_id: string;
        order_value?: number;
        paid: boolean;
        pickup_details: ShadowfaxAddressPayload;
        drop_details: ShadowfaxAddressPayload;
        order_items?: Array<{
            name: string;
            quantity: number;
            price?: number;
        }>;
    };
}
export interface ShadowfaxFlashCreatePayload {
    pickup_details: Record<string, unknown>;
    drop_details: Record<string, unknown>;
    order_details: Record<string, unknown>;
    user_details: Record<string, unknown>;
}
export interface ShadowfaxAddressPayload {
    name: string;
    contact: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state?: string;
    pincode: string;
    latitude: number;
    longitude: number;
}
export declare class ShadowfaxClient {
    private readonly config;
    private readonly logger;
    private readonly http;
    private readonly apiUrl;
    private readonly token;
    private readonly apiMode;
    private readonly creditsKey;
    constructor(config: ConfigService);
    getApiMode(): ShadowfaxApiMode;
    isConfigured(): boolean;
    createShipment(payload: ShadowfaxCreatePayload): Promise<Record<string, unknown>>;
    cancelShipment(shipmentId: string, reason?: string): Promise<Record<string, unknown>>;
    trackShipment(shipmentId: string): Promise<Record<string, unknown>>;
    estimatePrice(payload: {
        pickup_lat: number;
        pickup_lng: number;
        drop_lat: number;
        drop_lng: number;
        weight_g?: number;
    }): Promise<Record<string, unknown>>;
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        message?: string;
    }>;
    private authHeader;
    private createFlashOrder;
    private normalizePhone;
    private request;
}
