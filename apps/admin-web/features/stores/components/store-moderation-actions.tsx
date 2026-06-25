'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Modal, useToast } from '@/design-system';
import { suspendStore, reinstateStore, deleteStore } from '@/services/admin-api';
import type { StoreStatus } from '@/types/store';

interface StoreModerationActionsProps {
  storeId: string;
  storeName: string;
  status: StoreStatus;
  onSuccess: () => void;
  onDeleted?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function StoreModerationActions({
  storeId,
  storeName,
  status,
  onSuccess,
  onDeleted,
  disabled = false,
  size = 'md',
}: StoreModerationActionsProps) {
  const { toast } = useToast();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const suspendMutation = useMutation({
    mutationFn: () => suspendStore(storeId, { reason: reason.trim() }),
    onSuccess: () => {
      toast('Store suspended', 'success');
      setSuspendOpen(false);
      setReason('');
      onSuccess();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const reinstateMutation = useMutation({
    mutationFn: () => reinstateStore(storeId),
    onSuccess: () => {
      toast('Store reinstated', 'success');
      onSuccess();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStore(storeId, { reason: reason.trim() }),
    onSuccess: () => {
      toast('Store deleted', 'success');
      setDeleteOpen(false);
      setReason('');
      setDeleteConfirm('');
      onDeleted?.();
      onSuccess();
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const pending =
    suspendMutation.isPending || reinstateMutation.isPending || deleteMutation.isPending || disabled;

  const handleReinstate = () => {
    if (!window.confirm(`Reinstate "${storeName}"? It will go live on the buyer app again.`)) return;
    reinstateMutation.mutate();
  };

  const reasonValid = reason.trim().length >= 10;
  const deleteConfirmed = deleteConfirm.trim().toLowerCase() === storeName.trim().toLowerCase();

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === 'APPROVED' && (
          <>
            <Button
              size={size}
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-50"
              onClick={() => setSuspendOpen(true)}
              disabled={pending}
            >
              Suspend store
            </Button>
            <Button
              size={size}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
              disabled={pending}
            >
              Delete store
            </Button>
          </>
        )}

        {status === 'SUSPENDED' && (
          <>
            <Button size={size} onClick={handleReinstate} loading={reinstateMutation.isPending} disabled={pending}>
              Reinstate store
            </Button>
            <Button
              size={size}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
              disabled={pending}
            >
              Delete store
            </Button>
          </>
        )}

        {(status === 'REJECTED' || status === 'DRAFT' || status === 'PENDING_REVIEW' || status === 'UNDER_REVIEW' || status === 'DOCUMENTS_REQUIRED') && (
          <Button
            size={size}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => setDeleteOpen(true)}
            disabled={pending}
          >
            Delete store
          </Button>
        )}
      </div>

      <Modal
        open={suspendOpen}
        onClose={() => {
          setSuspendOpen(false);
          setReason('');
        }}
        title="Suspend store"
        description={`"${storeName}" will be hidden from buyers. The merchant cannot accept new orders until reinstated.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
            <Button
              loading={suspendMutation.isPending}
              disabled={!reasonValid}
              onClick={() => suspendMutation.mutate()}
            >
              Suspend
            </Button>
          </div>
        }
      >
        <Input
          label="Reason (shown to merchant)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Minimum 10 characters — e.g. unresolved compliance issues"
        />
        <p className="mt-2 text-xs text-slate-500">{reason.trim().length}/10 characters minimum</p>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setReason('');
          setDeleteConfirm('');
        }}
        title="Delete store permanently"
        description={`This soft-deletes "${storeName}" and removes it from the buyer app. This cannot be undone from the admin panel.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="outline"
              className="border-red-600 bg-red-600 text-white hover:bg-red-700"
              loading={deleteMutation.isPending}
              disabled={!reasonValid || !deleteConfirmed}
              onClick={() => deleteMutation.mutate()}
            >
              Delete permanently
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Reason for deletion"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Minimum 10 characters"
          />
          <Input
            label={`Type store name to confirm: ${storeName}`}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={storeName}
          />
        </div>
      </Modal>
    </>
  );
}
