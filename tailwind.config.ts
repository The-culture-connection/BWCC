import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'primary': ['var(--font-cursive)', 'cursive'],
        'secondary': ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#faf8f4',
          100: '#f5efe8',
          200: '#ead5c3',
          300: '#dfbb9e',
          400: '#d4a16b',
          500: '#d1a270',
          600: '#a56c30',
          700: '#8a5728',
          800: '#6f4520',
          900: '#000000',
        },
        accent: {
          50: '#faf8f4',
          100: '#f5efe8',
          200: '#ede1d1',
          300: '#e7ce9b',
          400: '#d4a16b',
          500: '#d1a270',
          600: '#a56c30',
          700: '#8a5728',
          800: '#6f4520',
          900: '#000000',
        },
        brand: {
          gold: '#d4a16b',
          black: '#000000',
          brown: '#a56c30',
          tan: '#d1a270',
          cream: '#e7ce9b',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;

