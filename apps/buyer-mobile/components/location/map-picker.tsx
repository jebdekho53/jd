import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region, type LatLng } from 'react-native-maps';

export interface MapPickerPosition {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  position: MapPickerPosition;
  onPositionChange: (position: MapPickerPosition) => void;
  disabled?: boolean;
  address?: string;
}

// India-wide fallback, matches @jebdekho/google-maps' MAP_INITIAL_VISUAL_CENTER
// so the picker looks the same before a position is known.
const FALLBACK_CENTER = { lat: 20.5937, lng: 78.9629 };
const FOCUS_DELTA = 0.005; // roughly the same visual zoom as web's focusZoom=17
const FALLBACK_DELTA = 12;

/**
 * RN counterpart of @jebdekho/google-maps' GoogleMapPicker — tap the map or
 * drag the marker to set the exact pin, same interaction as web. Renders via
 * PROVIDER_GOOGLE on iOS (EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY, wired into
 * app.config.js); Android has no Maps SDK key configured yet, so tiles won't
 * render there until one is added — see app.config.js's android block.
 */
export function MapPicker({ position, onPositionChange, disabled, address }: MapPickerProps) {
  const mapRef = useRef<MapView>(null);
  const hasPosition = Number.isFinite(position.lat) && Number.isFinite(position.lng);
  const center = hasPosition ? position : FALLBACK_CENTER;

  const [region, setRegion] = useState<Region>({
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: hasPosition ? FOCUS_DELTA : FALLBACK_DELTA,
    longitudeDelta: hasPosition ? FOCUS_DELTA : FALLBACK_DELTA,
  });

  // A drag/tap on the map already knows its own new position — re-animating
  // the camera to it on the next prop update would fight the gesture and
  // read as "the pin snapped back". Only externally-driven changes (search
  // selection, GPS) should recenter the camera.
  const skipNextRecenter = useRef(false);

  useEffect(() => {
    if (!hasPosition) return;
    if (skipNextRecenter.current) {
      skipNextRecenter.current = false;
      return;
    }
    const next = {
      latitude: position.lat,
      longitude: position.lng,
      latitudeDelta: FOCUS_DELTA,
      longitudeDelta: FOCUS_DELTA,
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.lat, position.lng]);

  const reportPosition = (coordinate: LatLng) => {
    if (disabled) return;
    skipNextRecenter.current = true;
    onPositionChange({ lat: coordinate.latitude, lng: coordinate.longitude });
  };

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onPress={(e) => reportPosition(e.nativeEvent.coordinate)}
        scrollEnabled={!disabled}
        zoomEnabled={!disabled}
      >
        {hasPosition && (
          <Marker
            coordinate={{ latitude: position.lat, longitude: position.lng }}
            draggable={!disabled}
            onDragEnd={(e) => reportPosition(e.nativeEvent.coordinate)}
            title={address || 'Selected location'}
            pinColor="#2E5E4E"
          />
        )}
      </MapView>
      <View pointerEvents="none" style={styles.hint}>
        <Text style={styles.hintText}>Tap the map or drag the pin to set the exact spot</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  map: { flex: 1 },
  hint: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    alignItems: 'center',
  },
  hintText: {
    backgroundColor: 'rgba(15,23,42,0.9)',
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
