"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThemeStore } from "@/hooks/use-theme-store";
import { 
  MessageSquare, 
  Users, 
  Compass, 
  Settings, 
  HelpCircle, 
  Sun, 
  Moon, 
  LogOut, 
  Sparkles,
  User as UserIcon
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardShell({ children, sidebar, user }: DashboardShellProps) {
  const pathname = usePathname() || "";
  const { theme, toggleTheme } = useThemeStore();

  const navItems = [
    {
      label: "Chats",
      href: "/chats",
      icon: MessageSquare,
      active: pathname.startsWith("/chats"),
    },
    {
      label: "Roles",
      href: "/characters/my",
      icon: Users,
      active: pathname.startsWith("/characters"),
    },
    {
      label: "Explore",
      href: "/explore",
      icon: Compass,
      active: pathname.startsWith("/explore"),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
  ];

  // Helper to render user avatar or initials
  const renderAvatar = () => {
    if (user?.image) {
      return (
        <img
          src={user.image}
          alt={user.name || "User Profile"}
          className="w-8 h-8 rounded-full border-2 border-primary object-cover"
        />
      );
    }
    const initials = (user?.name || user?.email || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return (
      <div className="w-8 h-8 rounded-full border-2 border-primary bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-sans">
        {initials}
      </div>
    );
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background text-foreground font-sans theme-transition">
      {/* 1. Left Nav Rail - Desktop (Fixed) */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-[72px] z-50 flex-col items-center py-5 bg-surface-lowest border-r border-border/40 backdrop-blur-xl theme-transition">
        {/* Brand Logo */}
        <div className="mb-8 flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/10 hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer">
            <Sparkles size={20} />
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col gap-4 flex-grow items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center scale-95 active:scale-90 hover:bg-surface-container",
                  item.active 
                    ? "text-primary bg-primary-container/20 active-glow shadow-glow-primary border border-primary/20" 
                    : "text-on-surface-variant hover:text-on-surface"
                )}
                title={item.label}
              >
                <Icon size={20} className={cn(item.active && "stroke-[2.5px]")} />
                
                {/* Floating Tooltip */}
                <span className="absolute left-[76px] px-2.5 py-1.5 rounded-lg bg-surface-highest text-on-surface text-xs font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md whitespace-nowrap z-50 border border-border">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col gap-5 items-center mt-auto">
          {/* Help */}
          <Link
            href="/help"
            className="text-on-surface-variant hover:text-on-surface p-2.5 hover:bg-surface-container rounded-xl transition-colors scale-95 active:scale-90"
            title="Help & Info"
          >
            <HelpCircle size={20} />
          </Link>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="text-on-surface-variant hover:text-on-surface p-2.5 hover:bg-surface-container rounded-xl transition-colors scale-95 active:scale-90 cursor-pointer"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Profile & Logout */}
          <div className="pt-4 border-t border-border/40 w-full flex flex-col gap-3 items-center">
            {renderAvatar()}
            
            <button
              onClick={handleSignOut}
              className="text-on-surface-variant hover:text-destructive p-2.5 hover:bg-destructive/10 rounded-xl transition-colors scale-95 active:scale-90 cursor-pointer"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Bottom Nav Bar - Mobile (Fixed) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 z-50 bg-surface-lowest/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-4 theme-transition">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200 flex flex-col items-center justify-center flex-1 max-w-20",
                item.active 
                  ? "text-primary bg-primary-container/10 border-t-2 border-primary rounded-none" 
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Icon size={18} />
              <span className="text-[10px] mt-1 font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* Theme Switcher - Mobile */}
        <button
          onClick={toggleTheme}
          className="text-on-surface-variant p-2.5 flex flex-col items-center justify-center flex-1 max-w-20 cursor-pointer"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-[10px] mt-1 font-medium leading-none">Theme</span>
        </button>

        {/* Profile / Logout - Mobile */}
        <button
          onClick={handleSignOut}
          className="text-on-surface-variant p-2.5 flex flex-col items-center justify-center flex-1 max-w-20 cursor-pointer"
        >
          <LogOut size={18} />
          <span className="text-[10px] mt-1 font-medium leading-none">Logout</span>
        </button>
      </nav>

      {/* 3. Middle Sidebar (Conditional, Desktop only) */}
      {sidebar && (
        <aside className="hidden md:flex flex-col w-[280px] h-screen fixed left-[72px] top-0 bg-surface-low border-r border-border/40 backdrop-blur-md z-40 theme-transition">
          {sidebar}
        </aside>
      )}

      {/* 4. Main Viewport */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen pb-16 md:pb-0",
          sidebar ? "md:pl-[352px]" : "md:pl-[72px]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
