import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        'primary-light': '#EDE9FE',
        'lavender-bg': '#F5F3FF',
        surface: '#ffffff',
        'on-surface': '#1A1A1A',
        'on-surface-variant': '#6B7280',
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}

export default config
