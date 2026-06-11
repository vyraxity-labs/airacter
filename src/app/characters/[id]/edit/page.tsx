import React from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { CharacterForm } from "@/components/character-form";

export const dynamic = "force-dynamic";

interface EditCharacterPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCharacterPage({ params }: EditCharacterPageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  // Retrieve character from database
  const character = await db.character.findUnique({
    where: { id },
  });

  // Authorization barrier: character must exist and logged-in user must be creator
  if (!character || character.createdBy !== session.user.id) {
    redirect("/characters/my");
  }

  // Check if character was rejected within the last 24 hours
  const lastRejection = await db.characterReport.findFirst({
    where: {
      characterId: id,
      status: "resolved",
      notes: { startsWith: "REJECTED:" },
    },
    orderBy: { createdAt: "desc" },
  });

  let cooldownRemainingHours = 0;
  let rejectionReason = "";
  if (lastRejection) {
    const elapsed = Date.now() - lastRejection.createdAt.getTime();
    const cooldown = 24 * 60 * 60 * 1000;
    if (elapsed < cooldown) {
      cooldownRemainingHours = Math.ceil((cooldown - elapsed) / (60 * 60 * 1000));
      rejectionReason = lastRejection.notes?.replace("REJECTED: ", "") || "Does not meet community standards.";
    }
  }

  const characterData = {
    id: character.id,
    name: character.name,
    description: character.description,
    systemPrompt: character.systemPrompt,
    avatarType: character.avatarType,
    avatarValue: character.avatarValue,
    avatarColor: character.avatarColor,
    category: character.category,
    tone: character.tone,
    visibility: character.visibility,
  };

  return (
    <DashboardShell user={session.user}>
      <CharacterForm 
        initialData={characterData} 
        cooldownRemainingHours={cooldownRemainingHours} 
        rejectionReason={rejectionReason} 
      />
    </DashboardShell>
  );
}
