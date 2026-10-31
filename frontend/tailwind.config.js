/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bv: {
          bg: '#050816',
          surface: '#0A0F1E',
          card: '#0F1629',
          border: '#1E2D4A',
          'border-glow': '#00D4FF33',
        },
        cyan: {
          glow: '#00D4FF',
        },
        emerald: {
          glow: '#00FF9F',
        },
        gold: {
          glow: '#FFD700',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-cyan': '0 0 30px rgba(0,212,255,0.3)',
        'glow-emerald': '0 0 30px rgba(16,185,129,0.3)',
        'glow-gold': '0 0 30px rgba(245,158,11,0.3)',
      },
    },
  },
  plugins: [],
};
