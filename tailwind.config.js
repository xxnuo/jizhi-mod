/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./entrypoints/**/*.{js,jsx}"],
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["cupcake", "halloween"],
    logs: false,
  },
};
