'use client';

import { FileText, Download, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';

interface OrderInvoicePanelProps {
  orderId: string;
  orderStatus: string;
}

const INVOICE_ELIGIBLE = new Set(['DELIVERED', 'COMPLETED', 'REFUNDED']);

async function fetchOrderInvoice(orderId: string): Promise<InvoiceData | null> {
  const res = await fetch(`/api/buyer/orders/${orderId}/invoice`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load invoice');
  const json = (await res.json()) as { success: boolean; data: InvoiceData | null };
  return json.data;
}

export function OrderInvoicePanel({ orderId, orderStatus }: OrderInvoicePanelProps) {
  const { toast } = useToast();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['buyer', 'order', orderId, 'invoice'],
    queryFn: () => fetchOrderInvoice(orderId),
    enabled: INVOICE_ELIGIBLE.has(orderStatus),
  });

  if (!INVOICE_ELIGIBLE.has(orderStatus)) return null;
  if (isLoading) return null;
  if (!invoice) return null;

  const handleEmail = async () => {
    try {
      const res = await fetch(`/api/buyer/orders/${orderId}/invoice`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('send failed');
      toast('Invoice sent to your email', 'success');
    } catch {
      toast('Could not send invoice email', 'error');
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-600" />
          <div>
            <h2 className="text-sm font-semibold">GST Invoice</h2>
            <p className="text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/buyer/orders/${orderId}/invoice/pdf`}
            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <Download className="mr-1 h-4 w-4" />
            PDF
          </a>
          <Button variant="outline" size="sm" onClick={handleEmail}>
            <Mail className="mr-1 h-4 w-4" />
            Email
          </Button>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Taxable</dt>
          <dd>₹{invoice.taxableAmount.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">GST</dt>
          <dd>₹{invoice.totalTax.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">CGST</dt>
          <dd>₹{invoice.cgstAmount.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">SGST / IGST</dt>
          <dd>₹{(invoice.sgstAmount + invoice.igstAmount).toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}

interface InvoiceData {
  invoiceNumber: string;
  taxableAmount: number;
  totalTax: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
}
