import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { CharacterForm } from "@/components/character-form";

export const dynamic = "force-dynamic";

export default async function NewCharacterPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  return (
    <DashboardShell user={session.user}>
      <CharacterForm />
    </DashboardShell>
  );
}
