/** @type {import('tailwindcss').Config} */
export default {
  // ここを変更: index.html と src フォルダ内の全Reactファイルを監視対象にする
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
