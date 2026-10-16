/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Be Vietnam Pro", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Be Vietnam Pro", "ui-sans-serif", "system-ui", "sans-serif"],
        poster: ["Anton", "Be Vietnam Pro", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        surface: "hsl(var(--surface))",
        "surface-elevated": "hsl(var(--surface-elevated))",
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        "surface-sunken": "hsl(var(--surface-sunken))",
        "text-primary": "hsl(var(--text-primary))",
        "text-secondary": "hsl(var(--text-secondary))",
        palette: {
          butter: "#FFF2C6",
          cream: "#FFF8DE",
          periwinkle: "#AAC4F5",
          sky: "#8CA9FF",
          skyDeep: "#547EFF",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          soft: "hsl(var(--accent-soft))",
          strong: "hsl(var(--accent-strong))",
          deep: "hsl(var(--accent-deep))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        info: "hsl(var(--info))",
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "24px",
        xl: "28px",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(18, 25, 21, .08)",
        elevated: "0 8px 30px rgba(18, 25, 21, .06)",
      },
    },
  },
  plugins: [],
};
