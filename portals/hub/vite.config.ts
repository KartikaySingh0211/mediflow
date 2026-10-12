import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1'
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../shared')
    }
  }
});
