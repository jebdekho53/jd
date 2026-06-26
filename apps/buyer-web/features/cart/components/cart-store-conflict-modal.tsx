'use client';

import { Button, Modal, Text } from '@/design-system/primitives';
import { useCartStore } from '@/store/cart-store';
import { useGuestCartStore } from '@/store/guest-cart-store';
import { useAddCartItemMutation, useClearCartMutation } from '@/hooks/use-cart';
import { useAuthStore } from '@/store/auth-store';
import { SessionError } from '@/services/auth/auth-api';
import { useToast } from '@/design-system/primitives';

export function CartStoreConflictModal() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { conflictStore, pendingAddPayload, clearConflict } = useCartStore();
  const guestClear = useGuestCartStore((s) => s.clear);
  const guestAddItem = useGuestCartStore((s) => s.addItem);
  const clearCart = useClearCartMutation();
  const addItem = useAddCartItemMutation();
  const { toast } = useToast();

  const open = Boolean(conflictStore && pendingAddPayload);

  const handleReplace = async () => {
    if (!pendingAddPayload) return;
    try {
      if (isAuthenticated) {
        await clearCart.mutateAsync();
        await addItem.mutateAsync({
          productId: pendingAddPayload.productId,
          variantId: pendingAddPayload.variantId,
          quantity: pendingAddPayload.quantity,
        });
      } else {
        guestClear();
        guestAddItem({
          productId: pendingAddPayload.productId,
          variantId: pendingAddPayload.variantId,
          quantity: pendingAddPayload.quantity,
          storeId: pendingAddPayload.newStoreId,
          storeName: pendingAddPayload.newStoreName,
        });
      }
      toast(`Switched to ${pendingAddPayload.newStoreName}`, 'success');
      clearConflict();
    } catch (err) {
      toast(err instanceof SessionError ? err.message : 'Failed to update cart', 'error');
    }
  };

  const busy = clearCart.isPending || addItem.isPending;

  return (
    <Modal
      open={open}
      onClose={clearConflict}
      dismissible={!busy}
      title="Start a new cart?"
      description={`Your cart has items from "${conflictStore?.name}". Adding this item will clear your current cart.`}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={clearConflict} disabled={busy}>
            Keep current
          </Button>
          <Button fullWidth loading={busy} onClick={handleReplace}>
            Start fresh
          </Button>
        </div>
      }
    >
      <Text variant="bodySm">
        You can only order from one store at a time on Jebdekho.
      </Text>
    </Modal>
  );
}
