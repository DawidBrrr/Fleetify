/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        fleet: {
          navy: "#0F1C2E",
          cyan: "#05B4D9",
          ice: "#F7FBFF",
          steel: "#607D94"
        }
      },
      fontFamily: {
        display: ["Poppins", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0px 20px 45px rgba(15, 28, 46, 0.12)"
      }
    }
  },
  plugins: []
};
