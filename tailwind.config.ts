import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#d4ff00',
        black: '#0f1419',
        white: '#ffffff',
        gray: {
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          500: '#64748b',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
        info: '#3b82f6',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        '2xl': '60px',
        '3xl': '80px',
        '4xl': '120px',
      },
      fontSize: {
        h1: '180px',
        h2: '56px',
        h3: '36px',
        body: '18px',
        small: '14px',
        button: '16px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        soft: '0 4px 12px rgba(0, 0, 0, 0.08)',
        card: '0 10px 25px rgba(0, 0, 0, 0.1)',
        lift: '0 20px 40px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
export default config
