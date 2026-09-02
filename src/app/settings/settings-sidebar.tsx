"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, CreditCard, Shield, Bell, Key } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

export function SettingsSidebar() {
  const pathname = usePathname() || "";
  const { t } = useTranslation("settings");

  const tabs = [
    { key: "profile", label: t("sidebar.tabs.profile"), href: "/settings", icon: User },
    { key: "billing", label: t("sidebar.tabs.billing"), href: "/settings/billing", icon: CreditCard },
    { key: "security", label: t("sidebar.tabs.security"), href: "/settings/security", icon: Shield },
    { key: "notifications", label: t("sidebar.tabs.notifications"), href: "/settings/notifications", icon: Bell },
    { key: "api_keys", label: t("sidebar.tabs.api_keys"), href: "/settings/api-keys", icon: Key },
  ];

  return (
    <div className="flex flex-col h-full py-6 px-4">
      <header className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-primary tracking-tight">
          {t("sidebar.title")}
        </h1>
        <p className="text-xs text-on-surface-variant opacity-70">
          {t("sidebar.subtitle")}
        </p>
      </header>
      <nav className="space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all scale-98 active:scale-95 cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface"
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="glass-panel p-4 rounded-xl border border-primary/20 bg-primary/5 select-none">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
            {t("sidebar.support_tier")}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
              {t("sidebar.pro_member")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
