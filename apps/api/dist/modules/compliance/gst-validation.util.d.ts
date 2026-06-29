export declare const GSTIN_REGEX: RegExp;
export declare function isValidGstin(gstin: string | null | undefined): boolean;
export declare function gstinStateCode(gstin: string | null | undefined): string | null;
export declare function normalizeGstin(gstin: string): string;
