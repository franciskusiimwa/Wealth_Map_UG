import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#0F6E56',
        'brand-green-light': '#E1F5EE',
        'brand-green-dark': '#085041',
        'brand-amber': '#BA7517',
        'brand-amber-light': '#FAEEDA',
        'brand-amber-dark': '#633806',
        'brand-red-light': '#FCEBEB',
        'brand-red-dark': '#A32D2D',
        ink: '#0F0E0C',
        'ink-2': '#2C2A24',
        'ink-3': '#4A4740',
        paper: '#FDFBF7',
        'paper-2': '#F5F1E8',
        'paper-3': '#EDE8DB'
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        'dm-sans': ['var(--font-dm-sans)', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config
