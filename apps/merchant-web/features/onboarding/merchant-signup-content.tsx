'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Select, useToast } from '@/design-system/primitives';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';
import { OtpInput } from '@/features/auth/components/otp-input';
import { useRequestOtpMutation, useVerifyOtpMutation } from '@/hooks/use-auth';
import { useCitiesQuery } from '@/hooks/use-geo';
import {
  updateOnboardingStep,
  uploadOnboardingDocument,
  saveBankAccount,
  validateGst,
  submitApplication,
} from '@/services/onboarding/onboarding-api';

const STEPS = [
  'Personal Details',
  'Business Details',
  'Store Details',
  'Documents',
  'Bank Details',
  'Review & Submit',
];

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
  const [authStep, setAuthStep] = useState<'identifier' | 'otp'>('identifier');
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [resolvedPhone, setResolvedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const [form, setForm] = useState({
    ownerName: '',
    password: '',
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

  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useVerifyOtpMutation();
  const { data: cities = [] } = useCitiesQuery();

  useEffect(() => {
    if (authenticated && step === 0) setStep(1);
  }, [authenticated, step]);

  const formatPhone = (raw: string) =>
    raw.startsWith('+') ? raw : `+91${raw.replace(/^0/, '')}`;

  const handleRequestOtp = async () => {
    try {
      if (mode === 'phone') {
        const formatted = formatPhone(phone);
        await requestOtp.mutateAsync({ phone: formatted });
        setResolvedPhone(formatted);
      } else {
        const result = await requestOtp.mutateAsync({ email: email.trim().toLowerCase() });
        if (!result.phone) throw new Error('Could not resolve phone for email');
        setResolvedPhone(result.phone);
      }
      setAuthStep('otp');
      toast('OTP sent', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtp.mutateAsync({ phone: resolvedPhone, code: otp });
      setAuthenticated(true);
      toast('Verified! Continue your application.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const saveStep = async (stepKey: (typeof STEP_KEYS)[number], extra?: Record<string, unknown>) => {
    await updateOnboardingStep({ stepKey, ...extra });
  };

  const nextFromPersonal = async () => {
    await saveStep('PERSONAL_DETAILS', {
      ownerName: form.ownerName,
      ownerEmail: email || undefined,
      ownerPhone: resolvedPhone || formatPhone(phone),
      password: form.password || undefined,
    });
    setStep(2);
  };

  const nextFromBusiness = async () => {
    await saveStep('BUSINESS_DETAILS', {
      businessName: form.businessName,
      businessType: form.businessType,
      gstNumber: form.gstNumber || undefined,
      panNumber: form.panNumber,
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
    const city = cities.find((c) => c.id === form.cityId);
    await saveStep('STORE_DETAILS', {
      storeName: form.storeName,
      storeAddress: form.storeAddress,
      state: form.state,
      city: city?.name ?? form.city,
      cityId: form.cityId,
      pincode: form.pincode,
      latitude: form.latitude,
      longitude: form.longitude,
      deliveryRadiusKm: form.deliveryRadiusKm,
    });
    setStep(4);
  };

  const handleFile = async (documentType: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      await uploadOnboardingDocument({
        documentType,
        fileName: file.name,
        mimeType: file.type,
        fileUrl: reader.result as string,
      });
      toast(`${file.name} uploaded`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const nextFromBank = async () => {
    await saveBankAccount({
      accountHolderName: form.accountHolderName,
      accountNumber: form.accountNumber,
      ifsc: form.ifsc,
      upiId: form.upiId || undefined,
    });
    setStep(6);
  };

  const handleSubmit = async () => {
    try {
      await submitApplication();
      toast('Application submitted!', 'success');
      router.push('/onboarding');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  return (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Merchant Signup</h1>
        <div className="mt-4 flex gap-1">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded ${i <= step ? 'bg-brand-600' : 'bg-slate-200'}`}
              title={label}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Verify your identity</h2>
                <div className="flex gap-2">
                  <Button variant={mode === 'phone' ? 'primary' : 'secondary'} onClick={() => setMode('phone')}>
                    Mobile OTP
                  </Button>
                  <Button variant={mode === 'email' ? 'primary' : 'secondary'} onClick={() => setMode('email')}>
                    Email OTP
                  </Button>
                </div>
                {authStep === 'identifier' ? (
                  <>
                    {mode === 'phone' ? (
                      <Input placeholder="+91 mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    ) : (
                      <Input placeholder="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    )}
                    <Button onClick={handleRequestOtp} loading={requestOtp.isPending}>
                      Send OTP
                    </Button>
                  </>
                ) : (
                  <>
                    <OtpInput value={otp} onChange={setOtp} />
                    <Button onClick={handleVerifyOtp} loading={verifyOtp.isPending}>
                      Verify OTP
                    </Button>
                  </>
                )}
                <p className="text-center text-sm text-slate-500">
                  Already registered? <Link href="/login" className="text-brand-600">Login</Link>
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Personal Details</h2>
                <Input placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                <Input placeholder="Password (optional)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Button onClick={nextFromPersonal}>Continue</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Business Details</h2>
                <Input placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                <Select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </Select>
                <div className="flex gap-2">
                  <Input placeholder="GST (optional)" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
                  <Button variant="secondary" onClick={checkGst}>Validate</Button>
                </div>
                {form.gstValid !== null && (
                  <p className={form.gstValid ? 'text-brand-600' : 'text-red-600'}>
                    {form.gstValid ? 'GST verified' : 'GST invalid'}
                  </p>
                )}
                <Input placeholder="PAN number" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} />
                <Button onClick={nextFromBusiness}>Continue</Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Store Details</h2>
                <Input placeholder="Store name" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
                <Input placeholder="Store address" value={form.storeAddress} onChange={(e) => setForm({ ...form, storeAddress: e.target.value })} />
                <Select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                <Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} />
                  <Input type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} />
                </div>
                <Input type="number" placeholder="Delivery radius (km)" value={form.deliveryRadiusKm} onChange={(e) => setForm({ ...form, deliveryRadiusKm: Number(e.target.value) })} />
                <Button onClick={nextFromStore}>Continue</Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Upload Documents</h2>
                {DOC_TYPES.map((d) => (
                  <label key={d.type} className="flex items-center justify-between rounded border border-slate-200 p-3">
                    <span className="text-sm">{d.label}</span>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && handleFile(d.type, e.target.files[0])} />
                  </label>
                ))}
                <Button onClick={() => setStep(5)}>Continue</Button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Bank Details</h2>
                <Input placeholder="Account holder name" value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} />
                <Input placeholder="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
                <Input placeholder="IFSC" value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} />
                <Input placeholder="UPI ID (optional)" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
                <Button onClick={nextFromBank}>Continue</Button>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <h2 className="font-semibold">Review & Submit</h2>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-slate-500">Business</dt><dd>{form.businessName}</dd></div>
                  <div><dt className="text-slate-500">Store</dt><dd>{form.storeName}</dd></div>
                  <div><dt className="text-slate-500">City</dt><dd>{cities.find((c) => c.id === form.cityId)?.name}</dd></div>
                </dl>
                <Button onClick={handleSubmit}>Submit Application</Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MarketingShell>
  );
}
