import React, { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { CheckoutClient } from "@/components/upgrade/checkout-client";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
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
        <CheckoutClient />
      </Suspense>
    </DashboardShell>
  );
}
