import { Decimal } from '@prisma/client/runtime/library';
export declare function decimalToNumber(value: Decimal | number | null | undefined): number;
export declare function roundMoney(value: number): number;
export declare function addDays(date: Date, days: number): Date;
