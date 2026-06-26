'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, FileText, RefreshCw, Wallet } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { Chip, Spinner } from '@/design-system/primitives';
import { formatCurrency, cn } from '@/lib/utils';

async function fetchCorp(path: string) {
  const res = await fetch(`/api/corporate/${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

type CorpInvoice = { id: string; invoiceNumber: string; invoiceAmount: number };

export function CorporatePortalContent() {
  const {
    data: accounts,
    isLoading: accountsLoading,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useQuery({ queryKey: ['corporate', 'accounts'], queryFn: () => fetchCorp('accounts') });
  const {
    data: wallet,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useQuery({ queryKey: ['corporate', 'wallet'], queryFn: () => fetchCorp('wallet') });
  const {
    data: invoices,
    isLoading: invoicesLoading,
    isError: invoicesError,
    refetch: refetchInvoices,
    isFetching,
  } = useQuery({ queryKey: ['corporate', 'invoices'], queryFn: () => fetchCorp('invoices') });

  const isLoading = accountsLoading || walletLoading || invoicesLoading;
  const hasError = accountsError || walletError || invoicesError;

  function refreshAll() {
    void refetchAccounts();
    void refetchWallet();
    void refetchInvoices();
  }

  return (
    <AuthGuard>
      <PageShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">Corporate Commerce</h1>
              <p className="mt-1 text-sm text-jd-text-muted">Manage business accounts, wallet & invoices</p>
            </div>
            <Chip
              size="sm"
              leadingIcon={<RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} aria-hidden />}
              onClick={refreshAll}
            >
              Refresh
            </Chip>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner label="Loading corporate portal" />
            </div>
          )}

          {hasError && !isLoading && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-jd-text-muted">Could not load corporate data.</p>
              <button
                type="button"
                onClick={refreshAll}
                className="mt-3 text-sm font-semibold text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !hasError && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-card">
                  <div className="flex items-center gap-2 text-sm text-jd-text-muted">
                    <Wallet className="h-4 w-4 text-primary" aria-hidden />
                    Wallet balance
                  </div>
                  <p className="mt-2 text-3xl font-bold text-jd-text-primary">
                    {formatCurrency(wallet?.balance ?? 0)}
                  </p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center gap-2 text-sm text-jd-text-muted">
                    <Building2 className="h-4 w-4 text-primary" aria-hidden />
                    Linked accounts
                  </div>
                  <p className="mt-2 text-3xl font-bold text-jd-text-primary">{(accounts ?? []).length}</p>
                </div>
              </div>

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-jd-text-primary">
                  <FileText className="h-4 w-4 text-primary" aria-hidden />
                  Invoices
                </h2>
                {(invoices ?? []).length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-jd-text-muted">
                    No invoices yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                    {(invoices as CorpInvoice[]).map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-3 px-4 py-3.5"
                      >
                        <span className="text-sm font-medium text-jd-text-primary">{inv.invoiceNumber}</span>
                        <span className="text-sm font-bold tabular-nums text-jd-text-primary">
                          {formatCurrency(Number(inv.invoiceAmount))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
