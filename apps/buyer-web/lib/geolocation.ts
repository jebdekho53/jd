export interface GeoResult {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function requestBrowserLocation(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Use manual entry instead.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Try again or enter manually.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Try again.'));
            break;
          default:
            reject(new Error('Could not get your location.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}
