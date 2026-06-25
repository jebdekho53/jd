export type PipelineColumn =
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PACKING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type SlaLevel = 'green' | 'yellow' | 'red';

export const PIPELINE_COLUMNS: { id: PipelineColumn; label: string }[] = [
  { id: 'NEW', label: 'New' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'PREPARING', label: 'Preparing' },
  { id: 'PACKING', label: 'Packing' },
  { id: 'READY_FOR_PICKUP', label: 'Ready' },
  { id: 'RIDER_ASSIGNED', label: 'Rider Assigned' },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export const SLA_COLORS: Record<SlaLevel, string> = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  yellow: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
};
