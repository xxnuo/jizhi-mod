import { DARK_THEME, LIGHT_THEME } from "./pages/components/constants";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./pages/**/*.{js,jsx}", "./entrypoints/**/*.{js,jsx}"],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [LIGHT_THEME, DARK_THEME],
    logs: false,
  },
};
