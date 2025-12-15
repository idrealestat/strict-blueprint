import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.41fa0a4179f3419b829f2f79f7525cdc',
  appName: 'Wasata AI وساطه',
  webDir: 'dist',
  server: {
    url: 'https://41fa0a41-79f3-419b-829f-2f79f7525cdc.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    // سجل المكالمات - Call Log Plugin
    CallLog: {
      // يتطلب إذن READ_CALL_LOG على Android
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
