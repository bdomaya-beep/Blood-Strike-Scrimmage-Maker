/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        rajdhani: ['var(--font-rajdhani)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        neon: {
          red: '#FF2D55',
          orange: '#FF6B35',
          blue: '#00D4FF',
          green: '#39FF14',
          purple: '#BF5FFF',
          yellow: '#FFD700',
        },
        surface: {
          900: '#0A0A0F',
          800: '#12121A',
          700: '#1A1A25',
          600: '#22222F',
          500: '#2A2A3A',
        },
      },
      backgroundImage: {
        'grid-dark': 'linear-gradient(rgba(255,45,85,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,85,0.05) 1px, transparent 1px)',
        'glow-red': 'radial-gradient(ellipse at center, rgba(255,45,85,0.15) 0%, transparent 70%)',
        'glow-blue': 'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
      },
      backgroundSize: {
        grid: '24px 24px',
      },
      boxShadow: {
        neon: '0 0 5px theme("colors.neon.red"), 0 0 20px theme("colors.neon.red")',
        'neon-blue': '0 0 5px theme("colors.neon.blue"), 0 0 20px theme("colors.neon.blue")',
        'neon-green': '0 0 5px theme("colors.neon.green"), 0 0 20px theme("colors.neon.green")',
        glass: 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'score-flash': {
          '0%': { backgroundColor: 'rgba(57,255,20,0.4)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'score-flash': 'score-flash 1s ease-out forwards',
        'slide-in': 'slide-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
