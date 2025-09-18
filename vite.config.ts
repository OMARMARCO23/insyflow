import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: change '/REPO_NAME/' to your repo name, e.g. '/insyflow/'
export default defineConfig({
  plugins: [react()],
  base: 'insyflow/', // <-- '/insyflow/' if your repo is named insyflow
});

