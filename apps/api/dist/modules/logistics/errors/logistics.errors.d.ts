import { DeliveryProviderType } from '@prisma/client';
export declare class LogisticsProviderError extends Error {
    readonly providerType: DeliveryProviderType;
    readonly code?: string | undefined;
    readonly retryable: boolean;
    readonly cause?: unknown | undefined;
    readonly providerStatusCode?: number;
    readonly providerMessage?: string;
    constructor(message: string, providerType: DeliveryProviderType, code?: string | undefined, retryable?: boolean, cause?: unknown | undefined, opts?: {
        providerStatusCode?: number;
        providerMessage?: string;
    });
}
export declare class ProviderNotEnabledError extends LogisticsProviderError {
    constructor(providerType: DeliveryProviderType);
}
export declare class ProviderNotImplementedError extends LogisticsProviderError {
    constructor(providerType: DeliveryProviderType);
}
