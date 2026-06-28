'use client';

import { useQuery } from '@tanstack/react-query';
import { X, Scale } from 'lucide-react';
import { Modal, Button, Spinner } from '@/design-system/primitives';
import { compareProduct } from '@/services/buyer/buyer-api';
import { formatCurrency } from '@/lib/utils';

interface ComparePricesModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
  lat?: number;
  lng?: number;
  pincode?: string;
}

export function ComparePricesModal({
  productId,
  open,
  onClose,
  lat,
  lng,
  pincode,
}: ComparePricesModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['compare-modal', productId, lat, lng, pincode],
    queryFn: () => compareProduct(productId, { lat, lng, pincode }),
    enabled: open && Boolean(productId),
  });

  return (
    <Modal open={open} onClose={onClose} title="Compare prices" size="lg">
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}
      {error && (
        <p className="py-8 text-center text-sm text-red-600">{(error as Error).message}</p>
      )}
      {data && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <Scale className="h-4 w-4" />
            Save up to {formatCurrency(data.savings)} ({data.savingsPercent}%) on {data.name}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2">Store</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Payable</th>
                  <th className="px-3 py-2">Distance</th>
                  <th className="px-3 py-2">ETA</th>
                  <th className="px-3 py-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.stores.map((s) => (
                  <tr key={s.storeId} className={s.cheapest ? 'bg-emerald-50/50' : 'border-b'}>
                    <td className="px-3 py-3 font-medium">
                      {s.storeName}
                      {s.cheapest && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">Best</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {formatCurrency(s.offerPrice)}
                      {s.mrp != null && s.mrp > s.offerPrice && (
                        <span className="ml-1 text-xs text-muted-foreground line-through">
                          {formatCurrency(s.mrp)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium">{formatCurrency(s.finalPayableAmount)}</td>
                    <td className="px-3 py-3">{s.distanceKm != null ? `${s.distanceKm.toFixed(1)} km` : '—'}</td>
                    <td className="px-3 py-3">{s.etaMins != null ? `~${s.etaMins} min` : '—'}</td>
                    <td className="px-3 py-3">{s.rating != null ? s.rating.toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
