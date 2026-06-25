'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchPlus(path: string, init?: RequestInit) {
  const res = await fetch(`/api/buyer/plus/${path}`, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function BuyerPlusContent() {
  const { data: plans } = useQuery({ queryKey: ['plus', 'plans'], queryFn: () => fetchPlus('plans') });
  const { data: me, refetch } = useQuery({ queryKey: ['plus', 'me'], queryFn: () => fetchPlus('me') });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">JebDekho Plus</h1>
      {me?.subscription && (
        <div className="rounded-xl border bg-violet-50 p-4 text-sm">
          Active: {me.subscription.plan.name} · expires {new Date(me.subscription.expiresAt).toLocaleDateString()}
          <p className="mt-1 text-slate-600">Savings: ₹{me.savings?.savings ?? 0}</p>
        </div>
      )}
      <div className="space-y-3">
        {(plans ?? []).map((p: { id: string; name: string; monthlyPrice: number; yearlyPrice: number; benefits: Array<{ type: string }> }) => (
          <div key={p.id} className="rounded-xl border p-4">
            <h2 className="font-semibold">{p.name}</h2>
            <p className="text-sm text-slate-500">₹{Number(p.monthlyPrice)}/mo · ₹{Number(p.yearlyPrice)}/yr</p>
            <ul className="mt-2 text-xs text-slate-600">
              {p.benefits.map((b) => <li key={b.type}>{b.type.replace(/_/g, ' ')}</li>)}
            </ul>
            <button
              type="button"
              className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm text-white"
              onClick={async () => {
                await fetchPlus('subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: p.id }) });
                refetch();
              }}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
