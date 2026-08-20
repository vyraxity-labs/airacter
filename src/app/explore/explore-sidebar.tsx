"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  Plus, 
  GraduationCap, 
  Rocket, 
  Heart, 
  Gamepad2, 
  Palette, 
  Cpu, 
  Tv, 
  Layers 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: Layers },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "productivity", label: "Productivity", icon: Rocket },
  { id: "wellness", label: "Wellness", icon: Heart },
  { id: "fun", label: "Fun", icon: Gamepad2 },
  { id: "creative", label: "Creative", icon: Palette },
  { id: "technical", label: "Technical", icon: Cpu },
  { id: "entertainment", label: "Entertainment", icon: Tv },
  { id: "other", label: "Other", icon: Layers },
];

export function ExploreSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation("explore");

  // Local state for search query to prevent keyboard focus loss
  const currentQ = searchParams?.get("q") || "";
  const [searchVal, setSearchVal] = useState(currentQ);
  const activeCategory = searchParams?.get("category") || "all";

  // Sync local state if query param changes externally
  useEffect(() => {
    setSearchVal(currentQ);
  }, [currentQ]);

  // Debounced search param updates
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchVal !== currentQ) {
        updateParams("q", searchVal);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchVal]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Always reset page to 1 when changing filters
    params.delete("page");

    startTransition(() => {
      router.push(`/explore?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6 justify-between select-none">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary mb-5 font-sans">
            {t('explore_title')}
          </h1>
          <div className="relative group">
            <Search 
              size={18} 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" 
            />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full bg-surface-container border border-border/20 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-outline text-on-surface"
            />
          </div>
        </div>

        {/* Categories Navigation */}
        <nav className="flex flex-col gap-3">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider px-2">
            {t('categories_title')}
          </span>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[50vh] pr-1 custom-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateParams("category", cat.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-left",
                    isActive
                      ? "bg-primary-container/20 text-primary border border-primary/20 shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )}
                >
                  <Icon size={16} className={cn(isActive && "text-primary")} />
                  {t('cat_' + cat.id, { defaultValue: cat.label })}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Want to contribute Card */}
      <div className="p-4 rounded-2xl glass-panel text-center border border-border/30 mt-auto flex flex-col gap-3">
        <p className="text-xs text-on-surface-variant">{t('contribute_label')}</p>
        <button
          onClick={() => router.push("/characters/new")}
          className="w-full py-2.5 btn-gradient font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          {t('create_persona_btn')}
        </button>
      </div>
    </div>
  );
}
