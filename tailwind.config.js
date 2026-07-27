/** @type {import('tailwindcss').Config} */
export default {
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
      },
      boxShadow: {
        soft: '0 12px 35px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
};
