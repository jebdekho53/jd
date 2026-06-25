'use client';

import { useState } from 'react';
import { Button, Input, Modal, Text } from '@/design-system/primitives';
import { Logo } from '@/components/brand/logo';
import { BRAND_NAME } from '@/lib/brand';
import { formatPhoneDisplay, isPlaceholderPhone } from '@/lib/phone';
import { useProfileStore } from '@/store/profile-store';

interface ProfileSetupModalProps {
  open: boolean;
  phone: string;
  email?: string | null;
  onComplete: (displayName: string | null) => void;
  dismissible?: boolean;
  onClose?: () => void;
}

export function ProfileSetupModal({
  open,
  phone,
  email,
  onComplete,
  dismissible = false,
  onClose,
}: ProfileSetupModalProps) {
  const { setDisplayName } = useProfileStore();
  const [name, setName] = useState('');
  const showEmail = Boolean(email) && isPlaceholderPhone(phone);

  const handleSubmit = () => {
    const trimmed = name.trim();
    const displayName = trimmed.length > 0 ? trimmed : null;
    setDisplayName(displayName);
    onComplete(displayName);
  };

  return (
    <Modal
      open={open}
      onClose={onClose ?? (() => {})}
      dismissible={dismissible}
      title={`Welcome to ${BRAND_NAME}`}
      description="Tell us a bit about yourself. You can skip the name for now."
      size="md"
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <div className="rounded-lg bg-neutral-50 px-4 py-3">
          {showEmail ? (
            <>
              <Text variant="caption">Email</Text>
              <Text variant="body" className="font-medium">
                {email}
              </Text>
              <Text variant="caption" className="mt-2 block text-jd-text-muted">
                Add your mobile number later from Profile for OTP login and delivery updates.
              </Text>
            </>
          ) : (
            <>
              <Text variant="caption">Phone (verified)</Text>
              <Text variant="body" className="font-medium">
                {formatPhoneDisplay(phone)}
              </Text>
            </>
          )}
        </div>

        <Input
          label="Your name (optional)"
          placeholder="How should we greet you?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
        />

        <Button fullWidth onClick={handleSubmit}>
          Continue
        </Button>
      </div>
    </Modal>
  );
}
