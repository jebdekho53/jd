'use client';

import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardBody, Skeleton } from '@/design-system/primitives';
import { useStoresQuery } from '@/hooks/use-stores';
import { useOrdersQuery } from '@/hooks/use-orders';
import { useProductsQuery } from '@/hooks/use-products';
import { useStoreStore } from '@/store/store-store';

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  href?: string;
}) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardBody className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-12" />
          ) : (
            <p className="text-xl font-bold text-slate-900">{value}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function DashboardOverviewContent() {
  const { currentStore } = useStoreStore();
  const { data: storeData, isLoading: loadingStores } = useStoresQuery();
  const { data: ordersData, isLoading: loadingOrders } = useOrdersQuery({
    storeId: currentStore?.id,
    status: 'PAID',
  });
  const { data: productsData, isLoading: loadingProducts } = useProductsQuery(
    currentStore?.id ?? '',
  );

  const stores = storeData?.data ?? [];
  const newOrders = ordersData?.orders?.length ?? 0;
  const products = productsData?.data ?? [];
  const lowStock = products.filter((p) => {
    const v = p.variants.find((v) => v.isDefault) ?? p.variants[0];
    const t = v?.inventory?.lowStockThreshold;
    return t !== undefined && t !== null && (v?.inventory?.availableQty ?? 0) <= t;
  }).length;

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-base font-semibold text-slate-700">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="My Stores"
              value={stores.length}
              icon={Store}
              loading={loadingStores}
              href="/stores"
            />
            <StatCard
              label="New Orders"
              value={newOrders}
              icon={ShoppingBag}
              loading={loadingOrders}
              href="/orders"
            />
            <StatCard
              label="Products"
              value={products.length}
              icon={Package}
              loading={loadingProducts}
              href="/products"
            />
            <StatCard
              label="Low Stock Alerts"
              value={lowStock}
              icon={AlertTriangle}
              loading={loadingProducts}
              href="/inventory"
            />
          </div>
        </div>

        {stores.some((s) => s.status === 'PENDING_REVIEW') && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Store under review:</strong> Your store submission is being evaluated by our team. Typically 24–48 hours.
          </div>
        )}

        {stores.some((s) => s.status === 'REJECTED') && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <strong>Store rejected:</strong> At least one store was rejected. Please review the feedback and resubmit.{' '}
            <Link href="/stores" className="underline">View stores</Link>
          </div>
        )}

        {newOrders > 0 && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            <strong>{newOrders} new order{newOrders > 1 ? 's' : ''}</strong> waiting for your confirmation.{' '}
            <Link href="/orders?status=PAID" className="underline font-medium">Accept now</Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
