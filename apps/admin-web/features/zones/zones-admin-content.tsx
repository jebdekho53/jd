'use client';

import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listZones, setZoneActive, type AdminZone } from '@/services/admin-api';
import { Badge, Button, Input, Table, THead, TBody, Tr, Th, Td, Skeleton, useToast } from '@/design-system';

export function ZonesAdminContent() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: zones, isLoading } = useQuery({
    queryKey: ['admin', 'zones'],
    queryFn: listZones,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setZoneActive(id, isActive),
    onSuccess: (zone) => {
      qc.invalidateQueries({ queryKey: ['admin', 'zones'] });
      toast(`${zone.name} ${zone.isActive ? 'activated' : 'deactivated'}`, 'success');
    },
    onError: () => toast('Failed to update zone', 'error'),
  });

  const filtered = useMemo(() => {
    if (!zones) return [];
    const q = search.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) => z.name.toLowerCase().includes(q) || z.city.name.toLowerCase().includes(q),
    );
  }, [zones, search]);

  const autoCreatedCount = zones?.filter((z) => z.isAutoCreated).length ?? 0;
  const inactiveCount = zones?.filter((z) => !z.isActive).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <MapPin className="h-6 w-6" /> Delivery Zones
        </h1>
        <p className="text-sm text-slate-500">
          Every zone that stores attach to for rider assignment eligibility. A city with zero zones here means
          new stores there get one auto-created on creation, centered on the store.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total zones" value={String(zones?.length ?? 0)} />
        <Stat label="Auto-created" value={String(autoCreatedCount)} />
        <Stat label="Inactive" value={String(inactiveCount)} />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <Input
          placeholder="Search by zone name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <Table className="mt-4">
            <THead>
              <Tr>
                <Th>City</Th>
                <Th>Zone</Th>
                <Th>Radius</Th>
                <Th>Stores</Th>
                <Th>Riders</Th>
                <Th>Source</Th>
                <Th>Status</Th>
                <Th />
              </Tr>
            </THead>
            <TBody>
              {filtered.map((z) => (
                <ZoneRow key={z.id} zone={z} onToggle={(isActive) => toggleMutation.mutate({ id: z.id, isActive })} />
              ))}
              {filtered.length === 0 && (
                <Tr>
                  <Td colSpan={8} className="py-8 text-center text-slate-400">
                    No zones found.
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function ZoneRow({ zone, onToggle }: { zone: AdminZone; onToggle: (isActive: boolean) => void }) {
  return (
    <Tr>
      <Td>
        <p className="font-medium">{zone.city.name}</p>
        <p className="text-xs text-slate-400">{zone.city.state}</p>
      </Td>
      <Td>{zone.name}</Td>
      <Td>{zone.radiusKm} km</Td>
      <Td>{zone.storeCount}</Td>
      <Td>{zone.riderCount}</Td>
      <Td>
        {zone.isAutoCreated ? (
          <Badge tone="info">Auto-created</Badge>
        ) : (
          <Badge tone="neutral">Seeded</Badge>
        )}
      </Td>
      <Td>
        {zone.isActive ? (
          <Badge tone="success" dot>Active</Badge>
        ) : (
          <Badge tone="danger" dot>Inactive</Badge>
        )}
      </Td>
      <Td>
        <Button variant="outline" size="sm" onClick={() => onToggle(!zone.isActive)}>
          {zone.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </Td>
    </Tr>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
