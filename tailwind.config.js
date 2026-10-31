/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // BahiVerse primary palette
        bv: {
          bg: '#050816',
          surface: '#0A0F1E',
          card: '#0F1629',
          border: '#1E2D4A',
          'border-glow': '#00D4FF33',
        },
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          glow: '#00D4FF',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          glow: '#00FF9F',
        },
        gold: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          glow: '#FFD700',
        },
        // Status colors
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#06B6D4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      backgroundImage: {
        'bv-gradient': 'linear-gradient(135deg, #050816 0%, #0A1628 50%, #050816 100%)',
        'bv-card': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        'bv-glow-cyan': 'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
        'bv-glow-emerald': 'radial-gradient(ellipse at center, rgba(16,185,129,0.15) 0%, transparent 70%)',
        'bv-glow-gold': 'radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 70%)',
        'grid-pattern': 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-hover': '0 16px 48px rgba(0,212,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glow-cyan': '0 0 30px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)',
        'glow-emerald': '0 0 30px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.1)',
        'glow-gold': '0 0 30px rgba(245,158,11,0.3), 0 0 60px rgba(245,158,11,0.1)',
        'card': '0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 40px rgba(0,212,255,0.08), 0 4px 16px rgba(0,0,0,0.4)',
        'inset-glow': 'inset 0 0 40px rgba(0,212,255,0.05)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-line': 'scanLine 2.5s linear infinite',
        'orbit': 'orbit 8s linear infinite',
        'data-stream': 'dataStream 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', boxShadow: '0 0 20px rgba(0,212,255,0.2)' },
          '50%': { opacity: '1', boxShadow: '0 0 40px rgba(0,212,255,0.4)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' },
        },
        dataStream: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
};
