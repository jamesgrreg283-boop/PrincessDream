/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette
        pinkSoft: "#FCE4EC",
        pinkBlush: "#F8BBD0",
        pinkDeep: "#D81B60",
        gold: "#D4AF37",
        goldLight: "#F1D87A",
        goldDeep: "#B8860B",
        lavender: "#F3E5F5",
        cream: "#FFFBF5",
        /** Dusty rose page canvas (darker pink) — body + wave blend */
        pagePink: "#C995AE",
        pagePinkDeep: "#B07D94",
        ink: "#2A1B2D",
        inkSoft: "#5C4A5F",
      },
      fontFamily: {
        // Elegant heading font + clean body font
        display: ['"Playfair Display"', "serif"],
        cinzel: ['"Cinzel"', "serif"],
        body: ['"Poppins"', '"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        magical: "0 20px 50px -20px rgba(216, 27, 96, 0.25)",
        soft: "0 10px 30px -12px rgba(42, 27, 45, 0.18)",
        gold: "0 10px 30px -10px rgba(212, 175, 55, 0.55)",
        accent: "0 12px 32px -10px rgba(219, 39, 119, 0.45)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F1D87A 0%, #D4AF37 50%, #B8860B 100%)",
        "accent-btn":
          "linear-gradient(135deg, #fbcfe8 0%, #f472b6 38%, #db2777 72%, #9d174d 100%)",
        "accent-cta":
          "linear-gradient(145deg, #fce7f3 0%, #ec4899 35%, #be185d 55%, #831843 100%)",
        "pink-gradient": "linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)",
        "magic-gradient": "linear-gradient(135deg, #FCE4EC 0%, #F3E5F5 50%, #FFFFFF 100%)",
      },
      keyframes: {
        floatY: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floatY: "floatY 5s ease-in-out infinite",
        twinkle: "twinkle 2.4s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        fadeUp: "fadeUp 0.7s ease-out both",
      },
    },
  },
  plugins: [],
};
