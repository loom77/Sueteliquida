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
          50: '#f3fcf7', 100: '#e4f7ec', 200: '#bfe9cf', 300: '#8fd5ad',
          400: '#4fbd83', 500: '#12a05c', 600: '#0d8d50', 700: '#0b7a49',
          800: '#09623c', 900: '#084f33', 950: '#042d1d',
        },
        cream: '#fbf8ef',
        ivory: '#fffdf8',
        gold: '#f4c84a',
        peach: '#ffd9b8',
        sky: '#dceeff',
        lavender: '#ece9ff',
        eurodreams: '#6a5af9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 35px rgb(11 122 73 / 0.08)',
        lift: '0 22px 60px rgb(11 122 73 / 0.12)',
        ball: 'inset 0 -4px 9px rgb(0 122 70 / .10), 0 7px 15px rgb(0 78 45 / .10)',
      },
    },
  },
  plugins: [],
};
