/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./**/*.{html,js}', '!./node_modules'],
  theme: {
    extend: {
      colors: {
        // MARK: Light Theme
        vlp: '#FFFFFF', // Primary
        vlp2: '#E8E9EB', // Primary darker
        vlp3: '#D3D5D6', // Primary even darker
        vls: '#8B9197', // Secondary
        vls2: '#2B3440', // Secondary darker
        vls3: '#242C36', // Secondary even darker
        vla: '#53CF6E', // Accent
        vla2: '#4BA85F', // Accent darker
        vla3: '#216430', // Accent even darker

        // MARK: Dark theme
        vdp: '#18181b', // Primary #18181b
        vdp2: '#27272a', // Primary Light #27272a
        vdp3: '#3f3f46', //  Primary Lighter #3f3f46
        vds: '#d4d4d4', // Secondart Neutral 300 #d4d4d4
        vds2: '#525252', // Secondary Light #525252
        vds3light: '#a3a3a3', // Secondary Lighter
        vds3neu700: '#404040', // Secondary Darker
        vda: '#FE7F76', // Accent VRED 300
        // vda: '#FEA09A', // Accent VRED 300
        // vda2: '#FE7F76', // Accent Dark - vred 400
        vda2: '#ef4444 ', // Accent Dark - vred 400

        // Custom color definitions
        'vlp-1': {
          DEFAULT: '#ffffff',
          100: '#333333',
          200: '#666666',
          300: '#999999',
          400: '#cccccc',
          500: '#ffffff',
          600: '#ffffff',
          700: '#ffffff',
          800: '#ffffff',
          900: '#ffffff',
        },
        'vlp-2': {
          DEFAULT: '#e8e9eb',
          100: '#2c2e32',
          200: '#575c64',
          300: '#858a95',
          400: '#b7bac0',
          500: '#e8e9eb',
          600: '#eeeef0',
          700: '#f2f2f4',
          800: '#f6f7f7',
          900: '#fbfbfb',
        },
        'vlp-3': {
          DEFAULT: '#d3d5d6',
          100: '#292b2c',
          200: '#515658',
          300: '#7a8184',
          400: '#a6aaad',
          500: '#d3d5d6',
          600: '#dbddde',
          700: '#e4e5e6',
          800: '#edeeee',
          900: '#f6f6f7',
        },
        'vls-1': {
          DEFAULT: '#8b9197',
          100: '#1c1d1f',
          200: '#373a3d',
          300: '#53575c',
          400: '#6e747a',
          500: '#8b9197',
          600: '#a3a7ac',
          700: '#babdc0',
          800: '#d1d3d5',
          900: '#e8e9ea',
        },
        'vls-2': {
          DEFAULT: '#2b3440',
          100: '#090a0d',
          200: '#11151a',
          300: '#1a1f27',
          400: '#222a33',
          500: '#2b3440',
          600: '#4b5b71',
          700: '#6e839e',
          800: '#9eacbf',
          900: '#cfd6df',
        },
        'vls-3': {
          DEFAULT: '#181d24',
          100: '#050607',
          200: '#0a0c0f',
          300: '#0f1216',
          400: '#14181d',
          500: '#181d24',
          600: '#3c495b',
          700: '#607490',
          800: '#93a2b7',
          900: '#c9d1db',
        },
        'vla-1': {
          DEFAULT: '#53cf6e',
          100: '#0d2d14',
          200: '#1a5b28',
          300: '#26883c',
          400: '#33b54f',
          500: '#53cf6e',
          600: '#76d88b',
          700: '#98e2a8',
          800: '#bbecc5',
          900: '#ddf5e2',
        },
        'vla-2': {
          DEFAULT: '#4ba85f',
          100: '#0f2213',
          200: '#1e4426',
          300: '#2e653a',
          400: '#3d874d',
          500: '#4ba85f',
          600: '#6dbd7e',
          700: '#91ce9e',
          800: '#b6debf',
          900: '#daefdf',
        },
        'vla-3': {
          DEFAULT: '#216430',
          100: '#07140a',
          200: '#0d2813',
          300: '#143c1d',
          400: '#1b5026',
          500: '#216430',
          600: '#349c4b',
          700: '#55c66e',
          800: '#8ed99e',
          900: '#c6eccf',
        },
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
      animation: {
        'spin-once': 'spin 1s linear 1',
      },
    },
  },
  plugins: [],
}
