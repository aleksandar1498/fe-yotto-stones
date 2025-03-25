import type { Config } from "tailwindcss";

export default {
  content: [
    // "./node_modules/@relume_io/relume-ui/dist/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        obsidian: "#0A0A0A",
        platinum: "#E5E5E5",
        royalGold: "#C8A45B",
        darkGold : "#7d6741",
        darkGoldHover: "#644e28",
        midnightBlue: "#1B1F3B",
        graphite: "#444444",
        carraraWhite: "#F8F8F8",
      }
    },
    plugins: [
      require("@xpd/tailwind-3dtransforms")
    ],
  }
} satisfies Config;
