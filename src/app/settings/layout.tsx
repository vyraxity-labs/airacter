import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { SettingsSidebar } from "./settings-sidebar";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  return (
    <DashboardShell user={session.user} sidebar={<SettingsSidebar />}>
      {children}
    </DashboardShell>
  );
}
