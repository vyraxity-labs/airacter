"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Plus, Check, MessageSquare, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface Creator {
  id: string;
  name: string | null;
  image: string | null;
}

interface Character {
  id: string;
  slug: string;
  name: string;
  description: string;
  avatarType: "emoji" | "initials" | "image";
  avatarValue: string;
  avatarColor: string;
  category: string;
  saveCount: number;
  createdBy: string;
  creator?: Creator;
}

interface CharacterCardProps {
  character: Character;
  isSaved?: boolean;
  currentUserId?: string;
  variant?: "explore" | "library";
}

export function CharacterCard({ 
  character, 
  isSaved = false, 
  currentUserId,
  variant = "explore" 
}: CharacterCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localSaved, setLocalSaved] = useState(isSaved);
  const [localSaveCount, setLocalSaveCount] = useState(character.saveCount);

  const isCreator = currentUserId === character.createdBy;

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newSavedState = !localSaved;
    setLocalSaved(newSavedState);
    setLocalSaveCount(prev => newSavedState ? prev + 1 : Math.max(0, prev - 1));

    try {
      const response = await fetch(`/api/characters/${character.id}/save`, {
        method: newSavedState ? "POST" : "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle save state");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      // Revert state if failed
      setLocalSaved(isSaved);
      setLocalSaveCount(character.saveCount);
    }
  };

  const handleChatRedirect = () => {
    // Navigate to chat for this character
    router.push(`/chats?character=${character.slug}`);
  };

  const handleEditRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/characters/${character.id}/edit`);
  };

  // Render the large aspect-square visual header for the card
  const renderVisualHeader = () => {
    if (character.avatarType === "image" && character.avatarValue) {
      return (
        <img
          src={character.avatarValue}
          alt={character.name}
          className="w-full aspect-square object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-500"
        />
      );
    }

    // fallback gradient with emoji/initials
    return (
      <div 
        className="w-full aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${character.avatarColor}20 0%, ${character.avatarColor}40 100%)`,
          border: `1px solid ${character.avatarColor}40`
        }}
      >
        {/* Glow behind */}
        <div 
          className="absolute w-24 h-24 rounded-full blur-[40px] opacity-40 animate-pulse pointer-events-none"
          style={{ backgroundColor: character.avatarColor }}
        />
        
        {character.avatarType === "emoji" ? (
          <span className="text-6xl select-none z-10 filter drop-shadow-md transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            {character.avatarValue}
          </span>
        ) : (
          <span 
            className="text-4xl font-extrabold select-none z-10 tracking-wider font-sans group-hover:scale-105 transition-transform duration-300"
            style={{ color: character.avatarColor }}
          >
            {character.avatarValue.substring(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    );
  };

  if (variant === "library") {
    // Render My Characters Library Card style
    return (
      <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(137,206,255,0.2)] transition-all duration-300 group">
        <div className="flex justify-between items-start">
          {/* Small Avatar icon container */}
          {character.avatarType === "image" && character.avatarValue ? (
            <img 
              src={character.avatarValue}
              alt={character.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-inner"
            />
          ) : (
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${character.avatarColor}20 0%, ${character.avatarColor}40 100%)`,
                border: `1px solid ${character.avatarColor}30`
              }}
            >
              <span className="z-10">{character.avatarType === "emoji" ? character.avatarValue : character.avatarValue.substring(0, 2).toUpperCase()}</span>
            </div>
          )}
          
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {character.category}
          </span>
        </div>

        <div className="flex-1">
          <h4 className="font-title-md text-title-md text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors">
            {character.name}
          </h4>
          <p className="text-on-surface-variant text-sm line-clamp-2 leading-relaxed">
            {character.description}
          </p>
        </div>

        <div className="mt-auto pt-4 flex gap-3 border-t border-border/10">
          <button 
            onClick={handleChatRedirect}
            className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-sm"
          >
            <MessageSquare size={14} />
            Use
          </button>
          {isCreator && (
            <button 
              onClick={handleEditRedirect}
              className="p-2.5 border border-border/40 text-outline hover:text-on-surface hover:bg-surface-container rounded-xl transition-all cursor-pointer"
              title="Edit character"
            >
              <Edit size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render Explore Card style
  return (
    <div className="glass-panel p-5 rounded-[24px] flex flex-col gap-4 hover:border-primary/40 transition-all duration-300 group hover:-translate-y-1">
      <div className="relative">
        {renderVisualHeader()}
        <button
          onClick={handleSaveToggle}
          disabled={isPending}
          className={cn(
            "absolute top-3.5 right-3.5 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer border",
            localSaved
              ? "bg-primary/80 border-primary/20 text-white shadow-sm"
              : "bg-background/40 border-white/10 text-white hover:text-primary hover:bg-background/60"
          )}
          title={localSaved ? "Remove from Library" : "Save to Library"}
        >
          <Bookmark size={18} className={cn(localSaved && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="font-title-md text-title-md font-bold text-on-surface group-hover:text-primary transition-colors truncate max-w-[70%]">
            {character.name}
          </h4>
          <span className="text-[10px] font-bold bg-tertiary/10 text-tertiary border border-tertiary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {character.category}
          </span>
        </div>
        
        <p className="text-on-surface-variant text-xs mb-3 line-clamp-2 leading-normal flex-1">
          {character.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/10">
          <span className="text-[11px] text-outline font-medium">
            by @{character.creator?.name || "creator"}
          </span>
          <span className="text-[11px] text-outline">
            {localSaveCount} saves
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSaveToggle}
            disabled={isPending}
            className={cn(
              "flex-1 py-2.5 flex items-center justify-center gap-1.5 border rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer",
              localSaved
                ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                : "border-primary/30 text-primary hover:bg-primary/5"
            )}
          >
            {localSaved ? (
              <>
                <Check size={14} />
                Saved
              </>
            ) : (
              <>
                <Plus size={14} />
                Save Library
              </>
            )}
          </button>
          
          <button
            onClick={handleChatRedirect}
            className="px-3.5 py-2.5 bg-primary hover:bg-primary-container text-primary-foreground font-semibold rounded-xl text-sm flex items-center justify-center cursor-pointer shadow-md shadow-primary/10 transition-all active:scale-[0.98]"
          >
            <MessageSquare size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
