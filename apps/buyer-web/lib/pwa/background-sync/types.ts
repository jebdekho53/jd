export type BackgroundSyncKind =
  | 'wishlist'
  | 'cart'
  | 'search-history'
  | 'analytics';

export interface BackgroundSyncJob {
  id: string;
  kind: BackgroundSyncKind;
  payload: unknown;
  createdAt: number;
  attempts: number;
}
