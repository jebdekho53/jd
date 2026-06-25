'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStoreStore } from '@/store/store-store';

type Tab = 'forecast' | 'inventory' | 'pricing' | 'opportunities' | 'hotspots';

async function fetchAI(path: string, storeId?: string) {
  const params = storeId ? `?storeId=${storeId}` : '';
  const res = await fetch(`/api/merchant/ai/${path}${params}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function MerchantAIContent() {
  const [tab, setTab] = useState<Tab>('forecast');
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;

  const { data: forecast } = useQuery({
    queryKey: ['merchant', 'ai', 'forecast', storeId],
    queryFn: () => fetchAI('forecast', storeId),
    enabled: !!storeId,
  });
  const { data: inventory } = useQuery({
    queryKey: ['merchant', 'ai', 'inventory', storeId],
    queryFn: () => fetchAI('inventory', storeId),
    enabled: !!storeId,
  });
  const { data: pricing } = useQuery({
    queryKey: ['merchant', 'ai', 'pricing', storeId],
    queryFn: () => fetchAI('pricing', storeId),
    enabled: !!storeId,
  });
  const { data: opportunities } = useQuery({
    queryKey: ['merchant', 'ai', 'opportunities', storeId],
    queryFn: () => fetchAI('opportunities', storeId),
    enabled: !!storeId,
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'forecast', label: 'Forecast' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'hotspots', label: 'Hotspots' },
  ];

  if (!storeId) {
    return (
      <DashboardLayout title="AI Commerce">
        <p className="text-sm text-slate-500">Select a store to view AI insights.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="AI Commerce Intelligence">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === t.id ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'forecast' && (
        <Panel title="Demand Forecast">
          {(forecast ?? []).map((f: { id: string; predictedDemand: number; confidenceScore: number; product: { name: string } }) => (
            <Row key={f.id} left={f.product.name} right={`${f.predictedDemand} units · ${Math.round(f.confidenceScore)}% conf`} />
          ))}
          {(forecast ?? []).length === 0 && <Empty />}
        </Panel>
      )}

      {tab === 'inventory' && (
        <Panel title="Stockout Risks">
          {(inventory ?? []).map((f: { id: string; daysUntilStockout: number; urgency: string; product: { name: string } }) => (
            <Row key={f.id} left={f.product.name} right={`${f.daysUntilStockout}d · ${f.urgency}`} />
          ))}
          {(inventory ?? []).length === 0 && <Empty />}
        </Panel>
      )}

      {tab === 'pricing' && (
        <Panel title="Price Recommendations">
          {(pricing ?? []).map((p: { id: string; currentPrice: number; recommendedPrice: number; product: { name: string } }) => (
            <Row key={p.id} left={p.product.name} right={`₹${p.currentPrice} → ₹${p.recommendedPrice}`} />
          ))}
          {(pricing ?? []).length === 0 && <Empty />}
        </Panel>
      )}

      {tab === 'opportunities' && (
        <Panel title="Growth Opportunities">
          {(opportunities?.recommendations ?? []).map((r: { id: string; title: string; description: string }) => (
            <div key={r.id} className="border-b py-2 text-sm last:border-0">
              <p className="font-medium">{r.title}</p>
              <p className="text-slate-500">{r.description}</p>
            </div>
          ))}
          {(opportunities?.recommendations ?? []).length === 0 && <Empty />}
        </Panel>
      )}

      {tab === 'hotspots' && (
        <Panel title="Demand Hotspots">
          {(opportunities?.hotspots ?? []).map((h: { id: string; city: string; locality: string; demandScore: number }) => (
            <Row key={h.id} left={`${h.locality}, ${h.city}`} right={`Score ${Math.round(h.demandScore)}`} />
          ))}
          {(opportunities?.hotspots ?? []).length === 0 && <Empty />}
        </Panel>
      )}
    </DashboardLayout>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between border-b py-2 text-sm last:border-0">
      <span>{left}</span>
      <span className="text-slate-500">{right}</span>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-slate-500">No data yet — forecasts run hourly.</p>;
}
