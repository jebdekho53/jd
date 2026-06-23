'use client';

import { useState } from 'react';
import { CheckCircle, ChefHat, PackageCheck, XCircle } from 'lucide-react';
import { Button, Modal, Textarea } from '@/design-system/primitives';
import {
  useConfirmOrderMutation,
  useMarkPreparingMutation,
  useMarkReadyMutation,
  useCancelOrderMutation,
} from '@/hooks/use-orders';
import { useToast } from '@/design-system/primitives';
import type { OrderStatus } from '@/types/order';

interface Props {
  orderId: string;
  status: OrderStatus;
}

export function OrderActionButtons({ orderId, status }: Props) {
  const { toast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  const confirmMutation = useConfirmOrderMutation(orderId);
  const preparingMutation = useMarkPreparingMutation(orderId);
  const readyMutation = useMarkReadyMutation(orderId);
  const cancelMutation = useCancelOrderMutation(orderId);

  const act = async (mutate: (id: string) => Promise<unknown>, label: string) => {
    try {
      await mutate(orderId);
      toast(`Order ${label}!`, 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ id: orderId, reason: reason || undefined });
      toast('Order cancelled', 'success');
      setCancelOpen(false);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const canCancel = ['PAID', 'MERCHANT_ACCEPTED', 'PREPARING'].includes(status);

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'PAID' && (
        <Button
          size="sm"
          onClick={() => act((id) => confirmMutation.mutateAsync(id), 'confirmed')}
          loading={confirmMutation.isPending}
        >
          <CheckCircle className="h-4 w-4" /> Accept Order
        </Button>
      )}
      {status === 'MERCHANT_ACCEPTED' && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => act((id) => preparingMutation.mutateAsync(id), 'marked as preparing')}
          loading={preparingMutation.isPending}
        >
          <ChefHat className="h-4 w-4" /> Start Preparing
        </Button>
      )}
      {status === 'PREPARING' && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => act((id) => readyMutation.mutateAsync(id), 'ready for pickup')}
          loading={readyMutation.isPending}
        >
          <PackageCheck className="h-4 w-4" /> Mark Ready
        </Button>
      )}
      {canCancel && (
        <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)}>
          <XCircle className="h-4 w-4" /> Cancel Order
        </Button>
      )}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Order"
        description="Please provide a reason for cancellation."
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelMutation.isPending}>
              Confirm Cancel
            </Button>
          </div>
        }
      >
        <Textarea
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Item out of stock"
        />
      </Modal>
    </div>
  );
}
