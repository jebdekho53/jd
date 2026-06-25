'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { Button, Input, Select, useToast } from '@/design-system/primitives';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';
import { MerchantOtpFlow } from '@/features/auth/components/merchant-otp-flow';
import { useCitiesQuery } from '@/hooks/use-geo';
import {
  updateOnboardingStep,
  uploadOnboardingDocument,
  saveBankAccount,
  validateGst,
  submitApplication,
  fetchApplication,
} from '@/services/onboarding/onboarding-api';
import type { VerifyOtpResult } from '@/types/auth';
import {
  formatPhoneDisplay,
  isPlaceholderPhone,
  isValidIndianPhone,
  normalizeIndianPhone,
} from '@/lib/phone';

const STEPS = [
  'Verify',
  'Personal',
  'Business',
  'Store',
  'Documents',
  'Bank',
  'Review',
] as const;

const BUSINESS_TYPES = [
  'GROCERY', 'RESTAURANT', 'PHARMACY', 'ELECTRONICS', 'FASHION',
  'PET_STORE', 'BEAUTY', 'HEALTH_NUTRITION', 'BAKERY', 'STATIONERY', 'OTHER',
];

const DOC_TYPES = [
  { type: 'GST_CERTIFICATE', label: 'GST Certificate' },
  { type: 'PAN_CARD', label: 'PAN Card' },
  { type: 'SHOP_LICENSE', label: 'Shop License' },
  { type: 'FSSAI_LICENSE', label: 'FSSAI License' },
  { type: 'CANCELLED_CHEQUE', label: 'Cancelled Cheque' },
  { type: 'OWNER_PHOTO', label: 'Owner Photo' },
  { type: 'STORE_PHOTO', label: 'Store Photo' },
];

const STEP_KEYS = [
  'PERSONAL_DETAILS',
  'BUSINESS_DETAILS',
  'STORE_DETAILS',
  'DOCUMENTS',
  'BANK_DETAILS',
  'REVIEW',
] as const;

export function MerchantSignupContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [needsPhone, setNeedsPhone] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    ownerName: '',
    businessName: '',
    businessType: 'GROCERY',
    gstNumber: '',
    gstValid: null as boolean | null,
    panNumber: '',
    storeName: '',
    storeAddress: '',
    state: '',
    city: '',
    cityId: '',
    pincode: '',
    latitude: 28.6139,
    longitude: 77.209,
    deliveryRadiusKm: 5,
    accountHolderName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const { data: cities = [] } = useCitiesQuery();

  const handleVerified = async (result: VerifyOtpResult) => {
    const phone = result.user.phone ?? '';
    const email = result.user.email ?? '';
    setVerifiedPhone(phone);
    setVerifiedEmail(email);
    setNeedsPhone(isPlaceholderPhone(phone));
    if (!isPlaceholderPhone(phone)) {
      setContactPhone(phone.replace(/\D/g, '').slice(-10));
    }
    try {
      await fetchApplication();
    } catch (e) {
      toast((e as Error).message, 'error');
      return;
    }
    setStep(1);
    toast('Verified! Complete your merchant application.', 'success');
  };

  const saveStep = async (stepKey: (typeof STEP_KEYS)[number], extra?: Record<string, unknown>) => {
    setSaving(true);
    try {
      await updateOnboardingStep({ stepKey, ...extra });
    } catch (e) {
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const nextFromPersonal = async () => {
    if (!form.ownerName.trim()) {
      toast('Owner name is required', 'error');
      return;
    }
    const phoneForSave = needsPhone
      ? normalizeIndianPhone(contactPhone)
      : normalizeIndianPhone(verifiedPhone);
    if (!isValidIndianPhone(phoneForSave)) {
      toast('Enter a valid 10-digit mobile number', 'error');
      return;
    }
    try {
      await saveStep('PERSONAL_DETAILS', {
        ownerName: form.ownerName.trim(),
        ownerEmail: verifiedEmail || undefined,
        ownerPhone: phoneForSave,
      });
      setVerifiedPhone(phoneForSave);
      setNeedsPhone(false);
      setStep(2);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const nextFromBusiness = async () => {
    if (!form.businessName.trim()) {
      toast('Business name is required', 'error');
      return;
    }
    if (!form.panNumber.trim()) {
      toast('PAN number is required', 'error');
      return;
    }
    await saveStep('BUSINESS_DETAILS', {
      businessName: form.businessName.trim(),
      businessType: form.businessType,
      gstNumber: form.gstNumber || undefined,
      panNumber: form.panNumber.trim().toUpperCase(),
    });
    setStep(3);
  };

  const checkGst = async () => {
    if (!form.gstNumber) return;
    const res = await validateGst(form.gstNumber);
    setForm((f) => ({ ...f, gstValid: res.valid }));
    toast(res.message, res.valid ? 'success' : 'error');
  };

  const nextFromStore = async () => {
    if (!form.storeName.trim() || !form.storeAddress.trim() || !form.cityId || !form.pincode.trim()) {
      toast('Store name, address, city and pincode are required', 'error');
      return;
    }
    const city = cities.find((c) => c.id === form.cityId);
    await saveStep('STORE_DETAILS', {
      storeName: form.storeName.trim(),
      storeAddress: form.storeAddress.trim(),
      state: form.state,
      city: city?.name ?? form.city,
      cityId: form.cityId,
      pincode: form.pincode.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      deliveryRadiusKm: form.deliveryRadiusKm,
    });
    setStep(4);
  };

  const handleFile = async (documentType: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await uploadOnboardingDocument({
          documentType,
          fileName: file.name,
          mimeType: file.type,
          fileUrl: reader.result as string,
        });
        setUploadedDocs((prev) => new Set(prev).add(documentType));
        toast(`${file.name} uploaded`, 'success');
      } catch (e) {
        toast((e as Error).message, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const nextFromBank = async () => {
    if (!form.accountHolderName.trim() || !form.accountNumber.trim() || !form.ifsc.trim()) {
      toast('Bank account details are required', 'error');
      return;
    }
    await saveBankAccount({
      accountHolderName: form.accountHolderName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifsc: form.ifsc.trim().toUpperCase(),
      upiId: form.upiId.trim() || undefined,
    });
    setStep(6);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await submitApplication();
      toast('Application submitted! We will review it shortly.', 'success');
      router.push('/onboarding');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Become a JebDekho Partner</h1>
          <p className="mt-2 text-slate-600">
            Verify your identity, submit your store details, and go live after approval.
          </p>
        </div>

        <div className="mt-8 flex gap-1 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <div key={label} className="min-w-[3rem] flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i <= step ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              />
              <p
                className={`mt-1.5 truncate text-center text-[10px] font-medium ${
                  i <= step ? 'text-brand-700' : 'text-slate-400'
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            {step === 0 && (
              <div className="space-y-4">
                <MerchantOtpFlow
                  heading="Step 1 — Verify mobile or email"
                  submitLabel="Verify & Continue"
                  onVerified={handleVerified}
                />
                <p className="text-center text-sm text-slate-500">
                  Already registered?{' '}
                  <Link href="/login" className="font-medium text-brand-600 hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <StepHeader title="Personal details" subtitle="Tell us about the store owner" />
                <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-slate-700">
                  {verifiedEmail && (
                    <p>
                      Email (verified):{' '}
                      <span className="font-medium">{verifiedEmail}</span>
                    </p>
                  )}
                  {!needsPhone && verifiedPhone && !isPlaceholderPhone(verifiedPhone) && (
                    <p>
                      Mobile (verified):{' '}
                      <span className="font-medium">{formatPhoneDisplay(verifiedPhone)}</span>
                    </p>
                  )}
                </div>
                {needsPhone && (
                  <div className="flex gap-2">
                    <span className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                      +91
                    </span>
                    <Input
                      label="Store contact mobile"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) =>
                        setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      placeholder="10-digit number for orders & OTP"
                      className="flex-1"
                    />
                  </div>
                )}
                <Input
                  label="Owner full name"
                  placeholder="As per PAN / GST"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                />
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(0)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button className="flex-1" loading={saving} onClick={nextFromPersonal}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <StepHeader title="Business details" subtitle="Legal entity information" />
                <Input
                  label="Business / legal name"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
                <Select
                  label="Business type"
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </Select>
                <div className="flex gap-2">
                  <Input
                    label="GSTIN (optional)"
                    placeholder="15-character GST"
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                    className="flex-1"
                  />
                  <Button variant="secondary" className="mt-6" onClick={checkGst}>
                    Validate
                  </Button>
                </div>
                {form.gstValid !== null && (
                  <p className={form.gstValid ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>
                    {form.gstValid ? 'GST verified' : 'GST could not be verified'}
                  </p>
                )}
                <Input
                  label="PAN number"
                  value={form.panNumber}
                  onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
                />
                <NavButtons saving={saving} onBack={() => setStep(1)} onNext={nextFromBusiness} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <StepHeader title="Store details" subtitle="Where customers will order from" />
                <Input
                  label="Store display name"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                />
                <Input
                  label="Store address"
                  value={form.storeAddress}
                  onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                />
                <Select
                  label="City"
                  value={form.cityId}
                  onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
                </div>
                <Input
                  label="Delivery radius (km)"
                  type="number"
                  value={form.deliveryRadiusKm}
                  onChange={(e) => setForm({ ...form, deliveryRadiusKm: Number(e.target.value) })}
                />
                <NavButtons saving={saving} onBack={() => setStep(2)} onNext={nextFromStore} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <StepHeader title="Documents" subtitle="Upload clear photos or PDFs" />
                {DOC_TYPES.map((d) => (
                  <label
                    key={d.type}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-brand-200 hover:bg-brand-50/30"
                  >
                    <span className="text-sm font-medium text-slate-700">{d.label}</span>
                    <span className="flex items-center gap-2 text-sm text-slate-500">
                      {uploadedDocs.has(d.type) && (
                        <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden />
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="text-xs"
                        onChange={(e) => e.target.files?.[0] && handleFile(d.type, e.target.files[0])}
                      />
                    </span>
                  </label>
                ))}
                <NavButtons saving={false} onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel="Continue" />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <StepHeader title="Bank details" subtitle="For settlements and payouts" />
                <Input
                  label="Account holder name"
                  value={form.accountHolderName}
                  onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                />
                <Input
                  label="Account number"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
                />
                <Input
                  label="IFSC code"
                  value={form.ifsc}
                  onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                />
                <Input
                  label="UPI ID (optional)"
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                />
                <NavButtons saving={saving} onBack={() => setStep(4)} onNext={nextFromBank} />
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <StepHeader title="Review & submit" subtitle="Confirm before sending for approval" />
                <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                  <ReviewRow label="Owner" value={form.ownerName} />
                  <ReviewRow label="Business" value={form.businessName} />
                  <ReviewRow label="Store" value={form.storeName} />
                  <ReviewRow label="City" value={cities.find((c) => c.id === form.cityId)?.name ?? '—'} />
                  <ReviewRow label="Documents" value={`${uploadedDocs.size} uploaded`} />
                </dl>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(5)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button className="flex-1" loading={saving} onClick={handleSubmit}>
                    Submit application
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MarketingShell>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function NavButtons({
  saving,
  onBack,
  onNext,
  nextLabel = 'Continue',
}: {
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <Button variant="secondary" onClick={onBack}>
        <ChevronLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <Button className="flex-1" loading={saving} onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || '—'}</dd>
    </div>
  );
}
