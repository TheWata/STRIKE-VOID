/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        grimoire: ['Cinzel', 'serif'],
        typewriter: ['"Special Elite"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'void-bg': '#0a0705',
        'wood-dark': '#1a110b',
        'wood-mid': '#2c1d12',
        parchment: '#cbb892',
        'parchment-dark': '#9e8a63',
        blood: '#8b0000',
        'blood-bright': '#dc2626',
        'gold-aged': '#d4af37',
        iron: '#4a5568',
      },
    },
  },
  plugins: [],
};
