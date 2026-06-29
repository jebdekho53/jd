'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { Button, Input, Select, Spinner, useToast } from '@/design-system/primitives';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';
import { MerchantEmailAuth } from '@/features/auth/components/merchant-email-auth';
import { useCitiesQuery } from '@/hooks/use-geo';
import { MerchantAddressPicker } from '@/components/google-maps/merchant-address-picker';
import { computeWizardProgress } from '@/lib/onboarding/progress';
import {
  updateOnboardingStep,
  uploadOnboardingDocument,
  saveBankAccount,
  validateGst,
  submitApplication,
  fetchApplication,
  resolveStoreLocation,
} from '@/services/onboarding/onboarding-api';
import type { VerifyOtpResult } from '@/types/auth';
import {
  formatPhoneDisplay,
  isPlaceholderPhone,
  isValidIndianPhone,
  normalizeIndianPhone,
} from '@/lib/phone';
import { ImageUploadField } from '@/features/media/components/image-upload-field';
import type { MerchantApplication } from '@/services/onboarding/onboarding-api';
import { fetchMe } from '@/services/auth/auth-api';
import { useAuthStore } from '@/store/auth-store';
import {
  inferSignupWizardStep,
  syncVerifiedIdentityFromUser,
} from '@/lib/merchant-entry-route';

const STEPS = [
  'Verify',
  'Business',
  'Store',
  'Location',
  'Delivery',
  'Categories',
  'GST/PAN',
  'Bank',
  'Review',
] as const;

const BUSINESS_TYPES = [
  'GROCERY', 'RESTAURANT', 'CLOUD_KITCHEN', 'CAFE', 'BAKERY', 'SWEETS',
  'FRUITS_VEGETABLES', 'MEAT_FISH', 'PHARMACY', 'ELECTRONICS', 'FASHION',
  'PET_STORE', 'BEAUTY', 'HEALTH_NUTRITION', 'HOME_KITCHEN', 'BABY_STORE',
  'SUPPLEMENTS', 'FLOWERS', 'LOCAL_STORE', 'STATIONERY', 'OTHER',
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

const RESOLVE_DEBOUNCE_MS = 400;

type LocationSelectionInput = {
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
};

function isLocationReadyForResolve(selection: LocationSelectionInput): boolean {
  return (
    Number.isFinite(selection.lat) &&
    Number.isFinite(selection.lng) &&
    /^\d{6}$/.test(selection.pincode.trim()) &&
    Boolean(selection.city.trim()) &&
    Boolean(selection.state.trim())
  );
}

export function MerchantSignupContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [booting, setBooting] = useState(true);
  const [step, setStep] = useState(0);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [needsPhone, setNeedsPhone] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());
  const resolveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveVersionRef = useRef(0);

  useEffect(
    () => () => {
      if (resolveDebounceRef.current) clearTimeout(resolveDebounceRef.current);
    },
    [],
  );

  const [form, setForm] = useState({
    ownerName: '',
    businessName: '',
    businessTypes: ['GROCERY'] as string[],
    gstNumber: '',
    gstValid: null as boolean | null,
    panNumber: '',
    storeName: '',
    storeAddress: '',
    locality: '',
    state: '',
    city: '',
    cityId: '',
    pincode: '',
    locationPincodeId: '',
    locationAreaId: '',
    locationCityId: '',
    operationalCityName: '',
    expansionArea: false,
    latitude: 28.6139,
    longitude: 77.209,
    deliveryRadiusKm: 5,
    deliveryCoverageInput: '',
    preferredCategories: [] as string[],
    storeLogoUrl: '',
    storeBannerUrl: '',
    accountHolderName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const { data: cities = [] } = useCitiesQuery();

  useEffect(() => {
    void (async () => {
      try {
        let user = useAuthStore.getState().user;
        if (!user) {
          user = await fetchMe();
          if (user) useAuthStore.getState().setSession(user);
        }
        if (!user) return;
        if (user.roles.includes('MERCHANT')) {
          router.replace('/dashboard');
          return;
        }

        const identity = syncVerifiedIdentityFromUser(user);
        setVerifiedEmail(identity.verifiedEmail);
        setVerifiedPhone(identity.verifiedPhone);
        setNeedsPhone(identity.needsPhone);
        setContactPhone(identity.contactPhone);

        const app = await fetchApplication();
        hydrateFromApplication(app);
        const wizardStep = Math.max(1, inferSignupWizardStep(app));
        setStep(wizardStep);
      } catch {
        /* fresh visitor — stay on account creation */
      } finally {
        setBooting(false);
      }
    })();
  }, [router]);

  const hydrateFromApplication = (app: MerchantApplication) => {
    const types =
      app.businessTypes?.length
        ? app.businessTypes
        : app.businessType
          ? [app.businessType]
          : ['GROCERY'];
    setForm((f) => ({
      ...f,
      ownerName: app.ownerName ?? f.ownerName,
      businessName: app.businessName ?? f.businessName,
      businessTypes: types,
      preferredCategories: types,
      gstNumber: app.gstNumber ?? f.gstNumber,
      gstValid: app.gstVerified ?? f.gstValid,
      panNumber: app.panNumber ?? f.panNumber,
      storeName: app.storeName ?? f.storeName,
      storeAddress: app.storeAddress ?? f.storeAddress,
      state: app.state ?? f.state,
      city: app.city ?? f.city,
      cityId: app.cityId ?? f.cityId,
      pincode: app.pincode ?? f.pincode,
      latitude: app.latitude ?? f.latitude,
      longitude: app.longitude ?? f.longitude,
      deliveryRadiusKm: app.deliveryRadiusKm ?? f.deliveryRadiusKm,
      deliveryCoverageInput: Array.isArray(app.deliveryCoveragePincodes)
        ? (app.deliveryCoveragePincodes as string[]).filter((p) => p !== app.pincode).join(', ')
        : f.deliveryCoverageInput,
      storeLogoUrl: app.storeLogoUrl ?? f.storeLogoUrl,
      storeBannerUrl: app.storeBannerUrl ?? f.storeBannerUrl,
      accountHolderName: app.bankAccount?.accountHolderName ?? f.accountHolderName,
      accountNumber: app.bankAccount?.accountNumber ?? f.accountNumber,
      ifsc: app.bankAccount?.ifsc ?? f.ifsc,
      upiId: app.bankAccount?.upiId ?? f.upiId,
    }));
    if (app.documents?.length) {
      setUploadedDocs(new Set(app.documents.map((d) => d.documentType)));
    }
  };

  const handleVerified = async (result: VerifyOtpResult) => {
    const phone = result.user.phone ?? '';
    const email = result.user.email ?? '';
    setVerifiedPhone(phone);
    setVerifiedEmail(email);
    setNeedsPhone(isPlaceholderPhone(phone));
    if (!isPlaceholderPhone(phone)) {
      setContactPhone(phone.replace(/\D/g, '').slice(-10));
    }

    let app: MerchantApplication | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        app = await fetchApplication();
        break;
      } catch {
        if (attempt === 1) break;
      }
    }

    if (app) {
      hydrateFromApplication(app);
      setStep(Math.max(1, inferSignupWizardStep(app)));
    } else {
      setStep(1);
    }

    toast('Account ready — complete your store details below.', 'success');
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

  const nextFromBusiness = async () => {
    if (!form.ownerName.trim()) {
      toast('Owner name is required', 'error');
      return;
    }
    if (!form.businessName.trim()) {
      toast('Business name is required', 'error');
      return;
    }
    if (form.businessTypes.length === 0) {
      toast('Select at least one business type', 'error');
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
      await saveStep('BUSINESS_DETAILS', {
        businessName: form.businessName.trim(),
        businessType: form.businessTypes[0],
        businessTypes: form.businessTypes,
      });
      setVerifiedPhone(phoneForSave);
      setNeedsPhone(false);
      setStep(2);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const nextFromStoreBasics = () => {
    if (!form.storeName.trim() || !form.storeLogoUrl || !form.storeBannerUrl) {
      toast('Store name, logo, and banner are required', 'error');
      return;
    }
    setStep(3);
  };

  const nextFromLocation = () => {
    if (resolvingLocation) {
      toast('Resolving location…', 'info');
      return;
    }
    if (!form.storeAddress.trim()) {
      toast('Store address is required', 'error');
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      toast('Select a location on the map to get a valid pincode', 'error');
      return;
    }
    if (!form.city.trim() || !form.state.trim()) {
      toast('Complete location using search, GPS, or map pin', 'error');
      return;
    }
    if (form.latitude == null || form.longitude == null) {
      toast('Pin your store on the map or use GPS', 'error');
      return;
    }
    if (!form.cityId) {
      toast('Location is still resolving — pick the pin again', 'error');
      return;
    }
    setStep(4);
  };

  const nextFromCategories = async () => {
    if (form.preferredCategories.length === 0) {
      toast('Select at least one category you plan to sell', 'error');
      return;
    }
    try {
      await updateOnboardingStep({
        businessType: form.preferredCategories[0],
        businessTypes: form.preferredCategories,
      });
      setForm((f) => ({ ...f, businessTypes: [...f.preferredCategories] }));
      setStep(6);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const nextFromKyc = async () => {
    if (!form.panNumber.trim()) {
      toast('PAN number is required', 'error');
      return;
    }
    try {
      await saveStep('BUSINESS_DETAILS', {
        businessName: form.businessName.trim(),
        businessType: form.businessTypes[0],
        businessTypes: form.businessTypes,
        gstNumber: form.gstNumber || undefined,
        panNumber: form.panNumber.trim().toUpperCase(),
      });
      setStep(7);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const checkGst = async () => {
    if (!form.gstNumber) return;
    const res = await validateGst(form.gstNumber);
    setForm((f) => ({ ...f, gstValid: res.valid }));
    toast(res.message, res.valid ? 'success' : 'error');
  };

  const saveStoreDetails = async () => {
    if (
      !form.storeName.trim() ||
      !form.storeAddress.trim() ||
      !form.cityId ||
      !form.pincode.trim() ||
      !/^\d{6}$/.test(form.pincode.trim()) ||
      form.latitude == null ||
      form.longitude == null ||
      !form.storeLogoUrl ||
      !form.storeBannerUrl
    ) {
      toast('Complete store, location, and delivery fields before continuing', 'error');
      return;
    }
    const city = cities.find((c) => c.id === form.cityId);
    setSaving(true);
    try {
      await updateOnboardingStep({
        stepKey: 'STORE_DETAILS',
        storeName: form.storeName.trim(),
        storeAddress: form.storeAddress.trim(),
        locality: form.locality,
        state: form.state,
        city: city?.name ?? (form.operationalCityName || form.city),
        cityId: form.cityId,
        pincode: form.pincode.trim(),
        locationPincodeId: form.locationPincodeId || undefined,
        locationAreaId: form.locationAreaId || undefined,
        locationCityId: form.locationCityId || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        deliveryRadiusKm: form.deliveryRadiusKm,
        deliveryCoveragePincodes: [
          ...new Set([
            form.pincode.trim(),
            ...form.deliveryCoverageInput
              .split(/[\s,]+/)
              .map((p) => p.trim())
              .filter((p) => /^\d{6}$/.test(p)),
          ]),
        ],
        storeLogoUrl: form.storeLogoUrl,
        storeBannerUrl: form.storeBannerUrl,
      });
      setStep(5);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const syncLocationForm = (selection: LocationSelectionInput) => {
    const pincode = selection.pincode.replace(/\D/g, '').slice(0, 6);
    setForm((f) => ({
      ...f,
      locality: selection.locality,
      city: selection.city,
      state: selection.state,
      pincode,
      latitude: selection.lat,
      longitude: selection.lng,
      locationPincodeId: selection.locationPincodeId ?? '',
      locationAreaId: selection.locationAreaId ?? '',
      locationCityId: selection.locationCityId ?? '',
    }));
  };

  const resolveLocationWhenReady = useCallback(
    async (selection: LocationSelectionInput) => {
      if (!isLocationReadyForResolve(selection)) return;

      const version = ++resolveVersionRef.current;
      setResolvingLocation(true);
      try {
        const body: Parameters<typeof resolveStoreLocation>[0] = {
          latitude: selection.lat,
          longitude: selection.lng,
        };
        const locality = selection.locality.trim();
        const city = selection.city.trim();
        const state = selection.state.trim();
        const pincode = selection.pincode.trim();
        if (locality) body.locality = locality;
        if (city) body.city = city;
        if (state) body.state = state;
        if (pincode) body.pincode = pincode;
        if (selection.locationCityId) body.locationCityId = selection.locationCityId;
        if (selection.locationAreaId) body.locationAreaId = selection.locationAreaId;

        const resolved = await resolveStoreLocation(body);
        if (version !== resolveVersionRef.current) return;

        setForm((f) => ({
          ...f,
          locality: resolved.locality || selection.locality,
          city: resolved.city,
          state: resolved.state,
          pincode: resolved.pincode,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          cityId: resolved.cityId,
          operationalCityName: resolved.operationalCityName,
          expansionArea: resolved.expansionArea,
          locationPincodeId: resolved.locationPincodeId ?? '',
          locationAreaId: resolved.locationAreaId ?? '',
          locationCityId: resolved.locationCityId ?? '',
        }));
        if (resolved.expansionArea) {
          toast(
            'Location saved. Our team will review delivery in this area after you submit.',
            'info',
          );
        }
      } catch (e) {
        if (version === resolveVersionRef.current) {
          toast((e as Error).message, 'error');
        }
      } finally {
        if (version === resolveVersionRef.current) {
          setResolvingLocation(false);
        }
      }
    },
    [toast],
  );

  const applyLocationSelection = useCallback(
    (selection: LocationSelectionInput) => {
      syncLocationForm(selection);

      if (resolveDebounceRef.current) clearTimeout(resolveDebounceRef.current);

      if (!isLocationReadyForResolve(selection)) return;

      resolveDebounceRef.current = setTimeout(() => {
        void resolveLocationWhenReady(selection);
      }, RESOLVE_DEBOUNCE_MS);
    },
    [resolveLocationWhenReady],
  );

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
    setStep(8);
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
        <p className="mt-2 text-center text-xs text-slate-500">
          {computeWizardProgress(step)}% complete — draft saves when you continue each step
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            {booting ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" className="text-brand-600" />
              </div>
            ) : step === 0 ? (
              <div className="space-y-4">
                <MerchantEmailAuth
                  mode="signup"
                  heading="Step 1 — Create your account"
                  submitLabel="Create Account & Continue"
                  showForgotPassword={false}
                  onSuccess={handleVerified}
                  onAccountExists={(email) => {
                    router.push(`/login?email=${encodeURIComponent(email)}`);
                  }}
                />
                <p className="text-center text-sm text-slate-500">
                  Already registered?{' '}
                  <Link href="/login" className="font-medium text-brand-600 hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            ) : null}

            {!booting && step === 1 && (
              <div className="space-y-4">
                <StepHeader title="Business details" subtitle="Owner and legal entity" />
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
                <Input
                  label="Business / legal name"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Business types</p>
                  <p className="mb-3 text-xs text-slate-500">Select all that apply — primary type is used for legacy flows.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {BUSINESS_TYPES.map((t) => {
                      const checked = form.businessTypes.includes(t);
                      return (
                        <label
                          key={t}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                            checked ? 'border-brand-400 bg-brand-50' : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setForm((f) => {
                                const next = checked
                                  ? f.businessTypes.filter((c) => c !== t)
                                  : [...f.businessTypes, t];
                                return { ...f, businessTypes: next.length ? next : [t] };
                              })
                            }
                          />
                          {t.replace(/_/g, ' ')}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <NavButtons saving={saving} onBack={() => setStep(0)} onNext={nextFromBusiness} />
              </div>
            )}

            {!booting && step === 2 && (
              <div className="space-y-4">
                <StepHeader title="Store details" subtitle="Brand and storefront" />
                <Input
                  label="Store display name"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageUploadField
                    label="Store logo"
                    mode="square"
                    purpose="store-logo"
                    required
                    value={form.storeLogoUrl}
                    onChange={(url) => setForm((f) => ({ ...f, storeLogoUrl: url }))}
                    allowRemove={false}
                  />
                  <ImageUploadField
                    label="Store banner"
                    mode="banner"
                    purpose="store-banner"
                    required
                    value={form.storeBannerUrl}
                    onChange={(url) => setForm((f) => ({ ...f, storeBannerUrl: url }))}
                    allowRemove={false}
                  />
                </div>
                <NavButtons saving={false} onBack={() => setStep(1)} onNext={nextFromStoreBasics} />
              </div>
            )}

            {!booting && step === 3 && (
              <div className="space-y-4">
                <StepHeader
                  title="Store location"
                  subtitle="Search, use GPS, or pin your store on the map"
                />
                <Input
                  label="Store address"
                  placeholder="Building, street, landmark"
                  value={form.storeAddress}
                  onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                />
                <MerchantAddressPicker
                  searchLabel="Search on map"
                  mapHeightClassName="h-56 sm:h-72"
                  masterValue={form.locality}
                  masterPincode={form.pincode}
                  value={{
                    locality: form.locality,
                    city: form.city,
                    state: form.state,
                    pincode: form.pincode,
                    lat: form.latitude,
                    lng: form.longitude,
                  }}
                  onChange={(selection) => {
                    void applyLocationSelection({
                      locality: selection.locality,
                      city: selection.city,
                      state: selection.state,
                      pincode: selection.pincode,
                      lat: selection.lat,
                      lng: selection.lng,
                      locationPincodeId: selection.locationPincodeId,
                      locationAreaId: selection.locationAreaId,
                      locationCityId: selection.locationCityId,
                    });
                  }}
                  onLine1Suggestion={(line1) => setForm((f) => ({ ...f, storeAddress: line1 }))}
                />
                <p className="text-xs text-slate-500">
                  Allow location access when prompted, or drag the pin to your exact storefront.
                </p>
                {resolvingLocation && (
                  <p className="flex items-center gap-2 text-xs text-brand-700">
                    <Spinner className="h-3 w-3" />
                    Resolving location…
                  </p>
                )}
                {form.locality && !resolvingLocation && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <p>
                      {form.locality} · {form.city}, {form.state}
                      {form.pincode ? ` · ${form.pincode}` : ''}
                    </p>
                    {!/^\d{6}$/.test(form.pincode) && (
                      <p className="mt-1 text-xs text-amber-700">
                        Pincode not detected from map — enter it below or search your area.
                      </p>
                    )}
                  </div>
                )}
                {form.locality && !/^\d{6}$/.test(form.pincode) && (
                  <Input
                    label="Pincode"
                    placeholder="6-digit pincode"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => {
                      const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setForm((f) => ({ ...f, pincode: pin }));
                    }}
                    onBlur={() => {
                      if (
                        /^\d{6}$/.test(form.pincode) &&
                        form.city.trim() &&
                        form.state.trim()
                      ) {
                        applyLocationSelection({
                          locality: form.locality,
                          city: form.city,
                          state: form.state,
                          pincode: form.pincode,
                          lat: form.latitude,
                          lng: form.longitude,
                          locationPincodeId: form.locationPincodeId || undefined,
                          locationAreaId: form.locationAreaId || undefined,
                          locationCityId: form.locationCityId || undefined,
                        });
                      }
                    }}
                  />
                )}
                {form.locality && /^\d{6}$/.test(form.pincode) && form.expansionArea && !resolvingLocation && (
                  <p className="text-xs text-amber-700">
                    Expansion area — delivery subject to approval after signup
                  </p>
                )}
                <NavButtons
                  saving={resolvingLocation}
                  onBack={() => setStep(2)}
                  onNext={nextFromLocation}
                />
              </div>
            )}

            {!booting && step === 4 && (
              <div className="space-y-4">
                <StepHeader title="Delivery coverage" subtitle="Pincodes you can serve" />
                {form.cityId ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-sm font-medium text-slate-800">Operational city</p>
                    <p className="text-sm text-slate-600">
                      {form.operationalCityName ||
                        cities.find((c) => c.id === form.cityId)?.name ||
                        form.city}
                    </p>
                    {form.expansionArea && (
                      <p className="mt-1 text-xs text-amber-700">
                        New service area — our team will review before go-live
                      </p>
                    )}
                  </div>
                ) : (
                  <Select
                    label="Operational city"
                    value={form.cityId}
                    onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                  >
                    <option value="">Select city</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                )}
                <Input
                  label="Delivery radius (km)"
                  type="number"
                  value={form.deliveryRadiusKm}
                  onChange={(e) => setForm({ ...form, deliveryRadiusKm: Number(e.target.value) })}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Delivery coverage pincodes</label>
                  <p className="mb-2 text-xs text-slate-500">
                    Store pincode {form.pincode ? `(${form.pincode})` : ''} is included. Add more comma-separated pincodes.
                  </p>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={3}
                    placeholder="201204, 201003, 110094"
                    value={form.deliveryCoverageInput}
                    onChange={(e) => setForm({ ...form, deliveryCoverageInput: e.target.value })}
                  />
                </div>
                <NavButtons saving={saving} onBack={() => setStep(3)} onNext={saveStoreDetails} />
              </div>
            )}

            {!booting && step === 5 && (
              <div className="space-y-4">
                <StepHeader
                  title="Business vertical"
                  subtitle="Cloud kitchen, cafe, grocery, etc. — used to show the right catalog after signup"
                />
                <p className="text-xs text-slate-500">
                  After your store is approved, request platform categories (Food → Biryani, Cafe → Coffee, etc.) under Store Categories.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {BUSINESS_TYPES.map((t) => {
                    const checked = form.preferredCategories.includes(t);
                    return (
                      <label
                        key={t}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                          checked ? 'border-brand-400 bg-brand-50' : 'border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm((f) => ({
                              ...f,
                              preferredCategories: checked
                                ? f.preferredCategories.filter((c) => c !== t)
                                : [...f.preferredCategories, t],
                            }))
                          }
                        />
                        {t.replace(/_/g, ' ')}
                      </label>
                    );
                  })}
                </div>
                <NavButtons saving={false} onBack={() => setStep(4)} onNext={nextFromCategories} />
              </div>
            )}

            {!booting && step === 6 && (
              <div className="space-y-4">
                <StepHeader title="GST & PAN" subtitle="Tax identity and documents" />
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
                <p className="text-sm font-medium text-slate-700">Upload documents</p>
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
                <NavButtons saving={saving} onBack={() => setStep(5)} onNext={nextFromKyc} />
              </div>
            )}

            {!booting && step === 7 && (
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
                <NavButtons saving={saving} onBack={() => setStep(6)} onNext={nextFromBank} />
              </div>
            )}

            {!booting && step === 8 && (
              <div className="space-y-4">
                <StepHeader title="Review & submit" subtitle="Confirm before sending for approval" />
                <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                  <ReviewRow label="Owner" value={form.ownerName} />
                  <ReviewRow label="Business" value={form.businessName} />
                  <ReviewRow label="Business types" value={form.businessTypes.map((t) => t.replace(/_/g, ' ')).join(', ')} />
                  <ReviewRow label="Store" value={form.storeName} />
                  <ReviewRow label="City" value={cities.find((c) => c.id === form.cityId)?.name ?? '—'} />
                  <ReviewRow label="Categories" value={form.preferredCategories.join(', ') || '—'} />
                  <ReviewRow label="Documents" value={`${uploadedDocs.size} uploaded`} />
                </dl>
                {(form.storeLogoUrl || form.storeBannerUrl) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {form.storeLogoUrl && (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <p className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-500">Logo</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.storeLogoUrl} alt="Store logo" className="aspect-square w-full object-cover" />
                      </div>
                    )}
                    {form.storeBannerUrl && (
                      <div className="overflow-hidden rounded-xl border border-slate-200 sm:col-span-2">
                        <p className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-500">Banner</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.storeBannerUrl} alt="Store banner" className="aspect-[3/1] w-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(7)}>
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
