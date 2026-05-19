/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0d',
          900: '#0f0f12',
          800: '#17171c',
          700: '#22222a',
          600: '#2e2e38',
          500: '#3a3a46',
          400: '#5a5a68',
          300: '#8b8b96',
          200: '#c5c5cc',
          100: '#ececef',
        },
        accent: {
          500: '#f43f5e',
          400: '#fb7185',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
