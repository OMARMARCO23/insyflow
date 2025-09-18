import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#badbff',
          300: '#8ec2ff',
          400: '#60a8ff',
          500: '#3f8fff',
          600: '#2c73e6',
          700: '#225abd',
          800: '#1b4694',
          900: '#14346d'
        }
      }
    }
  },
  plugins: []
} satisfies Config;