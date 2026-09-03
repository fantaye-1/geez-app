/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#2B2013",
        parchment: "#EFE7D6",
        card: "#F8F2E5",
        border: "#D9C9A2",
        gold: "#A9791F",
        rubric: "#7C2A1E",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Literata", "serif"],
        mono: ["IBM Plex Mono", "monospace"],
        ethiopic: ["Noto Sans Ethiopic", "serif"],
      },
    },
  },
  plugins: [],
};
