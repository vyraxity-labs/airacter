"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  User as UserIcon, 
  Coins, 
  Trash2, 
  Edit, 
  Check, 
  Loader2, 
  History, 
  ShieldAlert,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  direction: "credit" | "debit";
  amount: number;
  createdAt: string;
  chatName: string;
}

interface ProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  initialBalance: number;
  initialTransactions: Transaction[];
}

export function ProfileClient({ user, initialBalance, initialTransactions }: ProfileClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [displayName, setDisplayName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to render user initials if no image is present
  const initials = (displayName || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      setErrorMsg("Display name must be at least 2 characters.");
      return;
    }

    setErrorMsg("");
    setSaveSuccess(false);

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: displayName.trim() }),
        });

        const resData = await response.json();

        if (!response.ok) {
          throw new Error(resData.error || "Failed to update profile name");
        }

        setSaveSuccess(true);
        setIsEditing(false);
        router.refresh();
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to save. Please try again.");
      }
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmInput !== "DELETE") return;
    setErrorMsg("");
    setIsDeleting(true);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "DELETE",
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Failed to delete account");
      }

      await signOut({ callbackUrl: "/auth/register" });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during account deletion.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatTxType = (type: string) => {
    return type
      .replace("credit_", "")
      .replace("debit_", "")
      .replace(/_/g, " ")
      .toUpperCase();
  };

  return (
    <div className="flex-1 min-h-screen overflow-y-auto custom-scrollbar select-none bg-background">
      {/* TOP APP BAR */}
      <header className="sticky top-0 z-40 h-16 w-full flex justify-between items-center px-8 bg-surface/80 border-b border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <UserIcon size={16} />
            Profile Settings
          </h2>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="max-w-5xl mx-auto py-10 px-8 space-y-8 pb-24">
        {errorMsg && (
          <div className="p-4 rounded-xl border border-error/20 bg-error/10 text-error text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile Edit Card (8 Columns) */}
          <section className="lg:col-span-8 glass-panel rounded-3xl p-8 relative flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={displayName || "User Profile"}
                        className="w-24 h-24 rounded-full border-4 border-surface-container object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-surface-container bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold font-sans">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-on-surface">
                      {displayName || "User"}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                      {user.email}
                    </p>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-all font-bold text-xs cursor-pointer"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={isPending}
                      className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface"
                      placeholder="Enter display name"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-opacity-90 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(user.name);
                      }}
                      className="px-5 py-2.5 rounded-xl border border-border text-on-surface hover:bg-surface-container font-semibold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                      Display Name
                    </label>
                    <div className="bg-surface-container/30 p-3.5 rounded-xl border border-border/20 text-sm font-semibold text-on-surface">
                      {displayName || "None set"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                      Email Address
                    </label>
                    <div className="bg-surface-container/30 p-3.5 rounded-xl border border-border/20 text-sm font-semibold text-on-surface-variant">
                      {user.email}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {saveSuccess && (
              <div className="mt-6 flex items-center gap-1.5 text-xs text-primary font-bold">
                <UserCheck size={14} />
                Profile name updated successfully.
              </div>
            )}
          </section>

          {/* Token Balance Card (4 Columns) */}
          <section className="lg:col-span-4 gradient-primary rounded-3xl p-8 flex flex-col text-white relative overflow-hidden glow-active shadow-lg shadow-primary/10">
            <div className="relative z-10 flex-grow">
              <div className="flex justify-between items-start mb-6">
                <Coins size={28} className="text-white" />
                <span className="bg-white/20 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  Active Plan
                </span>
              </div>
              <h4 className="text-[10px] uppercase tracking-widest opacity-80 font-bold mb-1">
                Available Balance
              </h4>
              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-4xl font-extrabold leading-none">
                  {initialBalance.toLocaleString()}
                </span>
                <span className="text-xs font-semibold opacity-85">tokens</span>
              </div>

              {/* Progress bar mock */}
              <div className="w-full bg-white/20 rounded-full h-1.5 mb-2 overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: "90%" }}></div>
              </div>
              <p className="text-[10px] opacity-80 mb-8 font-medium">
                Token allocation re-calculates instantly on chat activities.
              </p>
            </div>

            <Link
              href="/upgrade"
              className="relative z-10 w-full bg-white text-primary text-center py-3 rounded-xl font-extrabold hover:bg-opacity-95 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Coins size={14} />
              Buy Tokens
            </Link>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </section>
        </div>

        {/* Recent Usage Section */}
        <section className="glass-panel rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <History size={16} className="text-primary" />
              Recent Usage Ledger
            </h3>
          </div>

          <div className="overflow-x-auto select-none">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/40 text-on-surface-variant font-extrabold text-[10px] uppercase tracking-widest">
                  <th className="pb-4 px-2">Description / Chat</th>
                  <th className="pb-4">Tokens</th>
                  <th className="pb-4">Transaction Type</th>
                  <th className="pb-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium">
                {initialTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-on-surface-variant opacity-60">
                      No recent token usage recorded.
                    </td>
                  </tr>
                ) : (
                  initialTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border/10 hover:bg-surface-container-high/20 transition-colors"
                    >
                      <td className="py-4 px-2 font-bold text-on-surface">
                        {tx.chatName}
                      </td>
                      <td className={cn(
                        "py-4 font-extrabold",
                        tx.direction === "credit" ? "text-primary" : "text-on-surface-variant"
                      )}>
                        {tx.direction === "credit" ? "+" : "-"}{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border",
                          tx.direction === "credit" 
                            ? "bg-primary/10 border-primary/20 text-primary" 
                            : "bg-surface-container-high border-border text-on-surface-variant"
                        )}>
                          {formatTxType(tx.type)}
                        </span>
                      </td>
                      <td className="py-4 text-on-surface-variant text-right">
                        {new Date(tx.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-12 border-t border-border/40">
          <div className="glass-panel border-error/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-error/5">
            <div className="flex items-start gap-4">
              <ShieldAlert size={24} className="text-error shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm text-error">Danger Zone</h4>
                <p className="text-xs text-on-surface-variant max-w-lg mt-1 leading-relaxed">
                  Permanently delete your account and all associated persona data, saved libraries, active chats, and tokens. This action is irreversible.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setDeleteConfirmInput("");
                setShowDeleteModal(true);
              }}
              className="px-6 py-3 rounded-xl border border-error/50 text-error hover:bg-error/10 hover:border-error transition-all font-bold text-xs scale-98 active:scale-95 cursor-pointer shrink-0"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-error/20 bg-surface shadow-2xl relative">
            <h3 className="text-lg font-bold text-error flex items-center gap-2 mb-4">
              <ShieldAlert size={20} />
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              This will permanently delete your account. To confirm, please type{" "}
              <span className="font-extrabold text-on-surface bg-surface-container px-2 py-0.5 rounded border border-border">
                DELETE
              </span>{" "}
              below.
            </p>
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              className="w-full bg-surface-container-high/40 border border-error/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-error text-sm text-on-surface mb-6"
              placeholder="Type DELETE to confirm"
            />
            <div className="flex gap-3 justify-end">
              <button
                disabled={isDeleting || deleteConfirmInput !== "DELETE"}
                onClick={handleDeleteAccount}
                className={cn(
                  "px-5 py-2.5 rounded-xl bg-error text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer",
                  deleteConfirmInput !== "DELETE" && "opacity-50 cursor-not-allowed"
                )}
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Permanently Delete
              </button>
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-on-surface hover:bg-surface-container font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
