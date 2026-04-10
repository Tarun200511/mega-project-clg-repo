/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep:    '#070B14',
          base:    '#0B0F19',
          surface: '#111827',
          card:    '#1E2D45',
        },
        primary: { DEFAULT: '#3B82F6', dark: '#1D4ED8', light: '#60A5FA' },
        accent:  { DEFAULT: '#10B981', dark: '#065F46', light: '#34D399' },
        danger:  { DEFAULT: '#EF4444', dark: '#B91C1C', light: '#F87171' },
        amber:   { DEFAULT: '#F59E0B', dark: '#92400E', light: '#FCD34D' },
        violet:  { DEFAULT: '#8B5CF6', dark: '#5B21B6', light: '#A78BFA' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn  0.4s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'slide-right':'slideRight 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow':  'spin   3s linear infinite',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp:    { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideRight: { '0%': { opacity: 0, transform: 'translateX(-12px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
      },
      boxShadow: {
        'glow-blue':  '0 0 24px rgba(59,130,246,0.4), 0 0 80px rgba(59,130,246,0.1)',
        'glow-green': '0 0 24px rgba(16,185,129,0.4), 0 0 80px rgba(16,185,129,0.1)',
        'glow-red':   '0 0 24px rgba(239,68,68,0.4),  0 0 80px rgba(239,68,68,0.1)',
        'card':       '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}
