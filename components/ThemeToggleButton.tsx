// components/ThemeToggleButton.tsx
"use client";

import { useEffect, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi'; // Example icons

const themes = [ // Should match a subset of your daisyui.themes in tailwind.config.js
  "light", "dark", "cupcake", "synthwave", "forest", "dracula", "night", "coffee"
];

export default function ThemeToggleButton() {
  const [currentTheme, setCurrentTheme] = useState('');

  useEffect(() => {
    // Get initial theme from localStorage or default to 'light' (or your preferred default)
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setCurrentTheme(newTheme);
  };

  if (!currentTheme) { // Avoid rendering until theme is initialized client-side
    return <div className="w-16 h-8"></div>; // Placeholder for size
  }

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm">
        Theme
        {currentTheme === 'light' || currentTheme === 'cupcake' || currentTheme === 'garden' ? <FiSun className="inline ml-1"/> : <FiMoon className="inline ml-1"/>}
      </label>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-300 rounded-box w-52 max-h-60 overflow-y-auto">
        {themes.map(theme => (
          <li key={theme}>
            <button
              onClick={() => handleThemeChange(theme)}
              className={`capitalize ${currentTheme === theme ? 'btn-active' : ''}`}
            >
              {theme}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}