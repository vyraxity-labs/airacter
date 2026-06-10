import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SecurityClient } from "@/components/settings/security-client";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/auth/login");
  }

  return <SecurityClient />;
}
