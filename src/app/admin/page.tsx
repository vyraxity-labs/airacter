import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminClient } from "@/components/admin/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // Enforce ADMIN role check
  const role = (session.user as any).role || "USER";
  if (role !== "ADMIN") {
    redirect("/explore");
  }

  return (
    <DashboardShell user={session.user}>
      <AdminClient />
    </DashboardShell>
  );
}
