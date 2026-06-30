import type { ShadowfaxApiMode } from './shadowfax.endpoints';
export declare function resolveShadowfaxApiMode(apiUrl: string, explicitMode?: string | null): ShadowfaxApiMode;
export declare function normalizeShadowfaxApiBase(apiUrl: string, mode?: ShadowfaxApiMode): string;
export declare function shadowfaxRequestUrl(baseUrl: string, path: string): string;
export declare function shadowfaxRequestPath(baseUrl: string, path: string): string;
export declare function maskShadowfaxToken(token: string): string;
export declare function assertSupportedShadowfaxPath(mode: ShadowfaxApiMode, path: string): void;
export declare function shadowfaxRequestTarget(baseUrl: string, path: string): string;
