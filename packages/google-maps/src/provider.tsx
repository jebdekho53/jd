'use client';

import { useJsApiLoader } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  isGoogleMapsConfigured,
} from './constants';
import { GoogleMapsContext } from './google-maps-context';

function GoogleMapsScriptLoader({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'jebdekho-google-maps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  return (
    <GoogleMapsContext.Provider
      value={{
        isConfigured: true,
        isLoaded,
        loadError,
      }}
    >
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  if (!isGoogleMapsConfigured()) {
    return (
      <GoogleMapsContext.Provider value={{ isConfigured: false, isLoaded: false }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return <GoogleMapsScriptLoader>{children}</GoogleMapsScriptLoader>;
}
