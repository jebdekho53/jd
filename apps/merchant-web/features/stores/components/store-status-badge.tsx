import { Badge } from '@/design-system/primitives';
import type { BadgeProps } from '@/design-system/primitives';
import type { StoreStatus } from '@/types/store';

const STATUS_MAP: Record<StoreStatus, { tone: BadgeProps['tone']; label: string }> = {
  DRAFT: { tone: 'neutral', label: 'Draft' },
  PENDING_REVIEW: { tone: 'warning', label: 'Pending Review' },
  DOCUMENTS_REQUIRED: { tone: 'warning', label: 'Documents Required' },
  UNDER_REVIEW: { tone: 'warning', label: 'Under Review' },
  APPROVED: { tone: 'success', label: 'Approved' },
  REJECTED: { tone: 'danger', label: 'Rejected' },
  SUSPENDED: { tone: 'danger', label: 'Suspended' },
};

export function StoreStatusBadge({ status }: { status: StoreStatus }) {
  const { tone, label } = STATUS_MAP[status] ?? { tone: 'neutral', label: status };
  return <Badge tone={tone} dot>{label}</Badge>;
}
