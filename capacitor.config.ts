import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'eg.moeco.app',
  appName: 'MoEco | بيئة مصر',
  webDir: 'dist',
  android: { allowMixedContent: false, backgroundColor: '#0b6b54' },
  plugins: { SystemBars: { insetsHandling: 'css', style: 'DARK' } }
};

export default config;
