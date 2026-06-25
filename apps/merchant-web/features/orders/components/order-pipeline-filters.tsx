'use client';

import { Input, Select } from '@/design-system/primitives';
import type { ListOrdersParams } from '@/types/order';
import type { PipelineColumn } from '@/lib/order-pipeline';

export type DatePreset = 'today' | 'yesterday' | 'range' | 'all';

export interface PipelineFilters {
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  pipelineColumn: PipelineColumn | '';
  paymentMethod: '' | 'COD' | 'RAZORPAY';
  search: string;
}

interface Props {
  filters: PipelineFilters;
  onChange: (filters: PipelineFilters) => void;
}

export function filtersToParams(filters: PipelineFilters, storeId?: string): ListOrdersParams {
  const params: ListOrdersParams = { storeId, limit: 100 };
  if (filters.datePreset === 'today') params.today = true;
  if (filters.datePreset === 'yesterday') params.yesterday = true;
  if (filters.datePreset === 'range') {
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
  }
  if (filters.pipelineColumn) params.pipelineColumn = filters.pipelineColumn;
  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
  if (filters.search.trim()) params.q = filters.search.trim();
  return params;
}

export function OrderPipelineFilters({ filters, onChange }: Props) {
  const set = (patch: Partial<PipelineFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-4 py-3">
      <div>
        <label className="mb-1 block text-xs text-slate-500">Date</label>
        <Select
          value={filters.datePreset}
          onChange={(e) => set({ datePreset: e.target.value as DatePreset })}
          className="w-36"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="range">Date range</option>
          <option value="all">All time</option>
        </Select>
      </div>
      {filters.datePreset === 'range' && (
        <>
          <div>
            <label className="mb-1 block text-xs text-slate-500">From</label>
            <Input type="date" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">To</label>
            <Input type="date" value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} />
          </div>
        </>
      )}
      <div>
        <label className="mb-1 block text-xs text-slate-500">Status</label>
        <Select
          value={filters.pipelineColumn}
          onChange={(e) => set({ pipelineColumn: e.target.value as PipelineColumn | '' })}
          className="w-44"
        >
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PREPARING">Preparing</option>
          <option value="PACKING">Packing</option>
          <option value="READY_FOR_PICKUP">Ready for pickup</option>
          <option value="RIDER_ASSIGNED">Rider assigned</option>
          <option value="OUT_FOR_DELIVERY">Out for delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Payment</label>
        <Select
          value={filters.paymentMethod}
          onChange={(e) => set({ paymentMethod: e.target.value as PipelineFilters['paymentMethod'] })}
          className="w-32"
        >
          <option value="">All</option>
          <option value="COD">COD</option>
          <option value="RAZORPAY">Online</option>
        </Select>
      </div>
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs text-slate-500">Search</label>
        <Input
          placeholder="Order ID, customer, phone, product, SKU…"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
        />
      </div>
    </div>
  );
}
