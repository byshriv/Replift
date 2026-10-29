import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.byshriv.replift',
  appName: 'Replift',
  webDir: 'dist',
  server: { hostname: 'localhost', androidScheme: 'https' },
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
};
export default config;
