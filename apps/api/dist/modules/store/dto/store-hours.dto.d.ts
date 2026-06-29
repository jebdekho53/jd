import { DayOfWeek } from '@prisma/client';
export declare class StoreHourDto {
    dayOfWeek: DayOfWeek;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}
