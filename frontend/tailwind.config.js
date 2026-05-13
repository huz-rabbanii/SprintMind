/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0e0e14',
        surface: '#16161f',
        s2:      '#1e1e2a',
        border:  'rgba(255,255,255,0.07)',
        accent:  '#6c63ff',
        a2:      '#00d4ff',
        green:   '#22c55e',
        yellow:  '#eab308',
        red:     '#ef4444',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
