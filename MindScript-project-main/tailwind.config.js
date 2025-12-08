/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-bg": "#1a202c",       // Dark background
        "dark-card": "#2d3748",     // Slightly lighter for cards/sections
        "dark-text": "#e2e8f0",     // Light text for dark background
        "dark-primary": "#667eea",  // Primary accent color (blue/purple)
        "dark-secondary": "#81e6d9", // Secondary accent color (teal)
        "dark-accent": "#f6ad55",   // Accent for highlights (orange)
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Modern sans-serif font
        serif: ["Merriweather", "serif"], // Optional serif font
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "fade-in": "fadeIn 1s ease-out",
        "slide-in-left": "slideInLeft 0.7s ease-out",
        "pop-in": "popIn 0.5s ease-out",
        "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "bounce-slow": "bounce-slow 2s infinite",
        "bounce-small": "bounce-small 1.5s infinite",
        "bounce-right": "bounce-right 0.3s ease-in-out",
        "bounce-left": "bounce-left 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        popIn: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(-10%)", animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)" },
          "50%": { transform: "translateY(0)", animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
        },
        "bounce-small": {
          "0%, 100%": { transform: "translateY(-5%)", animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)" },
          "50%": { transform: "translateY(0)", animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
        },
        "bounce-right": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(10px)" },
        },
        "bounce-left": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
