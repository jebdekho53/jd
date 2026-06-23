'use client';

import { useState } from 'react';
import { Button, Input, Modal, Text } from '@/design-system/primitives';
import { useProfileStore } from '@/store/profile-store';

interface ProfileSetupModalProps {
  open: boolean;
  phone: string;
  onComplete: (displayName: string | null) => void;
  dismissible?: boolean;
  onClose?: () => void;
}

export function ProfileSetupModal({
  open,
  phone,
  onComplete,
  dismissible = false,
  onClose,
}: ProfileSetupModalProps) {
  const { setDisplayName } = useProfileStore();
  const [name, setName] = useState('');

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
      title="Welcome to Jebdekho"
      description="Tell us a bit about yourself. You can skip the name for now."
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-neutral-50 px-4 py-3">
          <Text variant="caption">Phone (verified)</Text>
          <Text variant="body" className="font-medium">
            {phone}
          </Text>
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
