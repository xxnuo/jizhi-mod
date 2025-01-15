import { DARK_THEME, LIGHT_THEME } from "./src/services/constants";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./entrypoints/**/*.{js,jsx}"],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [LIGHT_THEME, DARK_THEME],
    logs: false,
  },
};
