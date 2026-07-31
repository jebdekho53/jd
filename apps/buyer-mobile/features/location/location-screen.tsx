import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '@/store/location-store';
import { fetchLocationSuggestions, resolvePlace, reverseGeocode, type PlaceSuggestion } from '@/services/buyer-api';
import { uid } from '@/lib/uid';
import { MapPicker, type MapPickerPosition } from '@/components/location/map-picker';

const COLORS = {
  primary: '#2E5E4E',
  textPrimary: '#111827',
  textMuted: '#6B7280',
  cream: '#f4f1e2',
  border: '#e5e7eb',
  danger: '#dc2626',
  successBorder: '#a7f3d0',
  successBg: '#ecfdf5',
  successText: '#065f46',
};

interface Preview {
  lat: number;
  lng: number;
  label: string;
  pincode?: string;
}

/** "Location options" — GPS, search, or drag a pin on the map, mirroring
 *  buyer-web's location picker modal. Address search + reverse geocode are
 *  server-proxied (see services/buyer-api.ts) rather than calling Google
 *  directly from the device; the map tiles themselves render via
 *  react-native-maps' PROVIDER_GOOGLE (EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY on
 *  iOS — Android has no Maps SDK key configured yet, see app.config.js). */
export function LocationScreen() {
  const router = useRouter();
  const { lat, lng, label, pincode, setLocation } = useLocationStore();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed the map from wherever the buyer already is, same as web's modal.
  const [preview, setPreview] = useState<Preview | null>(
    lat != null && lng != null ? { lat, lng, label: label ?? '', pincode: pincode ?? undefined } : null,
  );

  // One session token per screen visit — bundles the autocomplete keystrokes
  // + the final place-details call into a single Google Places billing
  // session, same convention Google's own docs recommend.
  const sessionToken = useMemo(() => uid(), []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchLocationSuggestions(trimmed, sessionToken);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sessionToken]);

  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Enable it in your device settings, or search for your address instead.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      const address = await reverseGeocode(coords.lat, coords.lng);
      setLocation({
        ...coords,
        label: address?.locality || address?.city || undefined,
        pincode: address?.pincode || undefined,
      });
      router.back();
    } catch {
      setError('Could not get your current location. Try searching for your address instead.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setResolving(suggestion.placeId);
    setError(null);
    try {
      const address = await resolvePlace(suggestion.placeId, sessionToken);
      if (!address) {
        setError('Could not resolve that address. Try another search result.');
        return;
      }
      setPreview({
        lat: address.lat,
        lng: address.lng,
        label: address.locality || address.city || suggestion.mainText,
        pincode: address.pincode || undefined,
      });
      setQuery('');
      setSuggestions([]);
    } finally {
      setResolving(null);
    }
  };

  const handleMapPositionChange = async ({ lat: newLat, lng: newLng }: MapPickerPosition) => {
    // Show the pin at the new spot immediately; backfill the label once the
    // reverse geocode resolves rather than blocking the drag on it.
    setPreview((current) => ({ lat: newLat, lng: newLng, label: current?.label ?? '', pincode: current?.pincode }));
    const address = await reverseGeocode(newLat, newLng);
    if (address) {
      setPreview({
        lat: newLat,
        lng: newLng,
        label: address.locality || address.city || '',
        pincode: address.pincode || undefined,
      });
    }
  };

  const handleConfirmPreview = () => {
    if (!preview) return;
    setConfirming(true);
    setLocation({ lat: preview.lat, lng: preview.lng, label: preview.label || undefined, pincode: preview.pincode });
    setConfirming(false);
    router.back();
  };

  const showingSuggestions = query.trim().length >= 3;

  return (
    <View style={styles.container}>
      <Pressable style={styles.gpsButton} onPress={handleUseCurrentLocation} disabled={gpsLoading}>
        {gpsLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="navigate" size={18} color="#fff" />
        )}
        <Text style={styles.gpsButtonText}>{gpsLoading ? 'Locating…' : 'Use current location'}</Text>
      </Pressable>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={COLORS.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search area, street, or landmark"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
        {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {showingSuggestions ? (
        <FlatList
          data={suggestions}
          keyExtractor={(s) => s.placeId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !searching ? <Text style={styles.emptyText}>No matching addresses found.</Text> : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.suggestionRow}
              onPress={() => handleSelectSuggestion(item)}
              disabled={resolving !== null}
            >
              <Ionicons name="location-outline" size={18} color={COLORS.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionMain} numberOfLines={1}>
                  {item.mainText}
                </Text>
                {!!item.secondaryText && (
                  <Text style={styles.suggestionSecondary} numberOfLines={1}>
                    {item.secondaryText}
                  </Text>
                )}
              </View>
              {resolving === item.placeId && <ActivityIndicator size="small" color={COLORS.primary} />}
            </Pressable>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.mapSection} keyboardShouldPersistTaps="handled">
          <MapPicker
            position={preview ?? { lat: 20.5937, lng: 78.9629 }}
            onPositionChange={handleMapPositionChange}
            address={preview?.label}
          />
          {preview && (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel} numberOfLines={2}>
                {preview.label || 'Resolving address…'}
              </Text>
              {preview.pincode && <Text style={styles.previewPincode}>Pincode: {preview.pincode}</Text>}
              <Pressable style={styles.confirmButton} onPress={handleConfirmPreview} disabled={confirming}>
                <Text style={styles.confirmButtonText}>
                  {confirming ? 'Saving…' : 'Confirm this location'}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, gap: 12 },

  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  gpsButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },

  error: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },

  list: { gap: 2, paddingBottom: 24 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 24 },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionMain: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  suggestionSecondary: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },

  mapSection: { gap: 12, paddingBottom: 24 },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    backgroundColor: COLORS.successBg,
    padding: 12,
    gap: 8,
  },
  previewLabel: { fontSize: 13, fontWeight: '700', color: COLORS.successText },
  previewPincode: { fontSize: 12, color: COLORS.successText },
  confirmButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
