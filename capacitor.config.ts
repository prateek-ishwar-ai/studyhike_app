import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.studyhike.app',
  appName: 'Studyhike',
  webDir: 'out',
  server: {
    // Using your live domain
    url: 'https://studyhike.in',
    // For development, you can switch back to localhost if needed
    // url: 'http://localhost:3000',
    cleartext: true
  }
};

export default config;
