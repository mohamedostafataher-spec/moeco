import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'eg.moeco.app',
  appName: 'MoEco',
  webDir: 'dist',
  android: { allowMixedContent: false }
};

export default config;
