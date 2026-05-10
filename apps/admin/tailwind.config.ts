import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0D0D0D', alt: '#111111' },
        card: { DEFAULT: '#1A1A1A', alt: '#222222', border: '#2A2A2A' },
        gold: { DEFAULT: '#C9A84C', soft: 'rgba(201,168,76,0.08)' },
        violet: { DEFAULT: '#7B2FBE' },
        text: { DEFAULT: '#F5F5F5', muted: '#A0A0A0', dim: '#666666' },
        line: '#1E1E1E',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
