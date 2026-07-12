/**
 * Single source of truth for Socket.IO room names.
 *
 * Every gateway builds room names through these helpers. Before this existed
 * each gateway spelled its own rooms inline, which is how the tracking gateway
 * ended up publishing to `merchant:<storeId>` while the only room a merchant
 * could ever join was `merchant:<orderId>`.
 */

export const ADMIN_FLEET_ROOM = 'admin:fleet';
export const FLEET_OPS_ROOM = 'fleet:ops';
export const CONTROL_ROOM = 'control-room';
export const WHATSAPP_INBOX_ROOM = 'whatsapp-inbox';

export const orderRoom = (orderId: string): string => `order:${orderId}`;
export const storeRoom = (storeId: string): string => `store:${storeId}`;
export const riderRoom = (riderProfileId: string): string => `rider:${riderProfileId}`;
export const buyerRoom = (buyerProfileId: string): string => `buyer:${buyerProfileId}`;
export const productRoom = (productId: string): string => `product:${productId}`;

/** Room scopes a client may request via a `subscribe` message. */
export type RoomScope =
  | { type: 'order'; id: string }
  | { type: 'store'; id: string }
  | { type: 'rider'; id: string }
  | { type: 'buyer'; id: string }
  | { type: 'product'; id: string }
  | { type: 'admin-fleet' }
  | { type: 'fleet-ops' }
  | { type: 'control-room' }
  | { type: 'whatsapp-inbox' };

export function roomNameFor(scope: RoomScope): string {
  switch (scope.type) {
    case 'order':
      return orderRoom(scope.id);
    case 'store':
      return storeRoom(scope.id);
    case 'rider':
      return riderRoom(scope.id);
    case 'buyer':
      return buyerRoom(scope.id);
    case 'product':
      return productRoom(scope.id);
    case 'admin-fleet':
      return ADMIN_FLEET_ROOM;
    case 'fleet-ops':
      return FLEET_OPS_ROOM;
    case 'control-room':
      return CONTROL_ROOM;
    case 'whatsapp-inbox':
      return WHATSAPP_INBOX_ROOM;
  }
}
