import React, { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { ExploreSidebar } from "./explore-sidebar";
import { ExploreSort } from "./explore-sort";
import { CharacterCard } from "@/components/character-card";
import { ArrowRight, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const user = session.user;
  const resolvedParams = await searchParams;
  
  const q = resolvedParams.q || "";
  const category = resolvedParams.category || "all";
  const sort = resolvedParams.sort || "popular";
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));

  const limit = 8;
  const skip = (page - 1) * limit;

  // Build prisma query filters
  const where: any = {
    visibility: "public",
  };

  if (category && category !== "all") {
    where.category = category;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  // Build ordering
  const orderBy: any = {};
  if (sort === "new") {
    orderBy.createdAt = "desc";
  } else {
    orderBy.usageCount = "desc";
  }

  // Run DB queries in parallel
  const [characters, total, saves, trending] = await Promise.all([
    db.character.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        creator: {
          select: { id: true, name: true, image: true },
        },
      },
    }),
    db.character.count({ where }),
    db.characterSave.findMany({
      where: { userId: user.id },
      select: { characterId: true },
    }),
    db.character.findMany({
      where: { visibility: "public" },
      orderBy: { usageCount: "desc" },
      take: 3,
      include: {
        creator: {
          select: { id: true, name: true, image: true },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const savedIds = new Set(saves.map((s) => s.characterId));

  // Render trending now card element
  const renderTrendingCard = (char: typeof trending[0], index: number) => {
    return (
      <Link
        href={`/chats?character=${char.slug}`}
        key={char.id}
        className="relative h-64 rounded-[24px] overflow-hidden group cursor-pointer border border-border/20 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(137,206,255,0.2)] transition-all duration-500"
      >
        {char.avatarType === "image" && char.avatarValue ? (
          <img
            src={char.avatarValue}
            alt={char.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full flex items-center justify-center text-8xl"
            style={{
              background: `linear-gradient(135deg, ${char.avatarColor}40 0%, ${char.avatarColor}70 100%)`,
            }}
          >
            <span className="transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
              {char.avatarValue}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent"></div>
        <div className="absolute bottom-0 p-6 w-full flex flex-col items-start">
          <span className="bg-tertiary/20 text-tertiary text-[10px] font-bold px-3 py-1 rounded-full border border-tertiary/10 backdrop-blur-md mb-2.5 uppercase tracking-wider">
            {char.category}
          </span>
          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-sm group-hover:text-primary transition-colors">
            {char.name}
          </h3>
          <p className="text-on-surface-variant text-xs line-clamp-1 max-w-[95%]">
            {char.description}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <Suspense fallback={null}>
      <DashboardShell
        user={user}
        sidebar={<ExploreSidebar />}
      >
        <div className="w-full flex-grow p-6 md:p-10 pb-24 overflow-y-auto custom-scrollbar select-none">
          {/* Ambient Glowing Effects */}
          <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 pointer-events-none"></div>
          <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/5 blur-[150px] -z-10 pointer-events-none"></div>

          {/* 1. Trending Section (only show on page 1 and when not filtering heavily) */}
          {page === 1 && !q && category === "all" && trending.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2">
                  <Compass size={22} className="text-primary animate-pulse" />
                  Trending Now
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trending.map((char, index) => renderTrendingCard(char, index))}
              </div>
            </section>
          )}

          {/* 2. Main Character Gallery */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-border/10 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-on-surface">
                  {q || category !== "all" ? "Search Results" : "Public Personas"}
                </h2>
                <span className="text-xs px-2.5 py-1 bg-surface-container border border-border/20 text-on-surface-variant font-semibold rounded-full">
                  {total} {total === 1 ? "persona" : "personas"}
                </span>
              </div>
              
              <ExploreSort />
            </div>

            {characters.length === 0 ? (
              <div className="w-full rounded-2xl border border-dashed border-border/40 py-20 flex flex-col items-center justify-center text-center p-6 bg-surface-lowest/40 backdrop-blur-sm">
                <Compass size={48} className="text-outline/60 mb-4 stroke-[1.5px]" />
                <h3 className="text-lg font-bold text-on-surface mb-1">No personas found</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mb-6">
                  We couldn't find any public personas matching your filters. Try checking your spelling or selecting another category.
                </p>
                <Link
                  href="/explore"
                  className="px-5 py-2 border border-border text-xs font-semibold rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char as any}
                    isSaved={savedIds.has(char.id)}
                    currentUserId={user.id}
                    variant="explore"
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-12 pt-6 border-t border-border/10">
                {page > 1 ? (
                  <Link
                    href={`/explore?q=${q}&category=${category}&sort=${sort}&page=${page - 1}`}
                    className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-semibold text-outline cursor-not-allowed">
                    <ChevronLeft size={16} />
                    Previous
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrent = pageNum === page;
                    return (
                      <Link
                        key={pageNum}
                        href={`/explore?q=${q}&category=${category}&sort=${sort}&page=${pageNum}`}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${
                          isCurrent
                            ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                            : "border-border/40 text-on-surface-variant hover:border-primary/30 hover:text-primary bg-surface-lowest"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>

                {page < totalPages ? (
                  <Link
                    href={`/explore?q=${q}&category=${category}&sort=${sort}&page=${page + 1}`}
                    className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-semibold text-outline cursor-not-allowed">
                    Next
                    <ChevronRight size={16} />
                  </span>
                )}
              </div>
            )}
          </section>
        </div>
      </DashboardShell>
    </Suspense>
  );
}
