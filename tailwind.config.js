/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: 'rgb(var(--c-app) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        'muted-strong': 'rgb(var(--c-muted-strong) / <alpha-value>)',
        primary: 'rgb(var(--c-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--c-text-secondary) / <alpha-value>)',
        'border-default': 'rgb(var(--c-border) / <alpha-value>)',
        primy: {
          50: '#effcf5', 100: '#d7f7e5', 200: '#a8e8c5', 300: '#75d8a3',
          400: '#35c27b', 500: '#00a85a', 600: '#008d4e', 700: '#007a46',
          800: '#075f3a', 900: '#084e32', 950: '#032c1c',
        },
        cream: '#f7f4e8',
        gold: '#ffc83d',
        eurodreams: '#6d4aff',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 35px rgb(0 78 45 / 0.08)',
        lift: '0 22px 60px rgb(0 78 45 / 0.12)',
        ball: 'inset 0 -4px 9px rgb(0 122 70 / .10), 0 7px 15px rgb(0 78 45 / .10)',
      },
    },
  },
  plugins: [],
};
