import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.studyhike.app',
  appName: 'StudyHike',
  webDir: 'out',
  server: {
    // For app version, use the app-specific URL
    url: 'https://app.studyhike.in',
    // For development, you can switch back to localhost
    // url: 'http://localhost:3000',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#0C0E19",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#FFA500",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    // Biometric authentication plugin configuration
    FingerprintAuth: {
      // This would be configured when the plugin is installed
    },
    // Status bar configuration
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0C0E19'
    },
    // App configuration
    App: {
      // Handle app URL scheme for deep linking
      // This allows the app to handle studyhike:// URLs
      urlScheme: 'studyhike'
    }
  }
};

export default config;
