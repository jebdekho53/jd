// Dynamic config (replaces the old static app.json) so the iOS Google Maps
// key can come from .env instead of being hardcoded/committed. Expo CLI
// loads .env and injects EXPO_PUBLIC_* into process.env before this file
// runs, for both `expo start` and EAS Build — for the latter the same
// variable must also be set as an EAS Secret (or in eas.json's env block),
// since a local .env file never leaves this machine.
module.exports = {
  expo: {
    name: 'Jebdekho',
    slug: 'jebdekho-buyer',
    version: '0.1.0',
    orientation: 'portrait',
    scheme: 'jebdekho-buyer',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    runtimeVersion: {
      policy: 'appVersion',
    },
    icon: './assets/icon.png',
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.jebdekho.buyer',
      config: {
        // Only used by the native map picker's PROVIDER_GOOGLE — the rest of
        // the app's Maps usage (address search, reverse geocode) goes through
        // the backend, which holds its own separate server-side key.
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.jebdekho.buyer',
      // NOTE: no Android Maps SDK key configured yet. Unlike iOS (which
      // falls back to Apple Maps without a key), react-native-maps has no
      // non-Google provider on Android — without a key restricted to this
      // package name + signing SHA-1, the map picker will render blank tiles
      // on Android until one is added here as config.googleMaps.apiKey.
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Jebdekho needs your location to find stores and products near you.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
    },
  },
};
