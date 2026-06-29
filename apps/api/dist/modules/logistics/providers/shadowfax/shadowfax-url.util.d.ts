export type ShadowfaxApiMode = 'v3' | 'flash';
export declare function resolveShadowfaxApiMode(apiUrl: string, explicitMode?: string | null): ShadowfaxApiMode;
export declare function normalizeShadowfaxApiBase(apiUrl: string): string;
export declare function shadowfaxRequestTarget(baseUrl: string, path: string): string;
