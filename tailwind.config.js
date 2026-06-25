/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#F7F5FF", dark: "#14132B" },
        surface: { DEFAULT: "#FFFFFF", dark: "#1C1B3A" },
        ink: { DEFAULT: "#1C1B3A", dark: "#EDEAFB" },
        muted: { DEFAULT: "#6B6790", dark: "#8B86B0" },
        violet: "#7C5CFC",
        amber: "#F2A93B",
        line: { DEFAULT: "#E7E3F7", dark: "#2A2950" },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  
  plugins: [require("@tailwindcss/typography")],
};
