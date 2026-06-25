'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/design-system/primitives';
import { useMarkIssueMutation } from '@/hooks/use-orders';
import { useToast } from '@/design-system/primitives';
import { OrderSlaBadge } from './order-sla-badge';
import type { SlaLevel } from '@/lib/order-pipeline';

interface Props {
  orderId: string;
  riderWaitMins?: number;
  riderWaitSla?: SlaLevel;
}

export function AwaitingRiderAlert({ orderId, riderWaitMins = 0, riderWaitSla = 'yellow' }: Props) {
  const { toast } = useToast();
  const issueMutation = useMarkIssueMutation(orderId);

  const escalate = async () => {
    try {
      await issueMutation.mutateAsync({
        id: orderId,
        note: 'ADMIN_ESCALATION: Order awaiting rider assignment',
      });
      toast('Escalation logged — admin team notified', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-amber-900">Awaiting Rider</p>
          <p className="text-sm text-amber-800">
            No rider assigned yet. Waiting {riderWaitMins} minute{riderWaitMins === 1 ? '' : 's'}.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <OrderSlaBadge label="Wait" mins={riderWaitMins} level={riderWaitSla} />
            <Button size="sm" variant="outline" onClick={escalate} loading={issueMutation.isPending}>
              Escalate to Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
