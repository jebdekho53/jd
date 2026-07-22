'use client';

import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardBody, Spinner, Table, THead, TBody, Tr, Th, Td } from '@/design-system/primitives';
import { OrderStatusBadge } from './components/order-status-badge';
import { OrderActionButtons } from './components/order-action-buttons';
import { OrderTimeline } from '@jebdekho/order-timeline';
import { RiderAssignmentCard } from './components/rider-assignment-card';
import { MerchantDeliveryTracking } from '@/features/tracking/merchant-delivery-tracking';
import { MerchantShipmentPanel } from '@/features/logistics/merchant-shipment-panel';
import { CustomerPanel } from './components/customer-panel';
import { OrderSlaBadge } from './components/order-sla-badge';
import { AwaitingRiderAlert } from './components/awaiting-rider-alert';
import { useOrderDetailQuery } from '@/hooks/use-orders';

export function OrderDetailContent({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useOrderDetailQuery(orderId);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!order) return <p className="text-red-600">Order not found.</p>;

  const ops = order.operations;
  const fulfillmentBatch = (order as { fulfillmentBatch?: { label: string; isBatched?: boolean; orders?: string[] } }).fulfillmentBatch;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Orders</Button>
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">#{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-slate-500">
            {new Date(order.createdAt).toLocaleString('en-IN')} · {order.paymentMethod}
          </p>
          {ops && (
            <div className="mt-2 flex flex-wrap gap-2">
              <OrderSlaBadge label="Order age" mins={ops.orderAgeMins} level="green" />
              {ops.sinceAcceptedMins != null && (
                <OrderSlaBadge label="Since accepted" mins={ops.sinceAcceptedMins} level={ops.prepSla} />
              )}
              {ops.sincePackingMins != null && ops.packSla && (
                <OrderSlaBadge label="Packing" mins={ops.sincePackingMins} level={ops.packSla} />
              )}
            </div>
          )}
        </div>
        <OrderActionButtons orderId={order.id} status={order.status} deliveryMode={order.deliveryMode} />
      </div>

      {ops?.awaitingRider && (
        <div className="mb-4">
          <AwaitingRiderAlert
            orderId={order.id}
            riderWaitMins={ops.riderWaitMins}
            riderWaitSla={ops.riderWaitSla}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><h2 className="font-semibold">Order Items</h2></CardHeader>
            <CardBody className="p-0">
              <Table>
                <THead>
                  <Tr><Th>Item</Th><Th>SKU</Th><Th>Qty</Th><Th>Unit Price</Th><Th>Total</Th></Tr>
                </THead>
                <TBody>
                  {order.items.map((item) => (
                    <Tr key={item.id}>
                      <Td>
                        <p className="font-medium">{item.productName}</p>
                        {item.variantName && <p className="text-xs text-slate-400">{item.variantName}</p>}
                      </Td>
                      <Td className="font-mono text-xs text-slate-500">{item.sku}</Td>
                      <Td>×{item.quantity}</Td>
                      <Td>₹{item.unitPrice}</Td>
                      <Td className="font-semibold">₹{item.totalPrice}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-slate-400" />
                Price Breakdown
              </h2>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              {[
                { label: 'Subtotal', val: `₹${order.subtotal}` },
                { label: 'Delivery charges', val: `₹${order.deliveryFee}` },
                { label: 'Discounts', val: `-₹${order.discountAmount}` },
                { label: 'Tax', val: `₹${order.taxAmount}` },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span>{val}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                <span>Grand total</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <CustomerPanel order={order} />
          <RiderAssignmentCard
            delivery={order.delivery}
            awaitingRider={ops?.awaitingRider}
            riderWaitMins={ops?.riderWaitMins}
            riderWaitSla={ops?.riderWaitSla}
            orderId={order.id}
          />
          {fulfillmentBatch && (
            <Card>
              <CardHeader><h2 className="font-semibold">Delivery batch</h2></CardHeader>
              <CardBody className="text-sm">
                <p>{fulfillmentBatch.label}</p>
                {fulfillmentBatch.isBatched && fulfillmentBatch.orders && (
                  <p className="mt-1 text-slate-500">
                    Batch orders: {fulfillmentBatch.orders.join(', ')}
                  </p>
                )}
              </CardBody>
            </Card>
          )}
          <MerchantDeliveryTracking orderId={order.id} orderStatus={order.status} />
          <MerchantShipmentPanel orderId={order.id} />
          <Card>
            <CardHeader><h2 className="font-semibold">Order Timeline</h2></CardHeader>
            <CardBody>
              <OrderTimeline history={order.timeline ?? order.statusHistory} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
