import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useLocationStore } from '@/store/location-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AddressLabel, BuyerAddress, UpsertAddressPayload } from '@/types/address';

const LABELS: { value: AddressLabel; text: string; emoji: string }[] = [
  { value: 'HOME', text: 'Home', emoji: '🏠' },
  { value: 'WORK', text: 'Work', emoji: '💼' },
  { value: 'OTHER', text: 'Other', emoji: '📍' },
];

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  danger: '#dc2626',
};

/**
 * Add/edit form for a saved address. Coordinates come from the device's
 * current location (there is no map picker in this app yet) — editing an
 * existing address keeps its stored coordinates unless the buyer re-pins.
 */
export function AddressForm({
  initial,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: BuyerAddress;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: UpsertAddressPayload) => void;
  onCancel: () => void;
}) {
  const { lat, lng } = useLocationStore();

  const [label, setLabel] = useState<AddressLabel>(initial?.label ?? 'HOME');
  const [line1, setLine1] = useState(initial?.line1 ?? '');
  const [line2, setLine2] = useState(initial?.line2 ?? '');
  const [landmark, setLandmark] = useState(initial?.landmark ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [pincode, setPincode] = useState(initial?.pincode ?? '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial ? { lat: initial.latitude, lng: initial.longitude } : null,
  );

  const effectiveCoords = coords ?? (lat != null && lng != null ? { lat, lng } : null);
  const complete =
    line1.trim().length >= 4 &&
    city.trim().length >= 2 &&
    /^\d{6}$/.test(pincode) &&
    effectiveCoords != null;

  const handleSubmit = () => {
    if (!effectiveCoords) return;
    onSubmit({
      label,
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      // The service falls back to the state resolved from the pincode.
      state: '',
      pincode: pincode.trim(),
      latitude: effectiveCoords.lat,
      longitude: effectiveCoords.lng,
      isDefault,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{initial ? 'Edit address' : 'Add new address'}</Text>

        <View style={styles.labelRow}>
          {LABELS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.labelChip, label === option.value && styles.labelChipActive]}
              onPress={() => setLabel(option.value)}
            >
              <Text
                style={[styles.labelChipText, label === option.value && styles.labelChipTextActive]}
              >
                {option.emoji} {option.text}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label="House / flat / street" value={line1} onChangeText={setLine1} placeholder="42 MG Road" />
        <Input
          label="Area / apartment (optional)"
          value={line2}
          onChangeText={setLine2}
          placeholder="Tower B, 4th floor"
        />
        <Input
          label="Landmark (optional)"
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Opposite the metro station"
        />
        <Input label="City" value={city} onChangeText={setCity} placeholder="New Delhi" />
        <Input
          label="Pincode"
          value={pincode}
          onChangeText={(t) => setPincode(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="110001"
        />

        <View style={styles.coordsCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.coordsTitle}>Map location</Text>
            <Text style={styles.coordsValue}>
              {effectiveCoords
                ? `${effectiveCoords.lat.toFixed(4)}, ${effectiveCoords.lng.toFixed(4)}`
                : 'Not set — enable location access'}
            </Text>
          </View>
          {lat != null && lng != null && (
            <Pressable onPress={() => setCoords({ lat, lng })}>
              <Text style={styles.coordsAction}>Use current</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Set as default</Text>
            <Text style={styles.switchHint}>Preselected at checkout.</Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ true: COLORS.primary }}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.footerButton} />
        <Button
          label={initial ? 'Save changes' : 'Save address'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={!complete}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },

  labelRow: { flexDirection: 'row', gap: 8 },
  labelChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  labelChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  labelChipText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  labelChipTextActive: { color: '#fff' },

  coordsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  coordsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  coordsValue: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  coordsAction: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  switchLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  switchHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  error: { fontSize: 13, color: COLORS.danger },

  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  footerButton: { flex: 1 },
});
