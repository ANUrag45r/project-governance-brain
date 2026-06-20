"use client";

import { useTheme } from "./ThemeProvider";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="h-16 flex items-center justify-between px-6 bg-white/70 dark:bg-[#0c0c0e]/70 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-white tracking-wide">Project Governance Brain</h2>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-zinc-200/50 hover:bg-zinc-300/50 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 border border-zinc-300/30 dark:border-zinc-700/30 transition-all cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="px-4 py-2 text-sm text-white bg-blue-600/80 hover:bg-blue-500/80 rounded-lg backdrop-blur-sm transition-all border border-blue-400/30 cursor-pointer">
          Connect Teams
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 border border-white/20"></div>
      </div>
    </nav>
  );
}
