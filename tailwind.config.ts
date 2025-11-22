import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pixel: {
          dark: '#0f172a',
          purple: '#7f5af0',
          yellow: '#ffcc00',
          teal: '#00d1b2',
          bg: '#1e293b',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      imageRendering: {
        pixelated: 'pixelated',
      },
    },
  },
  plugins: [],
}
export default config

