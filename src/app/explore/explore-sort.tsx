"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ExploreSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams?.get("sort") || "popular";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("sort", e.target.value);
    params.delete("page"); // reset page on sort
    
    startTransition(() => {
      router.push(`/explore?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-1.5 select-none">
      <span className="text-on-surface-variant text-xs font-semibold">Sort by:</span>
      <select
        value={currentSort}
        onChange={handleSortChange}
        disabled={isPending}
        className="bg-transparent border-none text-primary font-bold text-xs focus:ring-0 focus:outline-none cursor-pointer py-1 px-2 rounded-lg hover:bg-surface-container transition-all"
      >
        <option value="popular" className="bg-surface text-on-surface">Most Popular</option>
        <option value="new" className="bg-surface text-on-surface">Newest</option>
      </select>
    </div>
  );
}
