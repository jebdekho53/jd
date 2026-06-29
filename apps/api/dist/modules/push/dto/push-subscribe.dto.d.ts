import { PushDeviceType } from '@prisma/client';
export declare class PushSubscribeDto {
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
    deviceType?: PushDeviceType;
}
export declare class PushUnsubscribeDto {
    endpoint: string;
}
