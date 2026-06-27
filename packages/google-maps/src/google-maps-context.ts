import { createContext, useContext } from 'react';

export interface GoogleMapsContextValue {
  isConfigured: boolean;
  isLoaded: boolean;
  loadError?: Error;
}

export const GoogleMapsContext = createContext<GoogleMapsContextValue>({
  isConfigured: false,
  isLoaded: false,
});

export function useGoogleMaps(): GoogleMapsContextValue {
  return useContext(GoogleMapsContext);
}
