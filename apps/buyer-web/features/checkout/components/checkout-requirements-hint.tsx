import { AlertCircle } from 'lucide-react';

interface CheckoutRequirementsHintProps {
  items: string[];
  className?: string;
}

/** Lists what the buyer still needs to complete before placing an order. */
export function CheckoutRequirementsHint({ items, className }: CheckoutRequirementsHintProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 ${className ?? ''}`}
      role="status"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">Complete these to place your order:</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-amber-900">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
