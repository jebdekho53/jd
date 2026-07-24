'use client';

import { useState } from 'react';
import { CheckCircle, ChefHat, Package, PackageCheck, Truck, Home, AlertTriangle, XCircle } from 'lucide-react';
import { Button, Modal, Textarea } from '@/design-system/primitives';
import {
  useConfirmOrderMutation,
  useMarkPreparingMutation,
  useMarkPackingMutation,
  useMarkReadyMutation,
  useMarkOutForDeliveryMutation,
  useMarkDeliveredMutation,
  useMarkIssueMutation,
  useCancelOrderMutation,
} from '@/hooks/use-orders';
import { useToast } from '@/design-system/primitives';
import type { OrderStatus } from '@/types/order';

interface Props {
  orderId: string;
  status: OrderStatus;
  /** 'SELF' stores get no rider/3PL — the merchant reports their own hand-off. */
  deliveryMode?: 'PLATFORM' | 'SELF';
  /** FOOD orders skip PACKING — see FOOD_MERCHANT_FORWARD in the API. */
  orderVertical?: 'GROCERY' | 'FOOD';
}

export function OrderActionButtons({ orderId, status, deliveryMode, orderVertical }: Props) {
  const { toast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [issueNote, setIssueNote] = useState('');

  const confirmMutation = useConfirmOrderMutation(orderId);
  const preparingMutation = useMarkPreparingMutation(orderId);
  const packingMutation = useMarkPackingMutation(orderId);
  const readyMutation = useMarkReadyMutation(orderId);
  const outForDeliveryMutation = useMarkOutForDeliveryMutation(orderId);
  const deliveredMutation = useMarkDeliveredMutation(orderId);
  const issueMutation = useMarkIssueMutation(orderId);
  const cancelMutation = useCancelOrderMutation(orderId);
  const isSelfDelivery = deliveryMode === 'SELF';
  const isFood = orderVertical === 'FOOD';

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

  const handleIssue = async () => {
    try {
      await issueMutation.mutateAsync({ id: orderId, note: issueNote || undefined });
      toast('Issue flagged on order', 'success');
      setIssueOpen(false);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const canCancel = ['PAID', 'MERCHANT_ACCEPTED', 'PREPARING', 'PACKING'].includes(status);
  const canFlagIssue = !['DELIVERED', 'COMPLETED', 'CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT', 'CANCELLED_BY_ADMIN'].includes(status);

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'PAID' && (
        <Button
          size="sm"
          onClick={() => act((id) => confirmMutation.mutateAsync(id), 'accepted')}
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
      {status === 'PREPARING' && isFood && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => act((id) => readyMutation.mutateAsync(id), 'ready for pickup')}
          loading={readyMutation.isPending}
        >
          <PackageCheck className="h-4 w-4" /> Ready For Pickup
        </Button>
      )}
      {status === 'PREPARING' && !isFood && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => act((id) => packingMutation.mutateAsync(id), 'moved to packing')}
          loading={packingMutation.isPending}
        >
          <Package className="h-4 w-4" /> Start Packing
        </Button>
      )}
      {status === 'PACKING' && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => act((id) => readyMutation.mutateAsync(id), 'ready for pickup')}
          loading={readyMutation.isPending}
        >
          <PackageCheck className="h-4 w-4" /> Ready For Pickup
        </Button>
      )}
      {status === 'READY_FOR_PICKUP' && isSelfDelivery && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => act((id) => outForDeliveryMutation.mutateAsync(id), 'out for delivery')}
          loading={outForDeliveryMutation.isPending}
        >
          <Truck className="h-4 w-4" /> Out For Delivery
        </Button>
      )}
      {status === 'OUT_FOR_DELIVERY' && isSelfDelivery && (
        <Button
          size="sm"
          onClick={() => act((id) => deliveredMutation.mutateAsync(id), 'delivered')}
          loading={deliveredMutation.isPending}
        >
          <Home className="h-4 w-4" /> Mark Delivered
        </Button>
      )}
      {canFlagIssue && (
        <Button size="sm" variant="outline" onClick={() => setIssueOpen(true)}>
          <AlertTriangle className="h-4 w-4" /> Mark Issue
        </Button>
      )}
      {canCancel && (
        <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)}>
          <XCircle className="h-4 w-4" /> Reject Order
        </Button>
      )}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Reject Order"
        description="Please provide a reason for rejection."
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelMutation.isPending}>
              Confirm Reject
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

      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="Mark Issue"
        description="Flag an operational issue without changing order status."
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIssueOpen(false)}>Back</Button>
            <Button onClick={handleIssue} loading={issueMutation.isPending}>
              Flag Issue
            </Button>
          </div>
        }
      >
        <Textarea
          label="Issue note"
          value={issueNote}
          onChange={(e) => setIssueNote(e.target.value)}
          placeholder="e.g. Missing ingredient, packaging damage"
        />
      </Modal>
    </div>
  );
}
