import { Prisma } from '@prisma/client';
export declare const IST_TIMEZONE = "Asia/Kolkata";
export declare function startOfIstDay(date?: Date): Date;
export declare function endOfIstDay(date?: Date): Date;
export declare function istDayRange(date?: Date): {
    start: Date;
    end: Date;
};
export declare function startOfIstMonth(date?: Date): Date;
export declare function istWeekdayIndex(date?: Date): number;
export declare function startOfIstWeek(date?: Date): Date;
export declare function daysAgoIst(n: number, from?: Date): Date;
export declare const startOfUtcDay: typeof startOfIstDay;
export declare function daysAgo(n: number): Date;
export declare function orderIstDayFilter(opts: {
    today?: boolean;
    yesterday?: boolean;
}): Prisma.OrderWhereInput | undefined;
export declare const merchantOrderDayFilter: typeof orderIstDayFilter;
export declare function istHourRange(date?: Date): {
    start: Date;
    end: Date;
};
