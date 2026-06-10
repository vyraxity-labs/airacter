import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApiKeysClient } from "@/components/settings/api-keys-client";

export const dynamic = "force-dynamic";

export default async function ApiKeysSettingsPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/auth/login");
  }

  return <ApiKeysClient />;
}
