'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, ShoppingBag, Star, Timer, TrendingUp } from 'lucide-react';
import { Button, Card, CardBody, Spinner } from '@/design-system/primitives';
import { MetricCard } from '@/components/dashboard/dashboard-widgets';
import { fetchRestaurantDashboard } from '@/services/restaurant/menu-api';

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function RestaurantDashboardContent({ storeId }: { storeId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'restaurant-dashboard', storeId],
    queryFn: () => fetchRestaurantDashboard(storeId),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  const queue = data?.kitchenQueue;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Restaurant Dashboard</h1>
          <p className="text-sm text-slate-500">Today&apos;s food orders, revenue, and kitchen snapshot.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/stores/${storeId}/kitchen`}>
            <Button size="sm">Open kitchen display</Button>
          </Link>
          <Link href={`/stores/${storeId}/menu`}>
            <Button variant="secondary" size="sm">Manage menu</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today's orders" value={String(data?.todayOrders ?? 0)} icon={ShoppingBag} />
        <MetricCard label="Revenue today" value={formatInr(data?.revenue ?? 0)} icon={IndianRupee} />
        <MetricCard label="Acceptance rate" value={`${data?.acceptanceRate ?? 100}%`} icon={TrendingUp} />
        <MetricCard label="Avg prep time" value={`${data?.avgPrepTimeMins ?? '—'} min`} icon={Timer} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <Star className="h-4 w-4 text-amber-500" /> Popular dishes today
            </h2>
            {(data?.popularDishes ?? []).length ? (
              <ul className="space-y-2">
                {data!.popularDishes.map((d, i) => (
                  <li key={d.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      <span className="mr-2 font-mono text-xs text-slate-400">#{i + 1}</span>
                      {d.name}
                    </span>
                    <span className="font-medium text-slate-900">{d.quantity} sold</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No dish sales recorded today yet.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-4 font-semibold text-slate-900">Kitchen queue snapshot</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'New', count: queue?.new.length ?? 0 },
                { label: 'Preparing', count: queue?.preparing.length ?? 0 },
                { label: 'Ready', count: queue?.ready.length ?? 0 },
                { label: 'Completed', count: queue?.completed ?? 0 },
              ].map((q) => (
                <div key={q.label} className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-xs font-medium uppercase text-slate-500">{q.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{q.count}</p>
                </div>
              ))}
            </div>
            {(data?.cancelledOrders ?? 0) > 0 && (
              <p className="mt-4 text-sm text-red-600">{data!.cancelledOrders} cancelled orders today</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
