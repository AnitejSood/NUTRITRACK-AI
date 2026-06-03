import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#FF6B35',
          rose: '#E91E8C',
          teal: '#4ECDC4',
          yellow: '#FFE66D',
        },
        dark: {
          900: '#0A0A0F',
          800: '#13131A',
          700: '#1C1C28',
          600: '#252535',
          500: '#2E2E42',
        },
        surface: {
          DEFAULT: '#13131A',
          2: '#1C1C28',
          3: '#252535',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF6B35, #E91E8C)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(233,30,140,0.15))',
        'card-gradient': 'linear-gradient(145deg, rgba(28,28,40,0.9), rgba(19,19,26,0.95))',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'ring-fill': 'ringFill 1s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        ringFill: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5)',
        'glow-orange': '0 0 20px rgba(255,107,53,0.3)',
        'glow-rose': '0 0 20px rgba(233,30,140,0.3)',
        'glow-teal': '0 0 20px rgba(78,205,196,0.3)',
      },
    },
  },
  plugins: [],
}

export default config
