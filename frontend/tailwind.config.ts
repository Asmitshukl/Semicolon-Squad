import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Indian Flag ─────────────────────────────── */
        saffron: {
          300: '#FFBA5C',
          400: '#FF9F3D',
          500: '#FF9933',   /* Indian Saffron */
          600: '#E88520',
          700: '#CC6B00',
        },
        'india-green': {
          400: '#25BD18',
          500: '#138808',   /* India Green */
          600: '#0E6A05',
        },
        'ashoka-blue': {
          400: '#2554B5',
          500: '#163166',   /* Ashoka Chakra Navy */
          600: '#0E2050',
        },
        /* ── Judiciary Palette ───────────────────────── */
        navy: {
          950: '#020714',
          900: '#050918',
          800: '#070C22',
          700: '#0B1530',
          600: '#111E40',
          500: '#1A2D55',
        },
        gold: {
          300: '#F0D485',
          400: '#E8C060',
          500: '#CBA135',
          600: '#A07C20',
        },
        maroon: {
          900: '#1A0508',
          800: '#2D0A10',
          700: '#44101A',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'auth-gradient':   'linear-gradient(160deg, #050918 0%, #07101E 50%, #0B1530 100%)',
        'tricolor':        'linear-gradient(90deg, #FF9933 33.33%, #ffffff 33.33% 66.66%, #138808 66.66%)',
        'saffron-gradient':'linear-gradient(135deg, #FF9933 0%, #E07800 100%)',
        'card-gradient':   'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        'btn-gradient':    'linear-gradient(135deg, #FF9933 0%, #E07800 100%)', /* saffron */
      },
      boxShadow: {
        glass:    '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
        saffron:  '0 0 20px rgba(255,153,51,0.35)',
        'saffron-lg': '0 0 40px rgba(255,153,51,0.25)',
        glow:     '0 0 20px rgba(255,153,51,0.3)',
        'glow-lg':'0 0 40px rgba(255,153,51,0.2)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':  'spin 20s linear infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                         to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' },     '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
}
export default config
