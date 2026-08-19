import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { UpgradeClient } from "@/components/upgrade/upgrade-client";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  return (
    <DashboardShell user={session.user}>
      <UpgradeClient />
    </DashboardShell>
  );
}
