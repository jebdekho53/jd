'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { Button, Input, Select, Spinner, useToast } from '@/design-system/primitives';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';
import { MerchantAuthTabs } from '@/features/auth/components/merchant-auth-tabs';
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
  postAttribution,
} from '@/services/onboarding/onboarding-api';
import { captureAttributionFromUrl, getStoredAttribution } from '@/lib/analytics/attribution';
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
import { OnboardingStatusContent } from '@/features/onboarding/onboarding-status-content';

const STEPS = [
  'Account Verification',
  'Business Type',
  'Store Details',
  'Pickup Location',
  'Delivery Coverage',
  'Store Categories',
  'GST / PAN',
  'Bank Details',
  'Review & Submit',
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
  'VERIFY',
  'BUSINESS',
  'STORE',
  'LOCATION',
  'DELIVERY',
  'CATEGORIES',
  'GST_PAN',
  'BANK',
  'REVIEW',
] as const;

const RESOLVE_DEBOUNCE_MS = 400;

// Maps the raw field tokens the backend reports in "Application incomplete: …"
// to the wizard render step that owns each field, so a failed submit can jump
// the merchant straight to the step that needs fixing.
const FIELD_TO_STEP: Record<string, number> = {
  ownerName: 1,
  ownerEmail: 1,
  ownerPhone: 1,
  businessName: 1,
  businessType: 1,
  businessTypes: 1,
  storeName: 2,
  storeLogoUrl: 2,
  storeBannerUrl: 2,
  storeAddress: 3,
  landmark: 3,
  cityId: 3,
  pincode: 3,
  latitude: 3,
  longitude: 3,
  panNumber: 6,
  gstNumber: 6,
  documents: 6,
  bankAccount: 7,
};
const EDITABLE_APPLICATION_STATUSES = new Set(['DRAFT', 'REJECTED']);

type MerchantSignupContentProps = {
  onboardingOnly?: boolean;
};

type FieldErrors = Partial<Record<
  | 'contactPhone'
  | 'ownerEmail'
  | 'ownerName'
  | 'businessName'
  | 'storeName'
  | 'storeAddress'
  | 'locality'
  | 'landmark'
  | 'city'
  | 'state'
  | 'pincode'
  | 'deliveryCoverage'
  | 'gstNumber'
  | 'panNumber'
  | 'accountHolderName'
  | 'accountNumber'
  | 'confirmAccountNumber'
  | 'ifsc'
  | 'bankName'
  | 'categories',
  string
>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readableBackendMessage(message: string) {
  return message
    .replace(/\bgstNumber\b/g, 'GST number')
    .replace(/\bpanNumber\b/g, 'PAN')
    .replace(/\bownerPhone\b/g, 'Phone')
    .replace(/\bownerEmail\b/g, 'Email')
    .replace(/\bstoreName\b/g, 'Store name')
    .replace(/\bpincode\b/g, 'Pincode')
    .replace(/\bifsc\b/g, 'IFSC')
    .replace(/\baccountNumber\b/g, 'Account number')
    .replace(/\baccountHolderName\b/g, 'Account holder name');
}

function fieldForBackendMessage(message: string): keyof FieldErrors | null {
  const lower = message.toLowerCase();
  if (lower.includes('gst')) return 'gstNumber';
  if (lower.includes('pan')) return 'panNumber';
  if (lower.includes('ifsc')) return 'ifsc';
  if (lower.includes('account holder')) return 'accountHolderName';
  if (lower.includes('account number') || lower.includes('bank account')) return 'accountNumber';
  if (lower.includes('email')) return 'ownerEmail';
  if (lower.includes('phone') || lower.includes('mobile')) return 'contactPhone';
  if (lower.includes('storename') || lower.includes('store name')) return 'storeName';
  if (lower.includes('pincode')) return 'pincode';
  if (lower.includes('address')) return 'storeAddress';
  if (lower.includes('locality') || lower.includes('area')) return 'locality';
  if (lower.includes('landmark')) return 'landmark';
  if (lower.includes('category')) return 'categories';
  return null;
}

type LocationSelectionInput = {
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  line1?: string;
  line2?: string;
  formattedAddress?: string;
  googlePlaceId?: string;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
};

function isLocationReadyForResolve(selection: LocationSelectionInput): boolean {
  return (
    selection.lat != null &&
    selection.lng != null &&
    Number.isFinite(selection.lat) &&
    Number.isFinite(selection.lng) &&
    /^\d{6}$/.test(selection.pincode.trim())
  );
}

function normalizeAddressPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isBroadPickupAddress(addressLine1: string, locality: string, city: string): boolean {
  const line = normalizeAddressPart(addressLine1);
  if (!line) return false;
  return [locality, city]
    .map(normalizeAddressPart)
    .filter(Boolean)
    .some((part) => line === part);
}

export function MerchantSignupContent({ onboardingOnly = false }: MerchantSignupContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [booting, setBooting] = useState(true);
  const [step, setStep] = useState(0);
  const [showStatus, setShowStatus] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [needsPhone, setNeedsPhone] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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
    ownerEmail: '',
    businessName: '',
    businessTypes: ['GROCERY'] as string[],
    gstNumber: '',
    gstValid: null as boolean | null,
    panNumber: '',
    storeName: '',
    storeAddress: '',
    addressLine2: '',
    landmark: '',
    pickupInstructions: '',
    googlePlaceId: '',
    formattedAddress: '',
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
    latitude: null as number | null,
    longitude: null as number | null,
    deliveryRadiusKm: 5,
    deliveryCoverageInput: '',
    preferredCategories: [] as string[],
    storeLogoUrl: '',
    storeBannerUrl: '',
    ownerPhotoUrl: '',
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const { data: cities = [] } = useCitiesQuery();

  const handleStepError = useCallback(
    (err: unknown) => {
      const message = readableBackendMessage(err instanceof Error ? err.message : 'We could not save this step. Please try again.');
      const field = fieldForBackendMessage(message);
      if (field) setFieldErrors((prev) => ({ ...prev, [field]: message }));
      toast(message, 'error');
    },
    [toast],
  );

  // Capture first-touch UTM / fbclid from the ad landing URL as early as possible,
  // before any redirect can strip the query string.
  useEffect(() => {
    captureAttributionFromUrl();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        let user = useAuthStore.getState().user;
        if (!user) {
          user = await fetchMe();
          if (user) useAuthStore.getState().setSession(user);
        }
        if (!user) {
          if (onboardingOnly) router.replace('/login');
          return;
        }
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

        // Attribute this merchant to the campaign that first referred them.
        const attribution = getStoredAttribution();
        if (attribution) {
          void postAttribution(attribution).catch(() => {});
        }

        if (!EDITABLE_APPLICATION_STATUSES.has(app.status)) {
          setShowStatus(true);
          return;
        }
        if (!onboardingOnly) {
          router.replace('/onboarding');
          return;
        }
        hydrateFromApplication(app);
        const wizardStep = Math.max(1, inferSignupWizardStep(app));
        setStep(wizardStep);
      } catch {
        if (onboardingOnly) router.replace('/login');
      } finally {
        setBooting(false);
      }
    })();
  }, [onboardingOnly, router]);

  const hydrateFromApplication = (app: MerchantApplication) => {
    const pickup = app.pickupAddress;
    const types =
      app.businessTypes?.length
        ? app.businessTypes
        : app.businessType
          ? [app.businessType]
          : ['GROCERY'];
    setForm((f) => ({
      ...f,
      ownerName: app.ownerName ?? f.ownerName,
      ownerEmail: app.ownerEmail ?? f.ownerEmail,
      businessName: app.businessName ?? f.businessName,
      businessTypes: types,
      preferredCategories: types,
      gstNumber: app.gstNumber ?? f.gstNumber,
      gstValid: app.gstVerified ?? f.gstValid,
      panNumber: app.panNumber ?? f.panNumber,
      storeName: app.storeName ?? f.storeName,
      storeAddress: pickup?.addressLine1 ?? app.storeAddress ?? f.storeAddress,
      addressLine2: pickup?.addressLine2 ?? f.addressLine2,
      landmark: pickup?.landmark ?? f.landmark,
      pickupInstructions: pickup?.pickupInstructions ?? f.pickupInstructions,
      googlePlaceId: pickup?.googlePlaceId ?? f.googlePlaceId,
      formattedAddress: pickup?.formattedAddress ?? f.formattedAddress,
      state: pickup?.state ?? app.state ?? f.state,
      city: pickup?.city ?? app.city ?? f.city,
      cityId: app.cityId ?? f.cityId,
      locality: pickup?.locality ?? app.locality ?? f.locality,
      pincode: pickup?.pincode ?? app.pincode ?? f.pincode,
      locationPincodeId: app.locationPincodeId ?? f.locationPincodeId,
      locationAreaId: app.locationAreaId ?? f.locationAreaId,
      locationCityId: app.locationCityId ?? f.locationCityId,
      latitude: pickup?.latitude ?? app.latitude ?? f.latitude,
      longitude: pickup?.longitude ?? app.longitude ?? f.longitude,
      deliveryRadiusKm: app.deliveryRadiusKm ?? f.deliveryRadiusKm,
      deliveryCoverageInput: Array.isArray(app.deliveryCoveragePincodes)
        ? (app.deliveryCoveragePincodes as string[]).filter((p) => p !== app.pincode).join(', ')
        : f.deliveryCoverageInput,
      storeLogoUrl: app.storeLogoUrl ?? f.storeLogoUrl,
      storeBannerUrl: app.storeBannerUrl ?? f.storeBannerUrl,
      ownerPhotoUrl: app.ownerPhotoUrl ?? f.ownerPhotoUrl,
      accountHolderName: app.bankAccount?.accountHolderName ?? f.accountHolderName,
      accountNumber: app.bankAccount?.accountNumber ?? f.accountNumber,
      confirmAccountNumber: app.bankAccount?.accountNumber ?? f.confirmAccountNumber,
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
      if (!EDITABLE_APPLICATION_STATUSES.has(app.status)) {
        router.replace('/onboarding');
        toast('Signed in successfully!', 'success');
        return;
      }
      if (!onboardingOnly) {
        router.replace('/onboarding');
        toast('Account ready — continue your onboarding.', 'success');
        return;
      }
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

  // Build a draft payload (no stepKey) from the current form so in-progress
  // fields can be persisted server-side without marking a step complete.
  const buildDraftPayload = useCallback((): Record<string, unknown> => {
    const city = cities.find((c) => c.id === form.cityId);
    const payload: Record<string, unknown> = {
      ownerName: form.ownerName.trim() || undefined,
      businessName: form.businessName.trim() || undefined,
      businessTypes: form.businessTypes.length ? form.businessTypes : undefined,
      gstNumber: form.gstNumber.trim() || undefined,
      panNumber: form.panNumber.trim() || undefined,
      storeName: form.storeName.trim() || undefined,
      storeAddress: form.storeAddress.trim() || undefined,
      storeLogoUrl: form.storeLogoUrl || undefined,
      storeBannerUrl: form.storeBannerUrl || undefined,
      ownerPhotoUrl: form.ownerPhotoUrl || undefined,
      deliveryRadiusKm: form.deliveryRadiusKm,
      locality: form.locality.trim() || undefined,
      state: form.state.trim() || undefined,
      city: (city?.name ?? form.operationalCityName ?? form.city) || undefined,
      cityId: form.cityId || undefined,
      pincode: form.pincode.trim() || undefined,
      locationPincodeId: form.locationPincodeId || undefined,
      locationAreaId: form.locationAreaId || undefined,
      locationCityId: form.locationCityId || undefined,
    };
    if (form.latitude != null) payload.latitude = form.latitude;
    if (form.longitude != null) payload.longitude = form.longitude;
    if (form.storeAddress.trim() || form.pincode.trim()) {
      payload.pickupAddress = {
        addressLine1: form.storeAddress.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        locality: form.locality.trim(),
        landmark: form.landmark.trim(),
        city: city?.name ?? (form.operationalCityName || form.city),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        pickupInstructions: form.pickupInstructions.trim() || undefined,
        googlePlaceId: form.googlePlaceId || undefined,
        formattedAddress: form.formattedAddress || undefined,
      };
    }
    return payload;
  }, [form, cities]);

  // Debounced autosave: continuously persist the merchant's in-progress fields
  // as a draft so nothing is lost if the browser is handed to another account
  // mid-onboarding (e.g. a referrer switching to their own login).
  useEffect(() => {
    if (booting || step < 1) return;
    const handle = setTimeout(() => {
      void updateOnboardingStep(buildDraftPayload()).catch(() => {
        /* draft autosave is best-effort; step saves remain authoritative */
      });
    }, 1500);
    return () => clearTimeout(handle);
  }, [booting, step, buildDraftPayload]);

  const nextFromBusiness = async () => {
    if (!form.ownerName.trim()) {
      setFieldErrors((prev) => ({ ...prev, ownerName: 'Owner full name is required.' }));
      toast('Owner name is required', 'error');
      return;
    }
    if (!form.businessName.trim()) {
      setFieldErrors((prev) => ({ ...prev, businessName: 'Business / legal name is required.' }));
      toast('Business name is required', 'error');
      return;
    }
    if (form.businessTypes.length === 0) {
      setFieldErrors((prev) => ({ ...prev, categories: 'Select at least one business type.' }));
      toast('Select at least one business type', 'error');
      return;
    }
    const phoneForSave = needsPhone
      ? normalizeIndianPhone(contactPhone)
      : normalizeIndianPhone(verifiedPhone);
    if (!isValidIndianPhone(phoneForSave)) {
      setFieldErrors((prev) => ({ ...prev, contactPhone: 'Enter a valid 10-digit mobile number.' }));
      toast('Enter a valid 10-digit mobile number', 'error');
      return;
    }
    // A merchant who signed up by phone has no verified email, but the
    // application still requires one for review/notifications — collect it here.
    const emailForSave = (verifiedEmail || form.ownerEmail).trim().toLowerCase();
    if (!verifiedEmail && !EMAIL_RE.test(emailForSave)) {
      setFieldErrors((prev) => ({ ...prev, ownerEmail: 'Enter a valid email address.' }));
      toast('Enter a valid email address', 'error');
      return;
    }
    try {
      await saveStep('VERIFY', {
        ownerName: form.ownerName.trim(),
        ownerEmail: emailForSave || undefined,
        ownerPhone: phoneForSave,
      });
      await saveStep('BUSINESS', {
        businessName: form.businessName.trim(),
        businessType: form.businessTypes[0],
        businessTypes: form.businessTypes,
      });
      setVerifiedPhone(phoneForSave);
      setNeedsPhone(false);
      setStep(2);
    } catch (e) {
      handleStepError(e);
    }
  };

  const nextFromStoreBasics = async () => {
    if (!form.storeName.trim() || !form.storeLogoUrl || !form.storeBannerUrl) {
      if (!form.storeName.trim()) {
        setFieldErrors((prev) => ({ ...prev, storeName: 'Store display name is required.' }));
      }
      toast('Store name, logo, and banner are required', 'error');
      return;
    }
    try {
      await saveStep('STORE', {
        storeName: form.storeName.trim(),
        storeLogoUrl: form.storeLogoUrl,
        storeBannerUrl: form.storeBannerUrl,
        ownerPhotoUrl: form.ownerPhotoUrl || undefined,
      });
      setStep(3);
    } catch (e) {
      handleStepError(e);
    }
  };

  const getPickupAddressIssues = () => {
    const issues: string[] = [];
    if (form.storeAddress.trim().length < 8) {
      issues.push('shop/building/street address');
    }
    if (isBroadPickupAddress(form.storeAddress, form.locality, form.city)) {
      issues.push('specific shop/building details');
    }
    if (!form.locality.trim()) issues.push('locality');
    if (form.landmark.trim().length < 3) issues.push('landmark');
    if (!form.city.trim()) issues.push('city');
    if (!form.state.trim()) issues.push('state');
    if (!/^\d{6}$/.test(form.pincode.trim())) issues.push('6-digit pincode');
    if (form.latitude == null || form.longitude == null) issues.push('map pin');
    return issues;
  };

  const nextFromLocation = async () => {
    if (resolvingLocation) {
      toast('Resolving location…', 'info');
      return;
    }
    const issues = getPickupAddressIssues();
    if (issues.length) {
      toast(`Complete pickup address: ${issues.join(', ')}`, 'error');
      return;
    }
    const city = cities.find((c) => c.id === form.cityId);
    try {
      await saveStep('LOCATION', {
        storeAddress: form.storeAddress.trim(),
        pickupAddress: {
          addressLine1: form.storeAddress.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          locality: form.locality.trim(),
          landmark: form.landmark.trim(),
          city: city?.name ?? (form.operationalCityName || form.city),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          latitude: form.latitude,
          longitude: form.longitude,
          pickupInstructions: form.pickupInstructions.trim() || undefined,
          googlePlaceId: form.googlePlaceId || undefined,
          formattedAddress: form.formattedAddress || undefined,
        },
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
      });
      setStep(4);
    } catch (e) {
      handleStepError(e);
    }
  };

  const nextFromCategories = async () => {
    if (form.preferredCategories.length === 0) {
      setFieldErrors((prev) => ({ ...prev, categories: 'Select at least one category you plan to sell.' }));
      toast('Select at least one category you plan to sell', 'error');
      return;
    }
    try {
      await updateOnboardingStep({
        stepKey: 'CATEGORIES',
        businessType: form.preferredCategories[0],
        businessTypes: form.preferredCategories,
      });
      setForm((f) => ({ ...f, businessTypes: [...f.preferredCategories] }));
      setStep(6);
    } catch (e) {
      handleStepError(e);
    }
  };

  const nextFromKyc = async () => {
    if (!form.panNumber.trim()) {
      setFieldErrors((prev) => ({ ...prev, panNumber: 'PAN number is required.' }));
      toast('PAN number is required', 'error');
      return;
    }
    try {
      await saveStep('GST_PAN', {
        businessName: form.businessName.trim(),
        businessType: form.businessTypes[0],
        businessTypes: form.businessTypes,
        gstNumber: form.gstNumber || undefined,
        panNumber: form.panNumber.trim().toUpperCase(),
      });
      setStep(7);
    } catch (e) {
      handleStepError(e);
    }
  };

  const checkGst = async () => {
    if (!form.gstNumber) return;
    try {
      const res = await validateGst(form.gstNumber);
      setForm((f) => ({ ...f, gstValid: res.valid }));
      toast(res.message, res.valid ? 'success' : 'error');
    } catch (e) {
      handleStepError(e);
    }
  };

  const saveStoreDetails = async () => {
    const pickupIssues = getPickupAddressIssues();
    if (
      !form.storeName.trim() ||
      pickupIssues.length > 0 ||
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
        stepKey: 'DELIVERY',
        storeName: form.storeName.trim(),
        storeAddress: form.storeAddress.trim(),
        pickupAddress: {
          addressLine1: form.storeAddress.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          locality: form.locality.trim(),
          landmark: form.landmark.trim(),
          city: city?.name ?? (form.operationalCityName || form.city),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          latitude: form.latitude,
          longitude: form.longitude,
          pickupInstructions: form.pickupInstructions.trim() || undefined,
          googlePlaceId: form.googlePlaceId || undefined,
          formattedAddress: form.formattedAddress || undefined,
        },
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
        ownerPhotoUrl: form.ownerPhotoUrl || undefined,
      });
      setStep(5);
    } catch (e) {
      handleStepError(e);
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
      latitude: selection.lat ?? null,
      longitude: selection.lng ?? null,
      googlePlaceId: selection.googlePlaceId ?? f.googlePlaceId,
      formattedAddress: selection.formattedAddress ?? f.formattedAddress,
      addressLine2: selection.line2 ?? f.addressLine2,
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
          latitude: selection.lat!,
          longitude: selection.lng!,
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
          latitude: selection.lat!,
          longitude: selection.lng!,
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
          handleStepError(e);
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
        handleStepError(e);
      }
    };
    reader.readAsDataURL(file);
  };

  const nextFromBank = async () => {
    if (!form.accountHolderName.trim() || !form.accountNumber.trim() || !form.ifsc.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        accountHolderName: !form.accountHolderName.trim() ? 'Account holder name is required.' : prev.accountHolderName,
        accountNumber: !form.accountNumber.trim() ? 'Account number is required.' : prev.accountNumber,
        ifsc: !form.ifsc.trim() ? 'IFSC code is required.' : prev.ifsc,
      }));
      toast('Bank account details are required', 'error');
      return;
    }
    if (form.accountNumber !== form.confirmAccountNumber) {
      setFieldErrors((prev) => ({ ...prev, confirmAccountNumber: 'Account numbers do not match.' }));
      toast('Account numbers do not match', 'error');
      return;
    }
    await saveBankAccount({
      accountHolderName: form.accountHolderName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifsc: form.ifsc.trim().toUpperCase(),
      upiId: form.upiId.trim() || undefined,
    });
    await saveStep('BANK');
    setStep(8);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await updateOnboardingStep({
        stepKey: 'REVIEW',
        declarationAccepted,
        submittedForApproval: false,
      });
      await submitApplication();
      toast('Application submitted! We will review it shortly.', 'success');
      setShowStatus(true);
    } catch (e) {
      // If submission failed because fields are missing, jump the merchant to the
      // earliest step that needs fixing and highlight the field there — instead
      // of leaving them stuck on the review screen with a raw error.
      const raw = e instanceof Error ? e.message : '';
      const match = /incomplete:\s*(.+)$/i.exec(raw);
      if (match) {
        const tokens = match[1]
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        let targetStep = Number.POSITIVE_INFINITY;
        let firstToken = '';
        for (const t of tokens) {
          const s = FIELD_TO_STEP[t];
          if (s != null && s < targetStep) {
            targetStep = s;
            firstToken = t;
          }
        }
        if (Number.isFinite(targetStep)) {
          const feKey = fieldForBackendMessage(readableBackendMessage(firstToken));
          if (feKey) {
            setFieldErrors((prev) => ({ ...prev, [feKey]: 'This field is required to submit.' }));
          }
          setStep(targetStep);
          toast(
            `Please complete: ${tokens.map((t) => readableBackendMessage(t)).join(', ')}`,
            'error',
          );
          return;
        }
      }
      handleStepError(e);
    } finally {
      setSaving(false);
    }
  };

  if (showStatus) return <OnboardingStatusContent />;

  const progressStep = onboardingOnly ? step - 1 : step;

  return (
    <MarketingShell>
      <div className={onboardingOnly ? 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8' : 'mx-auto max-w-2xl px-4 py-10'}>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            {onboardingOnly ? 'Continue your onboarding' : 'Become a JebDekho Partner'}
          </h1>
          <p className="mt-2 text-slate-600">
            {onboardingOnly
              ? 'Your draft is saved after every step. Approval usually takes 24–48 hours.'
              : 'Create your merchant account, then continue onboarding on one dedicated page.'}
          </p>
        </div>

        <div className="mt-8 flex gap-1 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <div key={label} className="min-w-[3rem] flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i <= progressStep ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              />
              <p
                className={`mt-1.5 truncate text-center text-[10px] font-medium ${
                  i <= progressStep ? 'text-brand-700' : 'text-slate-400'
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          {computeWizardProgress(progressStep)}% complete — {saving ? 'Saving…' : 'Draft saved'}
        </p>

        <div className={onboardingOnly ? 'mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]' : ''}>
          {onboardingOnly && (
            <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start selling after approval
              </p>
              <ol className="mt-4 space-y-2">
                {STEPS.slice(1).map((label, index) => {
                  const visualStep = index + 1;
                  const active = step === visualStep;
                  const done = step > visualStep;
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        onClick={() => setStep(visualStep)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                          active
                            ? 'bg-brand-50 text-brand-700'
                            : done
                              ? 'text-slate-800 hover:bg-slate-50'
                              : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            done
                              ? 'bg-brand-600 text-white'
                              : active
                                ? 'bg-brand-100 text-brand-700'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {done ? '✓' : visualStep}
                        </span>
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-medium text-slate-800">Need help?</p>
                <p className="mt-1">Contact support@jebdekho.com</p>
              </div>
            </aside>
          )}

          <div>
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
                <MerchantAuthTabs
                  mode="signup"
                  onVerified={handleVerified}
                  onAccountExists={(email) => router.push(`/login?email=${encodeURIComponent(email)}`)}
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
                {!verifiedEmail && (
                  <Input
                    label="Store contact email *"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.ownerEmail}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, ownerEmail: undefined }));
                      setForm({ ...form, ownerEmail: e.target.value });
                    }}
                    placeholder="Used for order & payout notifications"
                    error={fieldErrors.ownerEmail}
                  />
                )}
                {needsPhone && (
                  <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
                    <span className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                      +91
                    </span>
                    <div className="min-w-0">
                      <Input
                        label="Store contact mobile *"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => {
                          setFieldErrors((prev) => ({ ...prev, contactPhone: undefined }));
                          setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        }}
                        placeholder="10-digit number for orders & OTP"
                        error={fieldErrors.contactPhone}
                      />
                    </div>
                  </div>
                )}
                <Input
                  label="Owner full name *"
                  placeholder="As per PAN / GST"
                  value={form.ownerName}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, ownerName: undefined }));
                    setForm({ ...form, ownerName: e.target.value });
                  }}
                  error={fieldErrors.ownerName}
                />
                <Input
                  label="Business / legal name *"
                  value={form.businessName}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, businessName: undefined }));
                    setForm({ ...form, businessName: e.target.value });
                  }}
                  error={fieldErrors.businessName}
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
                  label="Store display name *"
                  value={form.storeName}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, storeName: undefined }));
                    setForm({ ...form, storeName: e.target.value });
                  }}
                  error={fieldErrors.storeName}
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
                  <ImageUploadField
                    label="Your photo (for your shareable card)"
                    mode="square"
                    purpose="owner-photo"
                    value={form.ownerPhotoUrl}
                    onChange={(url) => setForm((f) => ({ ...f, ownerPhotoUrl: url }))}
                  />
                </div>
                <NavButtons saving={false} onBack={() => setStep(1)} onNext={nextFromStoreBasics} />
              </div>
            )}

            {!booting && step === 3 && (
              <div className="space-y-4">
                <StepHeader
                  title="Pickup address"
                  subtitle="Add the exact shop address delivery partners will use for pickup"
                />
                <Input
                  label="Shop / Building / Floor / Street address line 1 *"
                  placeholder="Example: E-110, Ground Floor, Windsor Street"
                  value={form.storeAddress}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, storeAddress: undefined }));
                    setForm({ ...form, storeAddress: e.target.value });
                  }}
                  error={fieldErrors.storeAddress}
                />
                <Input
                  label="Address line 2 (optional)"
                  placeholder="Market, complex, lane, or nearby gate"
                  value={form.addressLine2}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                />
                <MerchantAddressPicker
                  searchLabel="Search exact store address on Google"
                  mapHeightClassName="h-56 sm:h-72"
                  showSelectionSummary={false}
                  value={{
                    locality: form.locality,
                    city: form.city,
                    state: form.state,
                    pincode: form.pincode,
                    lat: form.latitude ?? undefined,
                    lng: form.longitude ?? undefined,
                    formattedAddress: form.formattedAddress,
                    googlePlaceId: form.googlePlaceId,
                  }}
                  onChange={(selection) => {
                    void applyLocationSelection({
                      locality: selection.locality,
                      city: selection.city,
                      state: selection.state,
                      pincode: selection.pincode,
                      lat: selection.lat,
                      lng: selection.lng,
                      line1: selection.line1,
                      line2: selection.line2,
                      formattedAddress: selection.formattedAddress,
                      googlePlaceId: selection.googlePlaceId,
                      locationPincodeId: selection.locationPincodeId,
                      locationAreaId: selection.locationAreaId,
                      locationCityId: selection.locationCityId,
                    });
                  }}
                  onLine1Suggestion={(line1) => setForm((f) => (
                    f.storeAddress.trim() ? f : { ...f, storeAddress: line1 }
                  ))}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Locality / Area *"
                    placeholder="Raj Nagar Extension"
                    value={form.locality}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, locality: undefined }));
                      setForm({ ...form, locality: e.target.value });
                    }}
                    error={fieldErrors.locality}
                  />
                  <Input
                    label="Landmark *"
                    placeholder="Near main gate, bank, school, etc."
                    value={form.landmark}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, landmark: undefined }));
                      setForm({ ...form, landmark: e.target.value });
                    }}
                    error={fieldErrors.landmark}
                  />
                  <Input
                    label="City *"
                    placeholder="Your city"
                    value={form.city}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, city: undefined }));
                      setForm({ ...form, city: e.target.value });
                    }}
                    error={fieldErrors.city}
                  />
                  <Input
                    label="State *"
                    placeholder="Uttar Pradesh"
                    value={form.state}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, state: undefined }));
                      setForm({ ...form, state: e.target.value });
                    }}
                    error={fieldErrors.state}
                  />
                </div>
                <Input
                  label="Pickup instructions (optional)"
                  placeholder="Call before pickup, enter from back gate, etc."
                  value={form.pickupInstructions}
                  onChange={(e) => setForm({ ...form, pickupInstructions: e.target.value })}
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
                {form.locality && (!/^\d{6}$/.test(form.pincode) || !form.cityId) && (
                  <Input
                    label="Pincode *"
                    placeholder="6-digit pincode"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => {
                      const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setFieldErrors((prev) => ({ ...prev, pincode: undefined }));
                      setForm((f) => ({ ...f, pincode: pin }));
                      if (/^\d{6}$/.test(pin)) {
                        applyLocationSelection({
                          locality: form.locality,
                          city: form.city,
                          state: form.state,
                          pincode: pin,
                          lat: form.latitude,
                          lng: form.longitude,
                          locationPincodeId: form.locationPincodeId || undefined,
                          locationAreaId: form.locationAreaId || undefined,
                          locationCityId: form.locationCityId || undefined,
                        });
                      }
                    }}
                    onBlur={() => {
                      if (/^\d{6}$/.test(form.pincode)) {
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
                {fieldErrors.pincode && (
                  <p className="text-xs text-red-600">{fieldErrors.pincode}</p>
                )}
                {isBroadPickupAddress(form.storeAddress, form.locality, form.city) && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    This looks like a broad area. Please add shop number, building name, street, and landmark.
                  </p>
                )}
                {form.locality && !/^\d{6}$/.test(form.pincode) && !resolvingLocation && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    We couldn't detect the exact address automatically. Please enter your pickup address manually.
                  </p>
                )}
                {form.locality && /^\d{6}$/.test(form.pincode) && form.expansionArea && !resolvingLocation && (
                  <p className="text-xs text-amber-700">
                    Expansion area — delivery subject to approval after signup
                  </p>
                )}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Pickup address preview</p>
                  <p className="mt-2">{form.storeAddress || 'Shop/building/street address pending'}</p>
                  {form.addressLine2 && <p>{form.addressLine2}</p>}
                  <p>{[form.locality, form.landmark && `Landmark: ${form.landmark}`].filter(Boolean).join(' · ') || 'Locality and landmark pending'}</p>
                  <p>{[form.city, form.state, form.pincode].filter(Boolean).join(', ') || 'City, state, and pincode pending'}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Coordinates: {form.latitude != null && Number.isFinite(form.latitude) ? form.latitude.toFixed(6) : 'pending'}, {form.longitude != null && Number.isFinite(form.longitude) ? form.longitude.toFixed(6) : 'pending'}
                  </p>
                </div>
                {getPickupAddressIssues().length > 0 && (
                  <p className="text-xs text-slate-500">
                    To continue, add: {getPickupAddressIssues().join(', ')}.
                  </p>
                )}
                <NavButtons
                  saving={resolvingLocation}
                  disabled={getPickupAddressIssues().length > 0}
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
                  label="Delivery radius (km) *"
                  type="number"
                  value={form.deliveryRadiusKm}
                  onChange={(e) => setForm({ ...form, deliveryRadiusKm: Number(e.target.value) })}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Delivery coverage pincodes (optional)</label>
                  <p className="mb-2 text-xs text-slate-500">
                    Store pincode {form.pincode ? `(${form.pincode})` : ''} is included. Add more comma-separated pincodes.
                  </p>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={3}
                    placeholder="201204, 201003, 110094"
                    value={form.deliveryCoverageInput}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, deliveryCoverage: undefined }));
                      setForm({ ...form, deliveryCoverageInput: e.target.value });
                    }}
                  />
                  {fieldErrors.deliveryCoverage && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.deliveryCoverage}</p>
                  )}
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
                <StepHeader
                  title="GST & PAN"
                  subtitle="PAN is required. GST only if you are registered — under ₹20 lakh turnover you can sell without it."
                />
                <div className="flex gap-2">
                  <Input
                    label="GSTIN (optional)"
                    placeholder="15-character GST"
                    value={form.gstNumber}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, gstNumber: undefined }));
                      setForm({ ...form, gstNumber: e.target.value.toUpperCase() });
                    }}
                    className="flex-1"
                    error={fieldErrors.gstNumber}
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
                  label="PAN number *"
                  value={form.panNumber}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, panNumber: undefined }));
                    setForm({ ...form, panNumber: e.target.value.toUpperCase() });
                  }}
                  error={fieldErrors.panNumber}
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
                  label="Account holder name *"
                  value={form.accountHolderName}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, accountHolderName: undefined }));
                    setForm({ ...form, accountHolderName: e.target.value });
                  }}
                  error={fieldErrors.accountHolderName}
                />
                <Input
                  label="Account number *"
                  value={form.accountNumber}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, accountNumber: undefined }));
                    setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') });
                  }}
                  error={fieldErrors.accountNumber}
                />
                <Input
                  label="Confirm account number *"
                  value={form.confirmAccountNumber}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, confirmAccountNumber: undefined }));
                    setForm({ ...form, confirmAccountNumber: e.target.value.replace(/\D/g, '') });
                  }}
                  error={fieldErrors.confirmAccountNumber}
                />
                <Input
                  label="IFSC code *"
                  value={form.ifsc}
                  onChange={(e) => {
                    setFieldErrors((prev) => ({ ...prev, ifsc: undefined }));
                    setForm({ ...form, ifsc: e.target.value.toUpperCase() });
                  }}
                  error={fieldErrors.ifsc}
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
                  <ReviewRow label="Email" value={verifiedEmail || form.ownerEmail || '—'} />
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
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                  />
                  <span>I confirm the information is correct.</span>
                </label>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(7)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button className="flex-1" loading={saving} disabled={!declarationAccepted} onClick={handleSubmit}>
                    Submit application
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
      <p className="mt-2 text-xs font-medium text-slate-500">Fields marked * are required.</p>
    </div>
  );
}

function NavButtons({
  saving,
  disabled = false,
  onBack,
  onNext,
  nextLabel = 'Continue',
}: {
  saving: boolean;
  disabled?: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <Button variant="secondary" onClick={onBack}>
        <ChevronLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <Button className="flex-1" loading={saving} disabled={disabled} onClick={onNext}>
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
