import { DARK_THEME, LIGHT_THEME } from "./components/Constants";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.jsx", "./Layout.jsx", "./components/*.js", "./entrypoints/newtab/index.html"],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [LIGHT_THEME, DARK_THEME],
    logs: false,
  },
};
