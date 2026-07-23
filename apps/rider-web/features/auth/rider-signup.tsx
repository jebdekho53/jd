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
  const [referralCode, setReferralCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);
  const licenseRequired = vehicleType !== 'WALK' && vehicleType !== 'BICYCLE';

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError('Enter your full name');
      return;
    }
    if (licenseRequired && licenseNumber.trim().length === 0) {
      setError('Driving licence number is required for this vehicle type');
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
        referralCode: referralCode.trim() || undefined,
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
    <main className="min-h-screen bg-rider-bg px-6 py-10 text-rider-text">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-rider-accent">JebDekho</p>
        <h1 className="mt-1 text-3xl font-black">Become a rider</h1>
        <p className="mt-2 text-sm text-rider-muted">
          Signed in as +91 {phone.replace(/\D/g, '').slice(-10)}. Fill in your details — our team
          verifies your KYC before you can start delivering.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-rider-muted">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="As per your ID"
              className="h-12 w-full rounded-xl border border-rider-border bg-rider-surface px-3 text-rider-text outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-rider-muted">Vehicle</label>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVehicleType(v.value)}
                  className={`h-11 rounded-xl border text-sm font-semibold ${
                    vehicleType === v.value
                      ? 'border-rider-accent bg-rider-accent/10 text-rider-accent'
                      : 'border-rider-border bg-rider-surface text-rider-muted'
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
                <label className="mb-1 block text-sm text-rider-muted">Vehicle number</label>
                <input
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="UP14 AB 1234"
                  className="h-12 w-full rounded-xl border border-rider-border bg-rider-surface px-3 uppercase text-rider-text outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-rider-muted">
                  Driving licence <span className="text-rider-danger">*</span>
                </label>
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                  placeholder="DL-1420110012345"
                  required
                  className="h-12 w-full rounded-xl border border-rider-border bg-rider-surface px-3 uppercase text-rider-text outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm text-rider-muted">
              Referral code <span className="text-rider-muted">(optional)</span>
            </label>
            <input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Got a code from another rider?"
              className="h-12 w-full rounded-xl border border-rider-border bg-rider-surface px-3 uppercase text-rider-text outline-none"
            />
          </div>

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
            className="h-14 w-full rounded-xl bg-rider-accent font-bold text-rider-accent-foreground disabled:opacity-60"
          >
            {busy ? 'Submitting…' : 'Submit application'}
          </button>

          {error && <p className="rounded-xl bg-rider-danger/10 p-3 text-sm text-rider-danger">{error}</p>}

          <button
            onClick={async () => {
              await logout().catch(() => {});
              onSignOut();
            }}
            className="w-full pt-2 text-sm text-rider-muted"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
