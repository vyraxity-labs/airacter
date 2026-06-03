"use client";

import { useThemeStore } from "@/hooks/use-theme-store";
import { Sun, Moon, Cpu, MessageSquare, Sparkles } from "lucide-react";

export default function Home() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="flex flex-col flex-grow items-center justify-center p-6 relative overflow-hidden min-h-screen">
      {/* Background ambient glowing balls */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-2xl p-8 rounded-2xl glass-panel relative flex flex-col items-center text-center shadow-ambient theme-transition">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-xl bg-surface-container hover:bg-surface-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all duration-200 cursor-pointer shadow-sm"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white mb-6 shadow-md shadow-primary/20">
          <Sparkles size={24} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          Airacter
        </h1>
        <p className="text-base text-on-surface-variant max-w-md mb-8">
          The character-driven AI chat platform. Create, customize, and converse with persistent AI personas shaped by custom rules.
        </p>

        {/* Testing Checklist / Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
          <div className="p-4 rounded-xl bg-surface-lowest border border-outline-variant theme-transition">
            <h3 className="font-semibold text-primary mb-1 flex items-center gap-2">
              <MessageSquare size={16} /> Dynamic Themes
            </h3>
            <p className="text-sm text-on-surface-variant">
              Switches seamlessly between Dark (Deep Space navy) and Light (Arctic cool-gray) modes.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-lowest border border-outline-variant theme-transition">
            <h3 className="font-semibold text-secondary mb-1 flex items-center gap-2">
              <Cpu size={16} /> Tech Stack Init
            </h3>
            <p className="text-sm text-on-surface-variant">
              Next.js 15+ (v16 App Router), Tailwind CSS v4, TypeScript, and Zustand store syncing.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <button className="px-6 py-2.5 rounded-full btn-gradient font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-primary/10">
          <Sparkles size={14} /> Explore Personas
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-xs text-on-surface-variant flex items-center gap-2 select-none">
        <span>Active Theme:</span>
        <span className="capitalize font-semibold text-primary">{theme}</span>
      </footer>
    </div>
  );
}
