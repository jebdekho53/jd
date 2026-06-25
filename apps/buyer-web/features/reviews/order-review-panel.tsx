'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import { createOrderReview, updateOrderReview } from '@/services/reviews/reviews-api';
import type { OrderReviewSnapshot } from '@/services/reviews/reviews-api';
import { useQueryClient } from '@tanstack/react-query';

function StarInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="rounded p-0.5"
            aria-label={`${n} stars`}
          >
            <Star
              className={`h-5 w-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

interface OrderReviewPanelProps {
  orderId: string;
  storeName: string;
  existing?: OrderReviewSnapshot | null;
  canReview: boolean;
}

export function OrderReviewPanel({ orderId, storeName, existing, canReview }: OrderReviewPanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [storeExperience, setStoreExperience] = useState(existing?.storeExperience ?? 5);
  const [deliveryExperience, setDeliveryExperience] = useState(existing?.deliveryExperience ?? 5);
  const [productQuality, setProductQuality] = useState(existing?.productQuality ?? 5);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [review, setReview] = useState(existing?.review ?? '');

  if (!canReview && !existing) return null;

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        rating,
        storeExperience,
        deliveryExperience,
        productQuality,
        title: title.trim() || undefined,
        review: review.trim() || undefined,
      };
      if (existing) {
        await updateOrderReview(orderId, payload);
        toast('Review updated', 'success');
      } else {
        await createOrderReview(orderId, payload);
        toast('Thank you for your review!', 'success');
      }
      setEditing(false);
      await qc.invalidateQueries({ queryKey: ['order', orderId] });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save review', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (existing && !editing) {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Your review</h2>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Verified purchase
          </span>
        </div>
        <p className="mt-2 text-sm font-medium">{existing.title ?? `${existing.rating}★ for ${storeName}`}</p>
        {existing.review && <p className="mt-1 text-sm text-muted-foreground">{existing.review}</p>}
        {existing.merchantReply && (
          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium">Store reply</p>
            <p className="text-muted-foreground">{existing.merchantReply}</p>
          </div>
        )}
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>
          Edit review
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold">
        {existing ? 'Edit your review' : `Rate ${storeName}`}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Only verified buyers who received this order can leave a review.
      </p>
      <div className="mt-4 space-y-3">
        <StarInput label="Overall" value={rating} onChange={setRating} />
        <StarInput label="Store experience" value={storeExperience} onChange={setStoreExperience} />
        <StarInput label="Delivery experience" value={deliveryExperience} onChange={setDeliveryExperience} />
        <StarInput label="Product quality" value={productQuality} onChange={setProductQuality} />
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Review title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm"
          rows={4}
          placeholder="Share your experience…"
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <Button loading={loading} onClick={submit}>
          {existing ? 'Save changes' : 'Submit review'}
        </Button>
        {existing && (
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
