'use client';

interface LogoutModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export function LogoutModal({ open, onCancel, onConfirm, isPending }: LogoutModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl">
        <h2 id="logout-title" className="text-lg font-bold text-jd-text-primary">
          Log out?
        </h2>
        <p className="mt-2 text-sm text-jd-text-muted">
          You will need to sign in again to access your orders and saved addresses.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-border/60 py-2.5 text-sm font-semibold text-jd-text-primary transition hover:bg-cream-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white transition hover:bg-destructive/90 disabled:opacity-60"
          >
            {isPending ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
