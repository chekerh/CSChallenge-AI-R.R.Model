import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  /** Bundle shared from TS sources so named exports work (CJS `dist` is opaque to Rollup). */
  resolve: {
    alias: {
      '@utopiahire/shared': path.resolve(__dirname, '../shared/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
