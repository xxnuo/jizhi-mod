import { DARK_THEME, LIGHT_THEME } from "./pages/components/constants";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./pages/**/*.{js,ts,jsx,tsx,mdx}", "./entrypoints/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [require("daisyui")],
  daisyui: {
    themes: [LIGHT_THEME, DARK_THEME],
    logs: false,
  },
};
