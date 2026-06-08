import React from "react";
import Link from "next/link";
import { PlusCircle, Play } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function MySidebar() {
  const session = await auth();
  if (!session || !session.user) {
    return null;
  }

  const userId = session.user.id;

  // Fetch characters created by the user or saved in their library
  const createdCharacters = await db.character.findMany({
    where: { createdBy: userId },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return (
    <div className="flex flex-col h-full bg-surface-low select-none font-sans">
      {/* Header */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-primary mb-1 tracking-tight">
          Airacter
        </h2>
        <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
          AI Persona Platform
        </p>
      </div>

      {/* Create Character button */}
      <div className="px-4 mb-6">
        <Link
          href="/characters/new"
          className="w-full btn-gradient text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/15"
        >
          <PlusCircle size={18} />
          Create Character
        </Link>
      </div>

      {/* Characters List */}
      <div className="flex-grow overflow-y-auto px-2 space-y-1 custom-scrollbar pb-6">
        <div className="px-4 py-2 text-[10px] text-outline font-bold uppercase tracking-widest">
          My Characters
        </div>

        {createdCharacters.length === 0 ? (
          <div className="px-4 py-6 text-center rounded-xl bg-surface-container/20 border border-border/10">
            <p className="text-xs text-on-surface-variant">No created personas yet.</p>
          </div>
        ) : (
          createdCharacters.map((char, index) => {
            const isFirst = index === 0;
            return (
              <Link
                key={char.id}
                href={`/chats?character=${char.slug}`}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border ${
                  isFirst
                    ? "bg-primary-container/10 border-primary/20 text-primary shadow-sm"
                    : "hover:bg-surface-container/50 border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {char.avatarType === "image" && char.avatarValue ? (
                  <img
                    src={char.avatarValue}
                    alt={char.name}
                    className="w-10 h-10 rounded-full object-cover border border-border/30"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${char.avatarColor}20 0%, ${char.avatarColor}40 100%)`,
                      border: `1px solid ${char.avatarColor}20`
                    }}
                  >
                    <span>{char.avatarType === "emoji" ? char.avatarValue : char.avatarValue.substring(0, 2).toUpperCase()}</span>
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden">
                  <p className={`text-sm font-bold truncate ${isFirst ? "text-primary" : "text-on-surface"}`}>
                    {char.name}
                  </p>
                  <p className="text-[10px] text-outline truncate font-medium">
                    {isFirst ? "Active now" : `Last updated ${new Date(char.updatedAt).toLocaleDateString()}`}
                  </p>
                </div>
                {isFirst && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse active-glow" />
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
