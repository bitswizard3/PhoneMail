import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alphastack.phonemail',
  appName: 'PhoneMail',
  webDir: 'dist',
  server: {
    // For development: connect to your backend running on your PC
    // Change this IP to your PC's LAN IP when testing on a real device
    // For production APK, remove this block and use the auto-detect in api.ts
    androidScheme: 'https',
    // Allow mixed content (http API calls from https webview)
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
  },
};

export default config;
