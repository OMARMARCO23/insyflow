import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages, set base: '/your-repo-name/' or keep '/' for root
export default defineConfig({
  plugins: [react()],
  // base: '/insyflow/', // uncomment and adjust if deploying to GitHub Pages subpath
});