'use client';

import { useState } from 'react';
import { logout, registerRider, type VehicleType } from '@/lib/api';
import {
  RiderAgreementAcceptance,
  recordRiderAgreementAcceptance,
} from '@/features/auth/rider-agreement-acceptance';

const VEHICLES: { value: VehicleType; label: string }[] = [
  { value: 'MOTORCYCLE', label: '🏍️ Motorcycle' },
  { value: 'SCOOTER', label: '🛵 Scooter' },
  { value: 'BICYCLE', label: '🚲 Bicycle' },
  { value: 'CAR', label: '🚗 Car' },
  { value: 'WALK', label: '🚶 On foot' },
];

export function RiderSignup({
  phone,
  onDone,
  onSignOut,
}: {
  phone: string;
  onDone: () => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTORCYCLE');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError('Enter your full name');
      return;
    }
    if (!acceptedAgreement) {
      setError('Please accept the Delivery Partner Agreement to continue');
      return;
    }
    setBusy(true);
    try {
      await registerRider({
        name: name.trim(),
        vehicleType,
        vehicleNumber: vehicleNumber.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
      });
      await recordRiderAgreementAcceptance();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">JebDekho</p>
        <h1 className="mt-1 text-3xl font-bold">Become a rider</h1>
        <p className="mt-2 text-sm text-slate-400">
          Signed in as +91 {phone.replace(/\D/g, '').slice(-10)}. Fill in your details — our team
          verifies your KYC before you can start delivering.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="As per your ID"
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Vehicle</label>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVehicleType(v.value)}
                  className={`h-11 rounded-xl border text-sm font-medium ${
                    vehicleType === v.value
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                      : 'border-slate-700 bg-slate-900 text-slate-300'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {vehicleType !== 'WALK' && vehicleType !== 'BICYCLE' && (
            <>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Vehicle number</label>
                <input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="UP14 AB 1234"
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 uppercase outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Driving licence <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                  placeholder="DL-1420110012345"
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 uppercase outline-none"
                />
              </div>
            </>
          )}

          <RiderAgreementAcceptance
            checked={acceptedAgreement}
            onChange={(v) => {
              setAcceptedAgreement(v);
              if (v) setError(null);
            }}
            disabled={busy}
          />

          <button
            onClick={submit}
            disabled={busy}
            className="h-12 w-full rounded-xl bg-cyan-400 font-semibold text-slate-950 disabled:opacity-60"
          >
            {busy ? 'Submitting…' : 'Submit application'}
          </button>

          {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

          <button
            onClick={async () => {
              await logout().catch(() => {});
              onSignOut();
            }}
            className="w-full pt-2 text-sm text-slate-500"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
