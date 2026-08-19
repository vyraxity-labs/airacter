import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/components/settings/notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsSettingsPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/auth/login");
  }

  return <NotificationsClient />;
}
