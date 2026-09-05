/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 清新薄荷绿主题（与网页版一致）
        mint: {
          50:  '#effbf6',
          100: '#d9f5e8',
          200: '#b6ebd3',
          300: '#85dbb6',
          400: '#4fc494',
          500: '#2ab07a',
          600: '#1a9464', // 主色
          700: '#157652',
          800: '#135d42',
          900: '#104c37',
        },
        primary: {
          DEFAULT: '#1a9464',
          50:  '#effbf6',
          100: '#d9f5e8',
          500: '#2ab07a',
          600: '#1a9464',
          700: '#157652',
        },
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(26, 148, 100, 0.15)',
        card: '0 2px 12px -2px rgba(16, 76, 55, 0.08)',
      },
    },
  },
  corePlugins: {
    // 小程序不需要 preflight（h5 专用全局 reset）
    preflight: false,
  },
  plugins: [],
}
