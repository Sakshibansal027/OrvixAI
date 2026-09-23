/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10233f',
        mist: '#f5f8fc',
        signal: '#2f7df4',
        mint: '#18b890'
      },
      boxShadow: {
        panel: '0 24px 80px rgba(30, 58, 95, 0.10)',
        bubble: '0 12px 30px rgba(30, 58, 95, 0.08)'
      }
    }
  },
  plugins: []
};
