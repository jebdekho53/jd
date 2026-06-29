import { ShipmentProviderStatus } from '@prisma/client';
export declare const NORMALIZED_STATUS_LABELS: Record<ShipmentProviderStatus, string>;
export declare function labelForNormalizedStatus(status: string): string;
