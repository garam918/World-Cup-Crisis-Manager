/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: { ink: '#111814', pitch: '#133d2c', lime: '#c8ff3d', cream: '#f4f2e9' }, fontFamily: { sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'] } } },
  plugins: [],
}
