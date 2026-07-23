'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupportTicket, replySupportTicket } from '@/lib/api';
import { pretty } from '@/lib/rider-format';
import { Button, EmptyState, Panel } from '@/design-system/primitives';

export function SupportTicketDetail({ ticketId }: { ticketId: string }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const detail = useQuery({
    queryKey: ['rider', 'support', 'ticket', ticketId],
    queryFn: () => getSupportTicket(ticketId),
  });

  const sendReply = useMutation({
    mutationFn: () => replySupportTicket(ticketId, reply.trim()),
    onSuccess: async () => {
      setReply('');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['rider', 'support', 'ticket', ticketId] }),
        qc.invalidateQueries({ queryKey: ['rider', 'support', 'tickets'] }),
      ]);
    },
  });

  const ticket = detail.data;

  return (
    <div className="space-y-3">
      <Link href="/support" className="block text-sm font-bold text-rider-muted">
        ← Back to support
      </Link>
      {detail.isLoading ? (
        <p className="text-sm text-rider-muted">Loading ticket…</p>
      ) : detail.isError || !ticket ? (
        <EmptyState title="Ticket unavailable" body="This ticket could not be loaded." />
      ) : (
        <Panel title={ticket.ticketNumber}>
          <div className="space-y-3">
            <p className="font-bold text-rider-text">{ticket.subject}</p>
            <p className="text-sm text-rider-muted">{ticket.description}</p>
            <span className="inline-flex rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-rider-text">
              {pretty(ticket.status)}
            </span>
            <div className="space-y-2">
              {(ticket.messages ?? []).map((m) => (
                <p key={m.id} className="rounded-xl bg-rider-bg p-3 text-sm text-rider-text">
                  {m.body}
                </p>
              ))}
            </div>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to support"
              className="min-h-24 w-full rounded-xl border border-rider-border bg-rider-bg p-3 text-sm text-rider-text"
            />
            <Button onClick={() => sendReply.mutate()} disabled={sendReply.isPending || reply.trim().length === 0}>
              {sendReply.isPending ? 'Sending…' : 'Send reply'}
            </Button>
            {sendReply.isError && (
              <p className="text-sm text-rider-danger">{(sendReply.error as Error).message}</p>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
