'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, User } from 'lucide-react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { Logo } from '@/components/brand/logo';
import { LocationPickerModal } from '@/features/location/components/location-picker-modal';
import { ProfileSetupModal } from '@/features/profile/components/profile-setup-modal';
import { Button, Container, Text } from '@/design-system/primitives';
import { useAuthStore } from '@/store/auth-store';
import { useLocationStore } from '@/store/location-store';
import { useProfileStore } from '@/store/profile-store';

type OnboardingStep = 'profile' | 'location';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding: completeAuthOnboarding } = useAuthStore();
  const { isReady: locationReady } = useLocationStore();
  const { onboardingCompleted, completeOnboarding: completeProfileOnboarding } = useProfileStore();

  const [step, setStep] = useState<OnboardingStep>('profile');
  const [profileDone, setProfileDone] = useState(onboardingCompleted);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const finish = () => {
    completeProfileOnboarding();
    completeAuthOnboarding();
    router.replace('/stores');
  };

  return (
    <AuthGuard>
      <div className="s2-root min-h-screen bg-neutral-50">
        <Container size="sm" className="py-12">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" priority />
          </div>
          <Text variant="h1" as="h1" className="text-center">
            Welcome aboard
          </Text>
          <Text variant="bodySm" className="mt-2 text-center">
            Two quick steps before you start shopping
          </Text>

          <div className="mt-10 space-y-4">
            <StepCard
              icon={User}
              title="Your profile"
              done={profileDone}
              active={step === 'profile'}
              onClick={() => setStep('profile')}
            />
            <StepCard
              icon={MapPin}
              title="Delivery location"
              done={locationReady}
              active={step === 'location'}
              onClick={() => setStep('location')}
            />
          </div>

          {step === 'location' && !locationReady && (
            <Button fullWidth className="mt-8" onClick={() => setLocationModalOpen(true)}>
              Set delivery location
            </Button>
          )}

          {locationReady && (
            <Button fullWidth className="mt-8" onClick={finish}>
              Start shopping
            </Button>
          )}
        </Container>

        <ProfileSetupModal
          open={step === 'profile' && !profileDone}
          phone={user?.phone ?? ''}
          email={user?.email}
          onComplete={() => {
            setProfileDone(true);
            setStep('location');
            setLocationModalOpen(true);
          }}
        />

        <LocationPickerModal
          open={locationModalOpen || (step === 'location' && !locationReady)}
          onClose={() => setLocationModalOpen(false)}
          required={step === 'location' && !locationReady}
          onConfirm={() => {
            setLocationModalOpen(false);
          }}
        />
      </div>
    </AuthGuard>
  );
}

function StepCard({
  icon: Icon,
  title,
  done,
  active,
  onClick,
}: {
  icon: typeof User;
  title: string;
  done: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-colors ${
        active ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-200 bg-white'
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          done ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1">
        <Text variant="label">{title}</Text>
        <Text variant="caption">{done ? 'Completed' : 'Pending'}</Text>
      </div>
    </button>
  );
}
