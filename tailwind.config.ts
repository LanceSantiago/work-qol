import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'winner-pop': {
          '0%':   { opacity: '0', transform: 'scale(0.7)' },
          '70%':  { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'countdown-pop': {
          '0%':   { opacity: '0', transform: 'scale(2.2)' },
          '25%':  { opacity: '1', transform: 'scale(1)' },
          '75%':  { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.8)' },
        },
      },
      animation: {
        'winner-pop':    'winner-pop 0.35s ease-out',
        'countdown-pop': 'countdown-pop 0.9s ease-in-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config
