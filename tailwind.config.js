import { DARK_THEME, LIGHT_THEME } from "./components/Constants";

/** @type {import('tailwindcss').Config} */
module.exports = {
  plugins: [require("daisyui")],
  daisyui: {
    themes: [LIGHT_THEME, DARK_THEME],
    logs: false,
  },
};
