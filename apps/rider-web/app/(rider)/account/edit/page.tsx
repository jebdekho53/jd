'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { getMe, updateRiderProfile, type VehicleType } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';
import { Button } from '@/design-system/primitives';

const VEHICLES: { value: VehicleType; label: string }[] = [
  { value: 'MOTORCYCLE', label: '🏍️ Motorcycle' },
  { value: 'SCOOTER', label: '🛵 Scooter' },
  { value: 'BICYCLE', label: '🚲 Bicycle' },
  { value: 'CAR', label: '🚗 Car' },
  { value: 'WALK', label: '🚶 On foot' },
];

const INPUT =
  'w-full rounded-xl border border-rider-border bg-rider-bg px-3 py-2.5 text-sm text-rider-text placeholder:text-rider-muted focus:border-rider-accent focus:outline-none';

export default function AccountEditPage() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe });
  const profile = me.data?.profile ?? null;

  const [form, setForm] = useState({
    name: '',
    vehicleType: 'MOTORCYCLE' as VehicleType,
    vehicleNumber: '',
    licenseNumber: '',
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Seed once from the server, then stop — otherwise a background refetch would
  // wipe whatever the rider is halfway through typing.
  useEffect(() => {
    if (!profile || dirty) return;
    setForm({
      name: profile.name,
      vehicleType: profile.vehicleType,
      vehicleNumber: profile.vehicleNumber ?? '',
      licenseNumber: profile.licenseNumber ?? '',
    });
  }, [profile, dirty]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setDirty(true);
    setSaved(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = useMutation({
    mutationFn: () =>
      updateRiderProfile({
        name: form.name.trim(),
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber.trim(),
        licenseNumber: form.licenseNumber.trim(),
      }),
    onSuccess: (data) => {
      setDirty(false);
      setError(null);
      setSaved(
        data.vehicleChanged
          ? 'Saved. You changed your vehicle details — re-upload the matching RC or licence on the KYC screen so compliance can re-verify them.'
          : 'Saved.',
      );
      qc.invalidateQueries({ queryKey: ['rider', 'me'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not save your details'),
  });

  const licenseRequired = form.vehicleType !== 'WALK' && form.vehicleType !== 'BICYCLE';

  const submit = () => {
    if (form.name.trim().length < 2) {
      setError('Enter your full name');
      return;
    }
    if (licenseRequired && form.licenseNumber.trim().length === 0) {
      setError('Driving licence number is required for this vehicle type');
      return;
    }
    setError(null);
    save.mutate();
  };

  return (
    <CaptainPageShell title="Edit profile" subtitle="Your name and vehicle details.">
      <Panel title="Name">
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Full name"
          className={INPUT}
        />
        <p className="mt-2 text-xs text-rider-muted">
          Use the name on your ID proof. Customers see your first name on an active delivery.
        </p>
      </Panel>

      <Panel title="Vehicle">
        <div className="grid grid-cols-2 gap-2">
          {VEHICLES.map((vehicle) => (
            <button
              key={vehicle.value}
              onClick={() => set('vehicleType', vehicle.value)}
              className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                form.vehicleType === vehicle.value
                  ? 'bg-rider-accent text-rider-accent-foreground'
                  : 'bg-white/5 text-rider-text'
              }`}
            >
              {vehicle.label}
            </button>
          ))}
        </div>
        <input
          value={form.vehicleNumber}
          onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())}
          placeholder="Vehicle number (optional)"
          className={`${INPUT} mt-3`}
        />
        <input
          value={form.licenseNumber}
          onChange={(e) => set('licenseNumber', e.target.value.toUpperCase())}
          placeholder={licenseRequired ? 'Driving licence number (required)' : 'Driving licence number (optional)'}
          className={`${INPUT} mt-2`}
        />
        <p className="mt-2 text-xs text-rider-muted">
          Changing these does not take you offline, but your uploaded RC and licence must still
          match — update them on{' '}
          <Link href="/kyc" className="text-rider-accent underline">
            the KYC screen
          </Link>{' '}
          if they no longer do.
        </p>
      </Panel>

      <Panel title="Mobile number">
        <p className="text-sm text-rider-text">{me.data?.user.phone ?? '—'}</p>
        <p className="mt-2 text-xs text-rider-muted">
          Your mobile number is your login and cannot be changed here. Raise a support ticket to
          change it.
        </p>
      </Panel>

      {saved && <p className="rounded-xl bg-rider-online/10 p-3 text-sm text-rider-online">{saved}</p>}
      {error && <p className="rounded-xl bg-rider-danger/10 p-3 text-sm text-rider-danger">{error}</p>}

      <Button onClick={submit} disabled={save.isPending || !dirty}>
        {save.isPending ? 'Saving…' : dirty ? 'Save changes' : 'No changes to save'}
      </Button>
    </CaptainPageShell>
  );
}
