'use client';

import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button, Input, Modal, Text } from '@/design-system/primitives';
import { requestBrowserLocation } from '@/lib/geolocation';
import { FALLBACK_LOCATIONS, useLocationStore } from '@/store/location-store';

interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  required?: boolean;
}

export function LocationPickerModal({
  open,
  onClose,
  onConfirm,
  required = false,
}: LocationPickerModalProps) {
  const { setFromGps, setManual, setDefault } = useLocationStore();
  const [manualLabel, setManualLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGps = async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await requestBrowserLocation();
      setFromGps(pos.lat, pos.lng);
      onConfirm?.();
      if (!required) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setLoading(false);
    }
  };

  const handleManual = () => {
    const label = manualLabel.trim();
    if (label.length < 3) {
      setError('Enter at least 3 characters for your area');
      return;
    }
    // Manual entry uses preset coords until maps API in future sprint
    const preset = FALLBACK_LOCATIONS.find((l) =>
      l.label.toLowerCase().includes(label.toLowerCase()),
    ) ?? FALLBACK_LOCATIONS[0];
    setManual(preset.lat, preset.lng, label);
    onConfirm?.();
    if (!required) onClose();
  };

  const handlePreset = (preset: (typeof FALLBACK_LOCATIONS)[number]) => {
    setDefault(preset.lat, preset.lng, preset.label);
    onConfirm?.();
    if (!required) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={required ? () => {} : onClose}
      dismissible={!required}
      title="Set delivery location"
      description="We need your location to show nearby stores. Your address is never shared with merchants."
      size="md"
    >
      <div className="space-y-6">
        <Button fullWidth loading={loading} onClick={handleGps}>
          <Navigation className="h-4 w-4" aria-hidden />
          Use current location
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500">or enter manually</span>
          </div>
        </div>

        <Input
          label="Area / landmark"
          placeholder="e.g. Connaught Place, Delhi"
          value={manualLabel}
          onChange={(e) => setManualLabel(e.target.value)}
          error={error ?? undefined}
        />
        <Button variant="outline" fullWidth onClick={handleManual}>
          <MapPin className="h-4 w-4" aria-hidden />
          Save manual location
        </Button>

        <div>
          <Text variant="label" className="mb-3 block">
            Quick picks
          </Text>
          <div className="flex flex-wrap gap-2">
            {FALLBACK_LOCATIONS.map((loc) => (
              <button
                key={loc.label}
                type="button"
                onClick={() => handlePreset(loc)}
                className="rounded-full border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-emerald-500 hover:text-emerald-700"
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
