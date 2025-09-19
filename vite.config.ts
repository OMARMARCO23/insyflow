import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const isVercel = !!process.env.VERCEL;

export default defineConfig({
  plugins: [react()],
  base: isVercel ? '/' : '/insyflow/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
