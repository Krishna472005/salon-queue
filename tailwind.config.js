/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        all1: {
          navy: '#0B1F3A',
          deep: '#12294D',
          cobalt: '#2F6BFF',
          aqua: '#22D3EE',
          coral: '#FF6F59',
          lime: '#A3E635',
          sun: '#FFC857',
          rose: '#F43F5E',
          snow: '#F6F9FC',
          cloud: '#E3EAF3',
          ink: '#14213D',
          fog: '#9FB0C9',
        }
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        gujarati: ['"Noto Sans Gujarati"', 'sans-serif'],
      },
      borderRadius: {
        'card': '18px',
        'btn': '12px',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0B1F3A 0%, #12294D 50%, #2F6BFF 100%)',
        'turn-gradient': 'linear-gradient(135deg, #FF6F59 0%, #FFC857 100%)',
        'ring-gradient': 'linear-gradient(135deg, #22D3EE 0%, #2F6BFF 100%)',
      }
    },
  },
  plugins: [],
}
