'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardBody, Spinner, Table, THead, TBody, Tr, Th, Td } from '@/design-system/primitives';
import { OrderStatusBadge } from './components/order-status-badge';
import { OrderActionButtons } from './components/order-action-buttons';
import { OrderTimeline } from './components/order-timeline';
import { useOrderDetailQuery } from '@/hooks/use-orders';

export function OrderDetailContent({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useOrderDetailQuery(orderId);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!order) return <p className="text-red-600">Order not found.</p>;

  const addr = order.deliveryAddress as Record<string, string>;

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Orders</Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">#{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-slate-500">
            {new Date(order.createdAt).toLocaleString('en-IN')} · {order.paymentMethod}
          </p>
        </div>
        <OrderActionButtons orderId={order.id} status={order.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><h2 className="font-semibold">Order Items</h2></CardHeader>
            <CardBody className="p-0">
              <Table>
                <THead>
                  <Tr><Th>Item</Th><Th>Qty</Th><Th>Unit Price</Th><Th>Total</Th></Tr>
                </THead>
                <TBody>
                  {order.items.map((item) => (
                    <Tr key={item.id}>
                      <Td>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-slate-400">{item.variantName}</p>
                      </Td>
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
            <CardHeader><h2 className="font-semibold">Pricing Summary</h2></CardHeader>
            <CardBody className="space-y-2 text-sm">
              {[
                { label: 'Subtotal', val: `₹${order.subtotal}` },
                { label: 'Delivery Fee', val: `₹${order.deliveryFee}` },
                { label: 'Discount', val: `-₹${order.discountAmount}` },
                { label: 'Tax', val: `₹${order.taxAmount}` },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span>{val}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold">
                <span>Total</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><h2 className="font-semibold">Customer</h2></CardHeader>
            <CardBody className="text-sm space-y-1">
              <p className="font-medium">{order.buyerProfile?.name ?? 'N/A'}</p>
              {order.buyerNote && <p className="text-slate-500 italic">"{order.buyerNote}"</p>}
              {addr && (
                <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>{addr.city} — {addr.pincode}</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Order Timeline</h2></CardHeader>
            <CardBody>
              <OrderTimeline entries={order.statusHistory} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
