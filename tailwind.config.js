/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ground tones — warm ivory / parchment
        ivory: '#F8F3E8',
        cream: '#EFE6D2',
        parchment: '#E7DBC0',
        // Deep heritage greens (Peninsula-evoking) + midnight for the intro
        forest: {
          DEFAULT: '#0E2A23',
          800: '#123226',
          700: '#1A4334',
          600: '#235444',
        },
        midnight: '#0A1722',
        // Warm gold accents
        gold: {
          DEFAULT: '#C5A572',
          light: '#DCC79A',
          deep: '#9C7E4E',
          ink: '#6F5630',
        },
        // A restrained heritage red for the July-4th nod (used sparingly)
        claret: '#7C2E33',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.28em',
        wide2: '0.18em',
      },
      boxShadow: {
        card: '0 30px 60px -28px rgba(14, 42, 35, 0.45), 0 2px 8px -2px rgba(14, 42, 35, 0.18)',
        pass: '0 24px 48px -24px rgba(10, 23, 34, 0.55)',
        gold: '0 0 0 1px rgba(197, 165, 114, 0.45)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dissolveOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-160% 0' },
          '100%': { backgroundPosition: '260% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 900ms ease-out both',
        'rise-in': 'riseIn 900ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'dissolve-out': 'dissolveOut 700ms ease-in both',
        shimmer: 'shimmer 5.5s linear infinite',
      },
    },
  },
  plugins: [],
}
