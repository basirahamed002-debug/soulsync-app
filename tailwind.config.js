/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF4D8D',
        secondary: '#8B5CF6',
        accent: '#7C3AED',
        bg: '#09090B',
        bg2: '#111014',
        gold: '#F5C94B',
        catblue: '#5AA9E6',
        catfunny: '#FFC15E'
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif']
      },
      borderRadius: {
        card: '24px'
      }
    }
  },
  plugins: []
}
