import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#202024",
        surface: "#282830",
        border: "#35353f",
        text: {
          primary: "#e2e2e8",
          secondary: "#8888a0",
          muted: "#55556a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
