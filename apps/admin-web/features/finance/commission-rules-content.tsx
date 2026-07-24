'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

type Scope = 'GLOBAL' | 'STORE' | 'CATEGORY' | 'CAMPAIGN';

interface CommissionRule {
  id: string;
  scope: Scope;
  storeId: string | null;
  storeName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  commissionPercent: number;
  settlementDelayDays: number;
  isActive: boolean;
}

interface RulesResponse {
  defaultCommissionPercent: number;
  rules: CommissionRule[];
}

interface StoreHit {
  id: string;
  name: string;
  slug: string;
  cityName: string | null;
}

interface CampaignHit {
  id: string;
  name: string;
  status: string;
}

interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  children: CategoryNode[];
}

const QK = ['admin', 'finance', 'commission-rules'];
const CATEGORY_QK = ['admin', 'categories', 'global-tree'];

async function fetchRules() {
  const res = await adminFetch<{ success: boolean; data: RulesResponse }>(
    '/api/admin/finance/commission-rules',
  );
  return res.data;
}

async function fetchCategoryTree() {
  const res = await adminFetch<{ success: boolean; data: CategoryNode[] }>(
    '/api/admin/categories',
  );
  return res.data;
}

/** Flatten the tree into id → { name, path, depth } so the table can show a full
 *  breadcrumb (L1 > L2 > L3) instead of an ambiguous leaf name. */
function flattenCategoryTree(nodes: CategoryNode[]): Map<string, { name: string; path: string[] }> {
  const map = new Map<string, { name: string; path: string[] }>();
  const walk = (list: CategoryNode[], trail: string[]) => {
    for (const node of list) {
      const path = [...trail, node.name];
      map.set(node.id, { name: node.name, path });
      if (node.children?.length) walk(node.children, path);
    }
  };
  walk(nodes, []);
  return map;
}

/** L1 → L2 → L3 cascading category picker. Categories are a shallow, bounded
 *  platform-wide tree, so cascading dropdowns beat a raw ID text field without
 *  needing a search/tree-view widget. */
function CategoryPicker({
  tree,
  value,
  onChange,
}: {
  tree: CategoryNode[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const [l1, setL1] = useState('');
  const [l2, setL2] = useState('');
  const [l3, setL3] = useState('');

  const l1Options = tree;
  const l2Options = useMemo(() => l1Options.find((n) => n.id === l1)?.children ?? [], [l1Options, l1]);
  const l3Options = useMemo(() => l2Options.find((n) => n.id === l2)?.children ?? [], [l2Options, l2]);

  useEffect(() => {
    const deepest = l3 || l2 || l1;
    if (deepest !== value) onChange(deepest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l1, l2, l3]);

  useEffect(() => {
    if (!value) {
      setL1('');
      setL2('');
      setL3('');
    }
  }, [value]);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <select
        className="w-full rounded-lg border px-2 py-1.5 text-sm"
        value={l1}
        onChange={(e) => {
          setL1(e.target.value);
          setL2('');
          setL3('');
        }}
      >
        <option value="">L1 category…</option>
        {l1Options.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </select>
      <select
        className="w-full rounded-lg border px-2 py-1.5 text-sm disabled:opacity-40"
        value={l2}
        disabled={!l1 || l2Options.length === 0}
        onChange={(e) => {
          setL2(e.target.value);
          setL3('');
        }}
      >
        <option value="">{l2Options.length ? 'L2 subcategory…' : 'No subcategories'}</option>
        {l2Options.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </select>
      <select
        className="w-full rounded-lg border px-2 py-1.5 text-sm disabled:opacity-40"
        value={l3}
        disabled={!l2 || l3Options.length === 0}
        onChange={(e) => setL3(e.target.value)}
      >
        <option value="">{l3Options.length ? 'L3 subcategory…' : 'No subcategories'}</option>
        {l3Options.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Debounced name search against a picker endpoint — replaces raw ID entry.
 *  Shared by the STORE and CAMPAIGN scope pickers below. */
function SearchPicker<T extends { id: string }>({
  value,
  valueName,
  searchPath,
  placeholder,
  noResultsLabel,
  renderHit,
  formatSelectedName,
  onChange,
}: {
  value: string;
  valueName: string | null;
  searchPath: string;
  placeholder: string;
  noResultsLabel: string;
  renderHit: (hit: T) => ReactNode;
  formatSelectedName: (hit: T) => string;
  onChange: (id: string, name: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await adminFetch<{ success: boolean; data: T[] }>(
        `${searchPath}?q=${encodeURIComponent(query.trim())}`,
      );
      setHits(res.data);
      setOpen(true);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchPath]);

  if (value && valueName) {
    return (
      <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm">
        <span className="truncate">{valueName}</span>
        <button
          type="button"
          className="ml-auto shrink-0 text-xs text-muted-foreground hover:underline"
          onClick={() => {
            onChange('', '');
            setQuery('');
          }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-lg border px-2 py-1.5 text-sm"
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && hits.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={() => {
                  onChange(hit.id, formatSelectedName(hit));
                  setOpen(false);
                }}
              >
                {renderHit(hit)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && hits.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground shadow-lg">
          {noResultsLabel}
        </div>
      )}
    </div>
  );
}

function StorePicker({
  value,
  valueName,
  onChange,
}: {
  value: string;
  valueName: string | null;
  onChange: (storeId: string, storeName: string) => void;
}) {
  return (
    <SearchPicker<StoreHit>
      value={value}
      valueName={valueName}
      searchPath="/api/admin/finance/commission-rules/store-search"
      placeholder="Search store by name…"
      noResultsLabel="No matching stores"
      formatSelectedName={(s) => (s.cityName ? `${s.name} (${s.cityName})` : s.name)}
      renderHit={(s) => (
        <>
          {s.name}
          {s.cityName ? <span className="text-muted-foreground"> · {s.cityName}</span> : null}
        </>
      )}
      onChange={onChange}
    />
  );
}

function CampaignPicker({
  value,
  valueName,
  onChange,
}: {
  value: string;
  valueName: string | null;
  onChange: (campaignId: string, campaignName: string) => void;
}) {
  return (
    <SearchPicker<CampaignHit>
      value={value}
      valueName={valueName}
      searchPath="/api/admin/finance/commission-rules/campaign-search"
      placeholder="Search campaign by name…"
      noResultsLabel="No matching campaigns"
      formatSelectedName={(c) => c.name}
      renderHit={(c) => (
        <>
          {c.name}
          <span className="text-muted-foreground"> · {c.status}</span>
        </>
      )}
      onChange={onChange}
    />
  );
}

export function CommissionRulesContent() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: QK, queryFn: fetchRules });
  const { data: categoryTree } = useQuery({ queryKey: CATEGORY_QK, queryFn: fetchCategoryTree });

  const categoryMap = useMemo(() => flattenCategoryTree(categoryTree ?? []), [categoryTree]);

  const [scope, setScope] = useState<Scope>('GLOBAL');
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [percent, setPercent] = useState('15');
  const [delay, setDelay] = useState('2');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: QK });

  async function createRule() {
    setError(null);
    if (scope === 'STORE' && !storeId) {
      setError('Pick a store');
      return;
    }
    if (scope === 'CATEGORY' && !categoryId) {
      setError('Pick a category');
      return;
    }
    if (scope === 'CAMPAIGN' && !campaignId) {
      setError('Pick a campaign');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        scope,
        commissionPercent: Number(percent),
        settlementDelayDays: Number(delay),
      };
      if (scope === 'STORE') body.storeId = storeId;
      if (scope === 'CATEGORY') body.categoryId = categoryId;
      if (scope === 'CAMPAIGN') body.campaignId = campaignId;
      const res = await adminFetch<{ success: boolean; message?: string }>(
        '/api/admin/finance/commission-rules',
        { method: 'POST', body: JSON.stringify(body) },
      );
      if (!res.success) throw new Error(res.message ?? 'Failed to create rule');
      setStoreId('');
      setStoreName(null);
      setCategoryId('');
      setCampaignId('');
      setCampaignName(null);
      setPercent('15');
      setDelay('2');
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function updateRule(id: string, patch: Partial<Pick<CommissionRule, 'commissionPercent' | 'isActive'>>) {
    await adminFetch(`/api/admin/finance/commission-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    await refresh();
  }

  async function deleteRule(id: string) {
    await adminFetch(`/api/admin/finance/commission-rules/${id}`, { method: 'DELETE' });
    await refresh();
  }

  function categoryLabel(rule: CommissionRule): string {
    if (rule.categoryId) {
      const hit = categoryMap.get(rule.categoryId);
      if (hit) return hit.path.join(' > ');
    }
    return rule.categoryName ?? '—';
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Platform default</h3>
          <span className="text-sm text-muted-foreground">
            Applied when no rule matches
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold">
          {data ? `${data.defaultCommissionPercent}%` : '—'}
        </p>
      </section>

      <section className="rounded-xl border p-4">
        <h3 className="mb-3 font-semibold">Add commission rule</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Priority: Store &gt; Category &gt; Global &gt; platform default. Use this to set a
          lower commission on thin-margin categories (e.g. staples, medicines) instead of one
          flat rate for everything.
        </p>
        <div className="grid gap-3 sm:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Scope</span>
            <select
              className="w-full rounded-lg border px-2 py-1.5"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as Scope);
                setStoreId('');
                setStoreName(null);
                setCategoryId('');
                setCampaignId('');
                setCampaignName(null);
                setError(null);
              }}
            >
              <option value="GLOBAL">Global</option>
              <option value="STORE">Store</option>
              <option value="CATEGORY">Category</option>
              <option value="CAMPAIGN">Campaign</option>
            </select>
          </label>

          {scope === 'STORE' && (
            <div className="text-sm sm:col-span-2">
              <span className="mb-1 block text-muted-foreground">Store</span>
              <StorePicker
                value={storeId}
                valueName={storeName}
                onChange={(id, name) => {
                  setStoreId(id);
                  setStoreName(name || null);
                }}
              />
            </div>
          )}

          {scope === 'CATEGORY' && (
            <div className="text-sm sm:col-span-2">
              <span className="mb-1 block text-muted-foreground">Category (L1 → L3)</span>
              <CategoryPicker tree={categoryTree ?? []} value={categoryId} onChange={setCategoryId} />
            </div>
          )}

          {scope === 'CAMPAIGN' && (
            <div className="text-sm sm:col-span-2">
              <span className="mb-1 block text-muted-foreground">Campaign</span>
              <CampaignPicker
                value={campaignId}
                valueName={campaignName}
                onChange={(id, name) => {
                  setCampaignId(id);
                  setCampaignName(name || null);
                }}
              />
            </div>
          )}

          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Commission %</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.5"
              className="w-full rounded-lg border px-2 py-1.5"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Settlement delay (days)</span>
            <input
              type="number"
              min={0}
              max={90}
              className="w-full rounded-lg border px-2 py-1.5"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          onClick={createRule}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add rule'}
        </button>
      </section>

      <section className="rounded-xl border p-4">
        <h3 className="mb-3 font-semibold">Active rules</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rules configured — all orders use the {data?.defaultCommissionPercent ?? 15}% default.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3">Scope</th>
                  <th className="py-2 pr-3">Target</th>
                  <th className="py-2 pr-3">Commission %</th>
                  <th className="py-2 pr-3">Delay</th>
                  <th className="py-2 pr-3">Active</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {data.rules.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{r.scope}</td>
                    <td className="py-2 pr-3">
                      {r.scope === 'CATEGORY'
                        ? categoryLabel(r)
                        : r.scope === 'CAMPAIGN'
                          ? (r.campaignName ?? '—')
                          : (r.storeName ?? (r.scope === 'GLOBAL' ? 'All stores' : '—'))}
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        defaultValue={r.commissionPercent}
                        className="w-20 rounded border px-2 py-1"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v !== r.commissionPercent) void updateRule(r.id, { commissionPercent: v });
                        }}
                      />
                    </td>
                    <td className="py-2 pr-3">{r.settlementDelayDays}d</td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => void updateRule(r.id, { isActive: !r.isActive })}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <button
                        onClick={() => void deleteRule(r.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
