import { ConfigService } from '@nestjs/config';
import { type ShadowfaxApiMode } from './shadowfax.endpoints';
export interface ShadowfaxCreatePayload {
    order_details: {
        client_order_id: string;
        awb_number?: string;
        order_value?: number;
        product_value?: number;
        declared_value?: number;
        invoice_value?: number;
        payable_amount?: number;
        cod_amount?: number;
        weight?: number;
        actual_weight?: number;
        length?: number;
        breadth?: number;
        height?: number;
        paid: boolean;
        payment_mode?: ShadowfaxPaymentMode;
        pickup_details: ShadowfaxAddressPayload;
        drop_details: ShadowfaxAddressPayload;
        order_items?: ShadowfaxProductPayload[];
    };
    customer_details?: ShadowfaxAddressPayload;
    pickup_details?: ShadowfaxAddressPayload;
    rts_details?: ShadowfaxAddressPayload;
    product_details?: ShadowfaxProductPayload[];
}
export type ShadowfaxPaymentMode = 'COD' | 'PREPAID';
export interface ShadowfaxProductPayload {
    product_name: string;
    name: string;
    sku_name: string;
    description: string;
    sku?: string;
    hsn_code?: string;
    quantity: number;
    price: number;
    unit_price: number;
    value: number;
    item_value: number;
    product_value: number;
    tax?: number;
    discount?: number;
    weight?: number;
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
    private readonly tokenConfigError;
    private readonly apiMode;
    private readonly creditsKey;
    private readonly createOrderEndpoint;
    private readonly debugPayloads;
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
        pincode?: string;
    }): Promise<Record<string, unknown>>;
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        message?: string;
    }>;
    private authHeader;
    private resolveToken;
    private validateRawToken;
    private withPaymentMode;
    private paymentModeForPayload;
    private isDebugLoggingEnabled;
    private daleServiceabilityPath;
    private createLegacyOrder;
    private legacyServiceabilityPayload;
    private createFlashOrder;
    private normalizePhone;
    private request;
}
