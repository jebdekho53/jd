'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, MapPin, Search, Upload } from 'lucide-react';
import {
  exportMasterLocations,
  importMasterLocations,
  listMasterLocations,
  getMasterLocationFilters,
  getMasterLocationStats,
  setMasterLocationActive,
} from '@/services/admin-api';
import type { ListMasterLocationsParams } from '@/types/location-directory';
import { Badge, Button, Input } from '@/design-system';

export function MasterLocationsContent() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<ListMasterLocationsParams>({
    page: 1,
    limit: 50,
  });
  const [search, setSearch] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['admin', 'locations', 'stats'],
    queryFn: getMasterLocationStats,
  });

  const { data: filterOptions } = useQuery({
    queryKey: ['admin', 'locations', 'filters'],
    queryFn: getMasterLocationFilters,
  });

  const { data: list, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'locations', 'list', filters],
    queryFn: () => listMasterLocations(filters),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setMasterLocationActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'locations'] }),
  });

  const importMutation = useMutation({
    mutationFn: importMasterLocations,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'locations'] });
      if (fileRef.current) fileRef.current.value = '';
    },
  });

  const applySearch = () => {
    setFilters((f) => ({ ...f, q: search.trim() || undefined, page: 1 }));
  };

  const handleImport = async (file: File) => {
    const csv = await file.text();
    await importMutation.mutateAsync(csv);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Master Locations</h1>
          <p className="text-sm text-slate-500">
            Canonical pan-India address directory — pincodes, areas, aliases
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => exportMasterLocations()}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
            }}
          />
        </div>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {[
            ['States', stats.totals.states],
            ['Districts', stats.totals.districts],
            ['Cities', stats.totals.cities],
            ['Areas', stats.totals.areas],
            ['Pincodes', stats.totals.pincodes],
            ['Aliases', stats.totals.aliases],
            ['Active PINs', stats.totals.activePincodes],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-[200px] flex-1 gap-2">
            <Input
              placeholder="Search area, city, pincode, post office…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
            <Button onClick={applySearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={filters.districtId ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                districtId: e.target.value || undefined,
                cityId: undefined,
                page: 1,
              }))
            }
          >
            <option value="">All districts</option>
            {filterOptions?.districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={filters.cityId ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, cityId: e.target.value || undefined, page: 1 }))
            }
          >
            <option value="">All cities</option>
            {(filterOptions?.cities ?? [])
              .filter((c) => !filters.districtId || c.districtId === filters.districtId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <Input
            placeholder="Pincode prefix"
            className="w-32"
            maxLength={6}
            value={filters.pincode ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                pincode: e.target.value.replace(/\D/g, '').slice(0, 6) || undefined,
                page: 1,
              }))
            }
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading && <p className="p-6 text-sm text-slate-500">Loading locations…</p>}
        {isError && (
          <p className="p-6 text-sm text-red-600">
            Failed to load locations.{' '}
            <button type="button" className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </p>
        )}
        {!isLoading && list && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Pincode</th>
                    <th className="px-4 py-3">Post Office</th>
                    <th className="px-4 py-3">Area</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Coords</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.items.map((row) => (
                    <tr key={row.locationPincodeId ?? row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono">{row.pincode}</td>
                      <td className="px-4 py-3">{row.postOffice ?? row.label}</td>
                      <td className="px-4 py-3">{row.area ?? '—'}</td>
                      <td className="px-4 py-3">{row.city}</td>
                      <td className="px-4 py-3">{row.district}</td>
                      <td className="px-4 py-3">{row.state}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={row.isActive !== false ? 'success' : 'neutral'}>
                          {row.isActive !== false ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={toggleMutation.isPending}
                          onClick={() =>
                            toggleMutation.mutate({
                              id: row.locationPincodeId ?? row.id,
                              isActive: row.isActive === false,
                            })
                          }
                        >
                          {row.isActive !== false ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.items.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-12 text-slate-500">
                <MapPin className="h-8 w-8" />
                <p>No locations match your filters.</p>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-500">
                {list.total.toLocaleString()} pincodes · page {list.page}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={list.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={list.page * list.limit >= list.total}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {stats?.cityBreakdown && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Coverage by city</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.cityBreakdown.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{c.name}</span>
                <span className="text-slate-500">
                  {c._count.areas} areas · {c._count.pincodes} PINs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
