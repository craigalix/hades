/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'rgb(var(--tg-color-bg) / <alpha-value>)',
          text: 'rgb(var(--tg-color-text) / <alpha-value>)',
          hint: 'rgb(var(--tg-color-hint) / <alpha-value>)',
          link: 'rgb(var(--tg-color-link) / <alpha-value>)',
          button: 'rgb(var(--tg-color-button) / <alpha-value>)',
          buttonText: 'rgb(var(--tg-color-button-text) / <alpha-value>)',
          secondary: 'rgb(var(--tg-color-secondary-bg) / <alpha-value>)',
          surface: 'rgb(var(--hades-surface) / <alpha-value>)',
          border: 'rgb(var(--hades-border) / <alpha-value>)',
        },
      },
      boxShadow: {
        command: '0 18px 60px rgb(0 0 0 / 0.28)',
      },
    },
  },
  plugins: [],
};
