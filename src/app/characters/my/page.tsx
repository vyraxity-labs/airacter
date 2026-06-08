import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard-shell";
import { MySidebar } from "./my-sidebar";
import { LibrarySearch } from "./library-search";
import { CharacterCard } from "@/components/character-card";
import { cn } from "@/lib/utils";
import { Compass, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface MyCharactersPageProps {
  searchParams: Promise<{
    q?: string;
    tab?: string;
  }>;
}

export default async function MyCharactersPage({ searchParams }: MyCharactersPageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const user = session.user;
  const resolvedParams = await searchParams;

  const q = resolvedParams.q || "";
  const tab = resolvedParams.tab || "all"; // "all", "created", "saved"

  let characters: any[] = [];
  let savedIds = new Set<string>();

  // Fetch saved IDs for rendering save toggles
  const userSaves = await db.characterSave.findMany({
    where: { userId: user.id },
    select: { characterId: true },
  });
  savedIds = new Set(userSaves.map((s) => s.characterId));

  // Query database based on tab
  if (tab === "created") {
    characters = await db.character.findMany({
      where: {
        createdBy: user.id,
        OR: q ? [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ] : undefined,
      },
      include: {
        creator: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  } else if (tab === "saved") {
    const saves = await db.characterSave.findMany({
      where: {
        userId: user.id,
        character: q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        } : undefined,
      },
      include: {
        character: {
          include: {
            creator: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
      orderBy: { savedAt: "desc" },
    });
    characters = saves.map((s) => s.character);
  } else {
    // tab === "all"
    const createdQuery = db.character.findMany({
      where: {
        createdBy: user.id,
        OR: q ? [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ] : undefined,
      },
      include: {
        creator: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const savedQuery = db.characterSave.findMany({
      where: {
        userId: user.id,
        character: q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        } : undefined,
      },
      include: {
        character: {
          include: {
            creator: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
      orderBy: { savedAt: "desc" },
    });

    const [created, saves] = await Promise.all([createdQuery, savedQuery]);
    const savedChars = saves.map((s) => s.character);

    // Merge and deduplicate
    const createdIds = new Set(created.map((c) => c.id));
    characters = [
      ...created,
      ...savedChars.filter((s) => !createdIds.has(s.id)),
    ];
  }

  return (
    <Suspense fallback={null}>
      <DashboardShell
        user={user}
        sidebar={<MySidebar />}
      >
        {/* Top Header App Bar */}
        <header className="h-16 w-full glass border-b border-border/40 flex items-center justify-between px-8 z-10 select-none theme-transition">
          <div className="flex items-center gap-8">
            <nav className="flex gap-6">
              <Link
                href={`/characters/my?tab=all${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={cn(
                  "pb-1 font-semibold text-sm transition-all border-b-2 hover:text-primary",
                  tab === "all"
                    ? "text-primary border-primary font-bold"
                    : "text-on-surface-variant border-transparent"
                )}
              >
                All
              </Link>
              <Link
                href={`/characters/my?tab=created${q ? `&q=${q}` : ""}`}
                className={cn(
                  "pb-1 font-semibold text-sm transition-all border-b-2 hover:text-primary",
                  tab === "created"
                    ? "text-primary border-primary font-bold"
                    : "text-on-surface-variant border-transparent"
                )}
              >
                Created
              </Link>
              <Link
                href={`/characters/my?tab=saved${q ? `&q=${q}` : ""}`}
                className={cn(
                  "pb-1 font-semibold text-sm transition-all border-b-2 hover:text-primary",
                  tab === "saved"
                    ? "text-primary border-primary font-bold"
                    : "text-on-surface-variant border-transparent"
                )}
              >
                Saved Library
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LibrarySearch />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar pb-24">
          {/* Glowing Background Ambience */}
          <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 pointer-events-none"></div>
          <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/5 blur-[150px] -z-10 pointer-events-none"></div>

          {/* Featured Engine Promo Banner */}
          {tab === "all" && !q && (
            <section className="relative rounded-[24px] overflow-hidden bg-gradient-to-r from-primary/80 to-secondary p-10 flex items-center justify-between group shadow-lg shadow-primary-container/10 border border-white/5 select-none">
              <div className="z-10 max-w-lg">
                <span className="bg-white/20 border border-white/10 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 inline-block uppercase tracking-wider">
                  New Release
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight tracking-tight">
                  Forge your soul's digital echo.
                </h1>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                  Our new Character Engine v2 allows for deeper emotional resonance, sarcastic wit, and persistent memory across all your devices.
                </p>
                <Link
                  href="/characters/new"
                  className="bg-white text-primary px-6 py-2.5 rounded-xl text-xs font-extrabold hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer inline-block"
                >
                  Start Creating
                </Link>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden opacity-30 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none">
                <img
                  className="w-full h-full object-cover select-none"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdHM2sJjAbi13X0gviQljfiaoagm0FUl3K0ZrEuuJ4I7KEuRPeXUiT2-eNRTU42DwBsjr83aB-a1npznCwHgXWVYIF4540bSgvjcu8V46srMweph9ufrWisynX8mgdCb7vg5Uv0Q4Gu9fGVy0Oa7guZqD-dFnd4VSp-qAKEsTJCTD9AJHy6BgAY0IC0BfLK018BchDKYmAQHebmpra3E7XpRr6fP0f-H9JncVkEdj5ku7ds4bwJ4kHaKMCC-QxJVoh6kdu6BatLl8E"
                  alt="Engine promo decoration"
                />
              </div>
            </section>
          )}

          {/* Grid Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-on-background select-none">
                Character Library
              </h3>
            </div>

            {characters.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Create Character trigger block card */}
                <Link
                  href="/characters/new"
                  className="border-2 border-dashed border-border/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group cursor-pointer text-center bg-surface-lowest/20 backdrop-blur-sm min-h-[220px] select-none"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="text-primary" size={24} />
                  </div>
                  <span className="font-bold text-sm text-on-surface-variant group-hover:text-primary">
                    Create New Persona
                  </span>
                  <p className="text-xs text-outline max-w-xs mt-1">
                    Build a custom personality with prompt instructions, name, description and tone variables.
                  </p>
                </Link>

                <div className="border border-border/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center bg-surface-lowest/20 backdrop-blur-sm min-h-[220px] select-none md:col-span-1 xl:col-span-2">
                  <Compass size={36} className="text-outline stroke-[1.5px] animate-pulse" />
                  <span className="font-bold text-sm text-on-surface-variant">
                    No characters match the filter
                  </span>
                  <p className="text-xs text-outline max-w-xs mt-1">
                    Try clearing your search query or check the explore tab to bookmark public personas.
                  </p>
                  <Link
                    href="/explore"
                    className="mt-2 text-xs font-semibold px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20"
                  >
                    Go to Explore
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char as any}
                    isSaved={savedIds.has(char.id)}
                    currentUserId={user.id}
                    variant="library"
                  />
                ))}

                {/* Always show Add Persona dashed card at the end of the list */}
                <Link
                  href="/characters/new"
                  className="border-2 border-dashed border-border/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group cursor-pointer text-center bg-surface-lowest/20 backdrop-blur-sm min-h-[220px] select-none"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="text-primary" size={24} />
                  </div>
                  <span className="font-bold text-sm text-on-surface-variant group-hover:text-primary">
                    Create New Persona
                  </span>
                  <p className="text-xs text-outline max-w-[200px] mt-1">
                    Click here to forge a new AI persona from scratch.
                  </p>
                </Link>
              </div>
            )}
          </section>
        </div>
      </DashboardShell>
    </Suspense>
  );
}
