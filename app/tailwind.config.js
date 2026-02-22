/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#FFFFFF',
        offwhite: '#FAFAF8',
        yellow: '#FFE500',
        lime: '#BCFF4F',
        coral: '#FF4D4D',
        gray: {
          100: '#F0F0F0',
          200: '#E0E0E0',
          300: '#CCCCCC',
          800: '#2A2A2A',
        },
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      boxShadow: {
        brutal: '4px 4px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'press': {
          '0%': { transform: 'translate(0, 0)', boxShadow: '4px 4px 0px #000000' },
          '100%': { transform: 'translate(2px, 2px)', boxShadow: '2px 2px 0px #000000' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'press': 'press 0.1s ease-out',
      },
    },
  },
  plugins: [],
};
