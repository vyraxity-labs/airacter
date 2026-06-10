"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  KeyRound, 
  Smartphone, 
  History, 
  LogOut, 
  Check, 
  Loader2, 
  Monitor, 
  Smartphone as PhoneIcon,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  device: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export function SecurityClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 2FA Mock state (synced with localStorage)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [is2FALoading, setIs2FALoading] = useState(true);

  // Active Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    // Sync 2FA state from localStorage on mount
    const saved2FA = localStorage.getItem("airacter_mock_2fa");
    if (saved2FA === "true") {
      setTwoFactorEnabled(true);
    }
    setIs2FALoading(false);

    // Fetch active sessions
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    setSessionsError("");
    try {
      const res = await fetch("/api/settings/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err: any) {
      setSessionsError(err.message || "An error occurred loading sessions.");
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: currentPassword || undefined,
            newPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update password");
        }

        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 5000);
      } catch (err: any) {
        setPasswordError(err.message || "Failed to update password.");
      }
    });
  };

  const handleToggle2FA = () => {
    const newState = !twoFactorEnabled;
    setTwoFactorEnabled(newState);
    localStorage.setItem("airacter_mock_2fa", newState.toString());
  };

  const handleRevokeOtherSessions = async () => {
    setRevoking(true);
    try {
      const res = await fetch("/api/settings/sessions", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to revoke other sessions");
      }

      // Refresh session list
      await fetchSessions();
    } catch (err: any) {
      setSessionsError(err.message || "Failed to revoke other sessions.");
    } finally {
      setRevoking(false);
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const nameLower = deviceName.toLowerCase();
    if (nameLower.includes("ios") || nameLower.includes("iphone") || nameLower.includes("android") || nameLower.includes("mobile")) {
      return <PhoneIcon className="text-primary/70 shrink-0" size={18} />;
    }
    return <Monitor className="text-primary/70 shrink-0" size={18} />;
  };

  return (
    <div className="flex-1 min-h-screen overflow-y-auto custom-scrollbar select-none bg-background">
      {/* TOP APP BAR */}
      <header className="sticky top-0 z-40 h-16 w-full flex justify-between items-center px-8 bg-surface/80 border-b border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Shield size={16} />
            Security Settings
          </h2>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="max-w-5xl mx-auto py-10 px-8 space-y-8 pb-24">
        
        {/* Row 1: Password & 2FA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Change Password Card */}
          <section className="lg:col-span-8 glass-panel rounded-3xl p-8 relative flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-6">
                <KeyRound size={18} className="text-primary" />
                Change Password
              </h3>

              {passwordError && (
                <div className="p-3.5 mb-5 rounded-xl border border-error/20 bg-error/10 text-error text-xs font-semibold">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3.5 mb-5 rounded-xl border border-primary/20 bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1.5">
                  <Check size={14} />
                  Password updated successfully!
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface"
                    placeholder="Repeat new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-opacity-90 flex items-center gap-1.5 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Update Password
                </button>
              </form>
            </div>
          </section>

          {/* Mock 2FA Card */}
          <section className="lg:col-span-4 glass-panel rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4">
                <Smartphone size={18} className="text-primary" />
                Two-Factor Auth
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                Protect your account by requiring an authentication token upon login attempts.
              </p>

              {!is2FALoading && (
                <div className="bg-surface-container/30 border border-border/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold block text-on-surface">
                      Authenticator App
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {twoFactorEnabled ? "Configured & Active" : "Not configured"}
                    </span>
                  </div>

                  <button
                    onClick={handleToggle2FA}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer relative",
                      twoFactorEnabled ? "bg-primary" : "bg-surface-container-high"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white transition-all duration-300",
                        twoFactorEnabled ? "translate-x-6" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2.5">
              <AlertTriangle className="text-primary shrink-0 mt-0.5" size={14} />
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Mock 2FA is currently managed locally on this browser session.
              </p>
            </div>
          </section>
        </div>

        {/* Row 2: Active Sessions */}
        <section className="glass-panel rounded-3xl p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <History size={16} className="text-primary" />
                Active Browser Sessions
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                The devices and locations currently logged into your account.
              </p>
            </div>

            {sessions.filter((s) => !s.isCurrent).length > 0 && (
              <button
                onClick={handleRevokeOtherSessions}
                disabled={revoking}
                className="px-5 py-2.5 rounded-xl border border-error/50 text-error hover:bg-error/10 hover:border-error transition-all font-bold text-xs scale-98 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                {revoking ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <LogOut size={14} />
                )}
                Logout of Other Sessions
              </button>
            )}
          </div>

          {sessionsLoading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : sessionsError ? (
            <div className="p-4 rounded-xl border border-error/20 bg-error/10 text-error text-xs font-semibold text-center">
              {sessionsError}
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-on-surface">
                          {session.device}
                        </span>
                        {session.isCurrent && (
                          <span className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-primary">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {session.ipAddress}
                        </span>
                        <span className="text-[10px] text-on-surface-variant/40">•</span>
                        <span className="text-[10px] text-on-surface-variant">
                          Last active: {session.isCurrent ? "Active Now" : new Date(session.lastActive).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
