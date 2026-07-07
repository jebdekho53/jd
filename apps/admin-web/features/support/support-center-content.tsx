'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';
import { Badge, Button, Input, Modal } from '@/design-system';
import {
  Search,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Eye,
  Send,
  Calendar,
  AlertCircle,
} from 'lucide-react';

type Tab =
  | 'all'
  | 'open'
  | 'escalated'
  | 'high'
  | 'refund'
  | 'finance'
  | 'merchant'
  | 'rider';

const TABS: { id: Tab; label: string; path: string }[] = [
  { id: 'all', label: 'All Tickets', path: '/api/admin/support-center/tickets' },
  { id: 'open', label: 'Open', path: '/api/admin/support-center/tickets/open' },
  { id: 'escalated', label: 'Escalated', path: '/api/admin/support-center/tickets/escalated' },
  { id: 'high', label: 'High Priority', path: '/api/admin/support-center/tickets/high-priority' },
  { id: 'refund', label: 'Refund Related', path: '/api/admin/support-center/tickets/refund-related' },
  { id: 'finance', label: 'Finance Related', path: '/api/admin/support-center/tickets/finance-related' },
  { id: 'merchant', label: 'Merchant Related', path: '/api/admin/support-center/tickets/merchant-related' },
  { id: 'rider', label: 'Rider Related', path: '/api/admin/support-center/tickets/rider-related' },
];

export function SupportCenterContent() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Detail Dialogs
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveSummary, setResolveSummary] = useState('');
  const [refundApproved, setRefundApproved] = useState(false);

  // Reply Input
  const [replyBody, setReplyBody] = useState('');
  const [replyVisibility, setReplyVisibility] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');

  const activeTab = TABS.find((t) => t.id === tab)!;

  const { data: overview, refetch: refetchOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'support', 'overview'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: OverviewData }>(
        '/api/admin/support-center/overview',
      );
      return res.data;
    },
  });

  const { data: tickets, refetch: refetchTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin', 'support', 'tickets', tab],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: TicketListData }>(activeTab.path);
      return res.data;
    },
  });

  const { data: detailData, refetch: refetchDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'support', 'ticket-detail', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const res = await adminFetch<{
        success: boolean;
        data: { ticket: TicketDetail; customerTimeline: { events: TimelineEvent[] } };
      }>(`/api/admin/support-center/tickets/${selectedTicketId}`);
      return res.data;
    },
    enabled: !!selectedTicketId,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, body, visibility }: { ticketId: string; body: string; visibility: string }) => {
      return adminFetch(`/api/admin/support-center/tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body, visibility }),
      });
    },
    onSuccess: () => {
      setReplyBody('');
      refetchDetail();
      refetchTickets();
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ ticketId, summary, refundApproved }: { ticketId: string; summary: string; refundApproved: boolean }) => {
      return adminFetch(`/api/admin/support-center/tickets/${ticketId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ summary, refundApproved }),
      });
    },
    onSuccess: () => {
      setResolveOpen(false);
      setResolveSummary('');
      setRefundApproved(false);
      refetchDetail();
      refetchTickets();
      refetchOverview();
    },
  });

  const refreshAll = () => {
    refetchOverview();
    refetchTickets();
    if (selectedTicketId) refetchDetail();
  };

  // Client-side search matching
  const filteredTickets = (tickets?.items ?? []).filter((t) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      t.ticketNumber.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      t.actorType.toLowerCase().includes(query) ||
      (t.requester?.phone && t.requester.phone.toLowerCase().includes(query)) ||
      (t.requester?.email && t.requester.email.toLowerCase().includes(query)) ||
      (t.orderId && t.orderId.toLowerCase().includes(query))
    );
  });

  const selectedTicket = detailData?.ticket;
  const timelineEvents = detailData?.customerTimeline?.events ?? [];

  const handleSendReply = () => {
    if (!selectedTicketId || !replyBody.trim()) return;
    replyMutation.mutate({
      ticketId: selectedTicketId,
      body: replyBody,
      visibility: replyVisibility,
    });
  };

  const handleResolve = () => {
    if (!selectedTicketId || !resolveSummary.trim()) return;
    resolveMutation.mutate({
      ticketId: selectedTicketId,
      summary: resolveSummary,
      refundApproved,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Overview Dashboard</h2>
        <Button variant="outline" size="sm" onClick={refreshAll} disabled={overviewLoading || ticketsLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${overviewLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open Tickets"
          value={overview?.ticketsOpen ?? 0}
          icon={MessageSquare}
          tone="info"
        />
        <StatCard
          label="SLA Compliance"
          value={`${overview?.slaCompliancePct ?? 0}%`}
          icon={Clock}
          tone={Number(overview?.slaCompliancePct ?? 0) < 85 ? 'warning' : 'success'}
        />
        <StatCard
          label="Avg Resolution Time"
          value={overview?.averageResolutionHours != null ? `${overview.averageResolutionHours} hrs` : '—'}
          icon={CheckCircle2}
          tone="neutral"
        />
        <StatCard
          label="Resolved (30d)"
          value={overview?.ticketsResolved ?? 0}
          icon={Calendar}
          tone="success"
        />
      </div>

      {/* Main interface split layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Tickets List */}
        <div className={`space-y-4 lg:col-span-7 ${selectedTicketId ? 'hidden lg:block' : 'lg:col-span-12'}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id);
                    setSelectedTicketId(null);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    tab === t.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search ticket, order, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-left text-xs uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Ticket ID</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Actor / Contact</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${
                        selectedTicketId === t.id ? 'bg-slate-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                        {t.ticketNumber}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate font-medium text-slate-700">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-slate-800 text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded-md mr-1.5">
                          {t.actorType.toLowerCase()}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {t.requester?.phone || t.requester?.email || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={getPriorityTone(t.priority)}>{t.priority}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={getStatusTone(t.status)}>{t.status}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        {t.assignedTeam ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        {ticketsLoading ? 'Loading tickets...' : 'No tickets in this view'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Ticket Detail Pane */}
        {selectedTicketId && (
          <div className="space-y-6 lg:col-span-5">
            {detailLoading ? (
              <div className="flex h-64 items-center justify-center rounded-xl border bg-white shadow-sm">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-admin-600 border-t-transparent" />
              </div>
            ) : selectedTicket ? (
              <div className="space-y-6">
                {/* Detail Header & Info Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        SUPPORT TICKET
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{selectedTicket.ticketNumber}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTicketId(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Status</span>
                      <div className="mt-1">
                        <Badge tone={getStatusTone(selectedTicket.status)}>{selectedTicket.status}</Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Priority</span>
                      <div className="mt-1">
                        <Badge tone={getPriorityTone(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Assigned Team</span>
                      <p className="mt-1 font-semibold text-slate-700">{selectedTicket.assignedTeam ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Category</span>
                      <p className="mt-1 font-semibold text-slate-700">{selectedTicket.category?.name ?? '—'}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3 text-xs space-y-2">
                    {selectedTicket.orderId && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Linked Order</span>
                        <span className="font-mono font-semibold text-slate-800">{selectedTicket.orderId}</span>
                      </div>
                    )}
                    {selectedTicket.paymentId && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Payment ID</span>
                        <span className="font-mono font-semibold text-slate-800">{selectedTicket.paymentId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Customer User ID</span>
                      <span className="font-mono text-slate-800">{selectedTicket.requesterUserId}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' ? (
                      <>
                        <Button size="sm" onClick={() => setResolveOpen(true)}>
                          Resolve Ticket
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          title="Backend action not available yet"
                          className="opacity-50 cursor-not-allowed"
                        >
                          Escalate
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg w-full">
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Ticket is Resolved
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      title="Backend action not available yet"
                      className="opacity-50 cursor-not-allowed"
                    >
                      Assign Agent
                    </Button>
                  </div>
                </div>

                {/* Messages & Notes thread */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">Conversation Thread</h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {(selectedTicket.messages ?? []).map((m) => {
                      const isCustomer = m.authorId === selectedTicket.requesterUserId;
                      const isInternal = m.visibility === 'INTERNAL';
                      return (
                        <div
                          key={m.id}
                          className={`rounded-xl p-3 text-xs ${
                            isInternal
                              ? 'bg-amber-50 border border-amber-200'
                              : isCustomer
                              ? 'bg-slate-50 border border-slate-100'
                              : 'bg-indigo-50/60 border border-indigo-100'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b pb-1.5 mb-1.5 border-slate-200/50">
                            <span className="font-semibold text-slate-700 flex items-center">
                              {isCustomer ? (
                                <>
                                  <User className="h-3 w-3 mr-1 text-slate-500" />
                                  Customer
                                </>
                              ) : (
                                <>
                                  <Shield className="h-3 w-3 mr-1 text-admin-600" />
                                  Staff / Admin
                                </>
                              )}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                              {isInternal && (
                                <Badge tone="warning" className="px-1.5 py-0">
                                  Internal Note
                                </Badge>
                              )}
                              <span>{new Date(m.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-slate-600 leading-relaxed break-words">{m.body}</p>
                        </div>
                      );
                    })}
                    {(selectedTicket.messages ?? []).length === 0 && (
                      <p className="text-center text-slate-400 text-xs py-4">No messages yet.</p>
                    )}
                  </div>

                  {/* Reply Input Area */}
                  {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyVisibility('PUBLIC')}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                            replyVisibility === 'PUBLIC'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Public Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyVisibility('INTERNAL')}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                            replyVisibility === 'INTERNAL'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Internal Note
                        </button>
                      </div>

                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder={
                          replyVisibility === 'INTERNAL'
                            ? 'Add a private note only staff can see...'
                            : 'Reply directly to the customer...'
                        }
                        className="w-full text-xs rounded-xl border border-slate-200 p-3 outline-none focus:ring-1 focus:ring-slate-900 h-20 resize-none"
                      />

                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={handleSendReply}
                          disabled={replyMutation.isPending || !replyBody.trim()}
                        >
                          <Send className="h-3 w-3 mr-1.5" />
                          Send Update
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 360 Customer Timeline Events */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">Customer 360 Timeline</h4>
                  <div className="max-h-[220px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {timelineEvents.map((ev) => (
                      <div key={ev.id + ev.type} className="flex gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-1.5 text-white ${getTimelineColor(ev.type)}`}>
                            {getTimelineIcon(ev.type)}
                          </div>
                          <div className="w-0.5 bg-slate-200 flex-1 my-1" />
                        </div>
                        <div className="pb-3 flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-700">{ev.label}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ev.at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-0.5">{ev.detail}</p>
                          {ev.amount != null && (
                            <span className="inline-block mt-1 font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              ₹{ev.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {timelineEvents.length === 0 && (
                      <p className="text-center text-slate-400 text-xs py-4">
                        No history timeline available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Resolve Ticket Modal */}
      <Modal open={resolveOpen} onClose={() => setResolveOpen(false)} title="Resolve Ticket">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Please provide a summary of the resolution for this ticket. This summary will be saved to the database.
          </p>

          <textarea
            value={resolveSummary}
            onChange={(e) => setResolveSummary(e.target.value)}
            placeholder="Summary of resolution..."
            className="w-full text-xs rounded-xl border border-slate-200 p-3 outline-none focus:ring-1 focus:ring-slate-900 h-24 resize-none"
          />

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={refundApproved}
              onChange={(e) => setRefundApproved(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            Refund Approved / Disputed Settlement Resolved
          </label>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleResolve} disabled={resolveMutation.isPending || !resolveSummary.trim()}>
              Confirm Resolution
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const borderColors = {
    neutral: 'border-slate-200',
    success: 'border-emerald-200',
    warning: 'border-amber-200',
    danger: 'border-red-200',
    info: 'border-sky-200',
  };
  const iconColors = {
    neutral: 'text-slate-500 bg-slate-50',
    success: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    danger: 'text-red-600 bg-red-50',
    info: 'text-sky-600 bg-sky-50',
  };

  return (
    <div className={`rounded-xl border p-4 bg-white shadow-sm flex items-center gap-4 ${borderColors[tone]}`}>
      <div className={`rounded-lg p-2.5 ${iconColors[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function getPriorityTone(priority: string) {
  const p = priority.toUpperCase();
  if (p === 'HIGH' || p === 'CRITICAL') return 'danger';
  if (p === 'MEDIUM') return 'warning';
  return 'info';
}

function getStatusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'RESOLVED' || s === 'CLOSED') return 'success';
  if (s === 'ESCALATED') return 'danger';
  if (s === 'IN_PROGRESS' || s === 'PENDING') return 'warning';
  return 'neutral';
}

function getTimelineColor(type: string) {
  if (type === 'order') return 'bg-sky-600';
  if (type === 'wallet') return 'bg-amber-600';
  if (type === 'support') return 'bg-purple-600';
  if (type === 'fraud') return 'bg-red-600';
  return 'bg-emerald-600';
}

function getTimelineIcon(type: string) {
  if (type === 'order') return <Eye className="h-3 w-3" />;
  if (type === 'wallet') return <Clock className="h-3 w-3" />;
  if (type === 'support') return <MessageSquare className="h-3 w-3" />;
  if (type === 'fraud') return <AlertCircle className="h-3 w-3" />;
  return <CheckCircle2 className="h-3 w-3" />;
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

interface OverviewData {
  ticketsCreated: number;
  ticketsResolved: number;
  ticketsOpen: number;
  averageResolutionHours: number;
  slaCompliancePct: number;
  csatScore: number | null;
  agentAssignments: number;
}

interface TicketListData {
  items: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    actorType: string;
    priority: string;
    status: string;
    assignedTeam: string | null;
    createdAt: string;
    orderId?: string | null;
    requester?: {
      id: string;
      phone: string;
      email: string;
    } | null;
  }>;
  total: number;
}

interface TimelineEvent {
  type: 'order' | 'wallet' | 'support' | 'fraud' | 'refund';
  id: string;
  label: string;
  detail: string;
  status?: string;
  amount?: number;
  at: string;
}

interface TicketDetail {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  actorType: string;
  priority: string;
  status: string;
  assignedTeam: string | null;
  createdAt: string;
  orderId?: string | null;
  paymentId?: string | null;
  requesterUserId: string;
  category?: {
    name: string;
    code: string;
  } | null;
  messages: Array<{
    id: string;
    authorId: string;
    body: string;
    visibility: 'PUBLIC' | 'INTERNAL';
    createdAt: string;
  }>;
}
