/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')
module.exports = {
  darkMode: 'class',
  content: ['!./node_modules', './**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        // MARK: Light Theme
        vlp: '#001B2E', // Primary vblue.[600]
        vlp2: '#00477A', // Primary Light vblue.[500]
        vlp3: '#D6EEFF', // Primary Lighter Light vblue.[50]
        vls: '#fcfffc', // Secondary Light for white babyPowder - Undefined
        vls2: '#E5E5E5', // Secondary Darker platinum - Undefined
        vla: '#2bc24c', // Accent green[500]
        vla2: '#51d76e', // Accent Lighter green[400]

        // MARK: Dark theme
        vdp: colors.zinc[900], // Primary #18181b
        vdp2: colors.zinc[800], // Primary Light #27272a
        vdp3: colors.zinc[700], //  Primary Lighter #3f3f46
        vds: colors.neutral[300], // Secondart Neutral 300 #d4d4d4
        vds2: colors.neutral[600], // Secondary Light #525252
        vds3light: colors.neutral[400], // Secondary Lighter
        vds3neu700: colors.neutral[700], // Secondary Darker
        vda: '#FEA09A', // Accent VRED 300
        vda2: '#FE7F76', // Accent Dark - vred 400

        // Custom color definitions
        vblue: {
          50: '#D6EEFF',
          100: '#B3DFFF',
          200: '#66BFFF',
          300: '#1A9FFF',
          400: '#0074C7',
          500: '#00477A',
          600: '#001B2E', // Main Primary LIGHT
          700: '#001524',
          800: '#000F19',
          900: '#00060A',
          950: '#000305',
        },
        vgreen: {
          50: '#f1fcf2',
          100: '#defae3',
          200: '#bef4c9',
          300: '#8bea9f',
          400: '#51d76e',
          500: '#2bc24c', // Main Secondary LIGHT
          600: '#1d9c39',
          700: '#1a7b2f',
          800: '#1a612a',
          900: '#175025',
          950: '#072c10',
        },
        vred: {
          50: '#FFF1F0',
          100: '#FFDEDC',
          200: '#FFC1BD',
          300: '#FEA09A', // Main Secondary DARK
          400: '#FE7F76',
          500: '#FE5F55',
          600: '#FE2111',
          700: '#CB0F01',
          800: '#890A01',
          900: '#420500',
          950: '#230300',
        },
      },

      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
