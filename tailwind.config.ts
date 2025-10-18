import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1120',
        foreground: '#e2e8f0',
        accent: '#38bdf8',
        danger: '#f87171'
      }
    }
  },
  plugins: []
};

export default config;
