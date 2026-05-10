import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0D0D0D',
          alt: '#111111',
        },
        card: {
          DEFAULT: '#1A1A1A',
          alt: '#222222',
          border: '#2A2A2A',
        },
        gold: {
          DEFAULT: '#C9A84C',
          soft: 'rgba(201,168,76,0.15)',
        },
        violet: {
          DEFAULT: '#7B2FBE',
          soft: 'rgba(123,47,190,0.15)',
        },
        text: {
          DEFAULT: '#F5F5F5',
          muted: '#A0A0A0',
          dim: '#666666',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #C9A84C, #7B2FBE)',
        'gradient-glow': 'radial-gradient(circle, rgba(123,47,190,0.18) 0%, transparent 70%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(201,168,76,0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
