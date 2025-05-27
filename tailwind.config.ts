// tailwind.config.js or tailwind.config.ts
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./pages/**/*.{js,ts,jsx,tsx,mdx}", // If you have any pages dir components
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      // Or if using `src` directory:
      // "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        // You can still extend Tailwind's theme here if needed
      },
    },
    plugins: [
      require("daisyui"),
      // Other plugins like @tailwindcss/typography or @tailwindcss/forms if you use them
    ],
    // DaisyUI specific configuration (optional)
    daisyui: {
      themes: [
        "light", // Default light theme
        "dark",  // Default dark theme
        "cupcake",
        "bumblebee",
        "emerald",
        "corporate",
        "synthwave", // A popular dark theme
        "retro",
        "cyberpunk",
        "valentine",
        "halloween",
        "garden",
        "forest", // A nice dark green theme
        "aqua",
        "lofi",
        "pastel",
        "fantasy",
        "wireframe",
        "black",
        "luxury",
        "dracula", // Another popular dark theme
        "cmyk",
        "autumn",
        "business",
        "acid",
        "lemonade",
        "night", // Good dark theme
        "coffee",
        "winter",
        // You can also create custom themes: https://daisyui.com/docs/themes/#-4
      ], // You can specify which themes you want to include or all
      darkTheme: "dark", // Name of one of the included themes for dark mode
      base: true, // Applies TWC base styles
      styled: true, // Applies DaisyUI component styles
      utils: true, // Adds DaisyUI utility classes
      prefix: "", // Prefix for DaisyUI classes (e.g., "dui-btn" if prefix is "dui-")
      logs: true, // Show logs in console during build
    },
  };