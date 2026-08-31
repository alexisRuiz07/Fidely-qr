/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* tokens que cambian en dark mode — usan CSS variables */
        bg:      'var(--color-bg)',
        surface: 'var(--color-surface)',
        /* ink con canal RGB para soportar bg-ink/50, bg-ink/[.42] */
        ink: 'rgb(var(--color-ink-ch) / <alpha-value>)',
        neutral: {
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
        },
        /* tokens de acento — estáticos, igual en light y dark */
        brand: {
          DEFAULT: '#c67139',
          100: '#fff2eb',
          200: '#ffe1d0',
          300: '#ffc6a5',
          400: '#f6a06b',
          500: '#d67f48',
          600: '#b2622d',
          700: '#8c491a',
          800: '#643312',
          900: '#402310',
        },
        sage: {
          DEFAULT: '#7a8a5e',
          100: '#f0fae1',
          200: '#e1eecc',
          300: '#ccdbb2',
          400: '#aebf92',
          500: '#8fa073',
          600: '#728157',
          700: '#56633f',
          800: '#3d472b',
          900: '#272e1b',
        },
      },
      fontFamily: {
        display: ['Caprasimo', 'system-ui', 'sans-serif'],
        sans:    ['Figtree', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '28px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(46,43,37,.14)',
        md: '0 3px 10px rgba(46,43,37,.16)',
        lg: '0 12px 32px rgba(46,43,37,.22)',
      },
      spacing: {
        1: '4.4px',
        2: '8.8px',
        3: '13.2px',
        4: '17.6px',
        6: '26.4px',
        8: '35.2px',
      },
    },
  },
  plugins: [],
};
