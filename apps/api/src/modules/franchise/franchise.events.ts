/**
 * Franchise domain events.
 *
 * Notifications go through the event bus rather than a direct call because
 * FranchiseStoreLinkService must stay dependency-light: it is provided in both
 * AdminModule and FranchiseModule, and giving it a service dependency recreates the
 * circular module graph that once took the API down.
 */
export const FRANCHISE_EVENTS = {
  /** A recruited store was approved and attributed to the partner. */
  STORE_LINKED: 'franchise.store.linked',
  /** Attribution parked — the store sits in another partner's exclusive pincode. */
  STORE_DISPUTED: 'franchise.store.disputed',
} as const;

export interface FranchiseStoreEvent {
  franchiseId: string;
  storeName: string;
  reason: string | null;
}
