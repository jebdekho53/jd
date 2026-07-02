/** Domain events emitted by the inventory module. */
export const INVENTORY_EVENTS = {
  /** Fired when a variant's stock transitions from out-of-stock to in-stock. */
  BACK_IN_STOCK: 'inventory.back_in_stock',
} as const;

export interface InventoryBackInStockEvent {
  productId: string;
  variantId: string;
}
