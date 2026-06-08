"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function LibrarySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQ = searchParams?.get("q") || "";
  const [searchVal, setSearchVal] = useState(currentQ);

  useEffect(() => {
    setSearchVal(currentQ);
  }, [currentQ]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchVal !== currentQ) {
        const params = new URLSearchParams(searchParams?.toString() || "");
        if (searchVal) {
          params.set("q", searchVal);
        } else {
          params.delete("q");
        }
        startTransition(() => {
          router.push(`/characters/my?${params.toString()}`);
        });
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchVal]);

  return (
    <div className="relative group select-none">
      <input
        type="text"
        value={searchVal}
        onChange={(e) => setSearchVal(e.target.value)}
        placeholder="Search characters..."
        className="bg-surface-container border border-border/10 rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-on-surface placeholder:text-outline"
      />
      <Search 
        size={16} 
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" 
      />
    </div>
  );
}
