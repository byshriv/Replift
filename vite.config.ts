import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom'], validation: ['zod'] },
      },
    },
  },
  server: { fs: { deny: ['.env', '.env.*', '**/.git/**', '**/reference/**'] } },
});
