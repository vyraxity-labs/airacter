import React, { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { SuccessClient } from "@/components/upgrade/success-client";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuccessPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  return (
    <DashboardShell user={session.user}>
      <Suspense fallback={
        <div className="flex-1 min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      }>
        <SuccessClient />
      </Suspense>
    </DashboardShell>
  );
}
