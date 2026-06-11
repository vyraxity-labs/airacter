"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Coins, 
  Flag, 
  Search, 
  Loader2, 
  User as UserIcon, 
  Check, 
  AlertTriangle,
  Award,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Creator {
  id: string;
  name: string | null;
  email: string;
}

interface Character {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarType: "emoji" | "initials" | "image";
  avatarValue: string;
  avatarColor: string;
  category: string;
  tone: string[];
  isVerified: boolean;
  isFeatured: boolean;
  visibility: "public" | "private";
  creator: Creator;
  createdAt: string;
}

interface Report {
  id: string;
  characterId: string;
  reportedBy: string;
  category: string;
  notes: string | null;
  status: string;
  createdAt: string;
  character: Character;
  user: Creator;
}

export function AdminClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"approvals" | "reports" | "tokens">("approvals");
  
  // Data queues
  const [pendingChars, setPendingChars] = useState<Character[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Token adjustment form
  const [tokenEmail, setTokenEmail] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenReason, setTokenReason] = useState("");
  const [tokenPending, setTokenPending] = useState(false);
  const [tokenSuccess, setTokenSuccess] = useState("");

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectCharId, setRejectCharId] = useState("");
  const [rejectReportId, setRejectReportId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isResolvingReport, setIsResolvingReport] = useState(false);

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/queue");
      if (!res.ok) throw new Error("Failed to fetch admin queue data");
      const data = await res.json();
      setPendingChars(data.pendingCharacters || []);
      setReports(data.reportedCharacters || []);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred loading queues.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (characterId: string) => {
    setProcessingId(characterId);
    try {
      const res = await fetch("/api/admin/characters/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, action: "approve" }),
      });

      if (!res.ok) throw new Error("Approval request failed");
      
      // Update state local
      setPendingChars((prev) => prev.filter((c) => c.id !== characterId));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to approve character.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReject = (characterId: string, reportId: string = "", isReport: boolean = false) => {
    setRejectCharId(characterId);
    setRejectReportId(reportId);
    setRejectReason("");
    setIsResolvingReport(isReport);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMsg("A rejection reason is required.");
      return;
    }

    setShowRejectModal(false);
    setProcessingId(isResolvingReport ? rejectReportId : rejectCharId);

    try {
      const res = await fetch("/api/admin/characters/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: rejectCharId,
          action: isResolvingReport ? "resolve_report" : "reject",
          reportId: rejectReportId || undefined,
          reason: rejectReason.trim(),
        }),
      });

      if (!res.ok) throw new Error("Rejection request failed");

      // Refresh list
      if (isResolvingReport) {
        setReports((prev) => prev.filter((r) => r.id !== rejectReportId));
      } else {
        setPendingChars((prev) => prev.filter((c) => c.id !== rejectCharId));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process rejection.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismissReport = async (reportId: string, characterId: string) => {
    setProcessingId(reportId);
    try {
      const res = await fetch("/api/admin/characters/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          action: "dismiss_report",
          reportId,
        }),
      });

      if (!res.ok) throw new Error("Dismiss report request failed");

      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dismiss report.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFeature = async (characterId: string, currentFeatured: boolean) => {
    setProcessingId(characterId + "-feat");
    try {
      const res = await fetch("/api/admin/characters/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          isFeatured: !currentFeatured,
        }),
      });

      if (!res.ok) throw new Error("Feature toggle request failed");

      setPendingChars((prev) =>
        prev.map((c) => (c.id === characterId ? { ...c, isFeatured: !currentFeatured } : c))
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to toggle feature status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAdjustTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setTokenSuccess("");
    setTokenPending(true);

    const amountNum = parseInt(tokenAmount);
    if (isNaN(amountNum) || amountNum === 0) {
      setErrorMsg("Amount must be a non-zero integer.");
      setTokenPending(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/tokens/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: tokenEmail.trim(),
          amount: amountNum,
          reason: tokenReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Token adjustment failed");

      setTokenSuccess(
        `Successfully adjusted ledger! user ${data.userName} now has ${data.newBalance.toLocaleString()} tokens.`
      );
      setTokenEmail("");
      setTokenAmount("");
      setTokenReason("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to perform token adjustment.");
    } finally {
      setTokenPending(false);
    }
  };

  // Helper to render user initials if no image is present
  const renderAvatar = (char: Character) => {
    if (char.avatarType === "image" && char.avatarValue) {
      return (
        <img
          src={char.avatarValue}
          alt={char.name}
          className="w-12 h-12 rounded-xl border border-border/20 object-cover"
        />
      );
    }
    
    const initials = char.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return (
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white border border-border/20 relative"
        style={{ backgroundColor: char.avatarColor }}
      >
        {char.avatarType === "emoji" ? char.avatarValue : initials}
      </div>
    );
  };

  return (
    <div className="flex-grow min-h-screen overflow-y-auto custom-scrollbar select-none bg-background pb-24">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 h-16 w-full flex justify-between items-center px-8 bg-surface/80 border-b border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Shield size={16} />
            Admin Queue Control Room
          </h2>
        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <div className="max-w-6xl mx-auto py-10 px-8 space-y-8">
        {errorMsg && (
          <div className="p-4 rounded-xl border border-error/20 bg-error/10 text-error text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {tokenSuccess && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/10 text-primary text-xs font-semibold flex items-center gap-2">
            <CheckCircle size={16} />
            {tokenSuccess}
          </div>
        )}

        {/* TAB SELECTOR */}
        <div className="flex gap-2 p-1.5 bg-surface-container/50 border border-border/30 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("approvals")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs transition-all scale-98 active:scale-95 cursor-pointer flex items-center gap-1.5",
              activeTab === "approvals"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            )}
          >
            <CheckCircle size={14} />
            Pending Reviews ({pendingChars.length})
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs transition-all scale-98 active:scale-95 cursor-pointer flex items-center gap-1.5",
              activeTab === "reports"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            )}
          >
            <Flag size={14} />
            Reported Content ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab("tokens")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold text-xs transition-all scale-98 active:scale-95 cursor-pointer flex items-center gap-1.5",
              activeTab === "tokens"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            )}
          >
            <Coins size={14} />
            Token Ledger Adjuster
          </button>
        </div>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={36} />
          </div>
        ) : activeTab === "approvals" ? (
          /* PENDING APPROVALS QUEUE */
          <section className="space-y-4">
            {pendingChars.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border/40 rounded-3xl bg-surface-container/10">
                <Check className="mx-auto text-primary/40 mb-3" size={32} />
                <p className="text-xs text-on-surface-variant font-semibold">
                  Queue Empty. All public characters are verified!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingChars.map((char) => (
                  <div key={char.id} className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
                    <div className="flex gap-4">
                      {renderAvatar(char)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-on-surface">{char.name}</h4>
                          <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            {char.category}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 h-8">
                          {char.description}
                        </p>
                      </div>
                    </div>

                    {/* Creator Box */}
                    <div className="p-3 rounded-2xl bg-surface-container/20 border border-border/10 flex justify-between items-center text-[10px]">
                      <div>
                        <span className="text-on-surface-variant font-medium block">Creator Account</span>
                        <span className="text-on-surface font-semibold">{char.creator.email}</span>
                      </div>
                      <a 
                        href={`/chats?character=${char.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-bold shrink-0"
                      >
                        Sandbox
                        <ExternalLink size={10} />
                      </a>
                    </div>

                    {/* Action Panel */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApprove(char.id)}
                        disabled={processingId !== null}
                        className="flex-1 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-opacity-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {processingId === char.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        Verify
                      </button>

                      <button
                        onClick={() => handleToggleFeature(char.id, char.isFeatured)}
                        disabled={processingId !== null}
                        className={cn(
                          "px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                          char.isFeatured 
                            ? "bg-secondary/15 border-secondary/30 text-secondary" 
                            : "border-border text-on-surface-variant hover:bg-surface-container"
                        )}
                        title="Toggle Featured Spot"
                      >
                        {processingId === char.id + "-feat" ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Award size={12} />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenReject(char.id)}
                        disabled={processingId !== null}
                        className="flex-1 py-2 rounded-xl border border-error/30 text-error hover:bg-error/5 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle size={12} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : activeTab === "reports" ? (
          /* REPORTED CONTENT QUEUE */
          <section className="space-y-4">
            {reports.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border/40 rounded-3xl bg-surface-container/10">
                <Check className="mx-auto text-primary/40 mb-3" size={32} />
                <p className="text-xs text-on-surface-variant font-semibold">
                  Queue Clean. No pending reports recorded!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/25 flex items-center justify-center shrink-0">
                        <Flag className="text-error" size={18} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-error uppercase tracking-wider bg-error/10 px-2.5 py-0.5 rounded">
                            {report.category}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">
                            Target Character: <strong>{report.character.name}</strong>
                          </span>
                          <span className="text-[10px] text-on-surface-variant/40">•</span>
                          <span className="text-[10px] text-on-surface-variant">
                            Creator: {report.character.creator.email}
                          </span>
                        </div>
                        
                        {report.notes && (
                          <div className="text-xs bg-surface-container/30 border border-border/20 rounded-xl p-3 max-w-2xl font-medium text-on-surface italic">
                            &ldquo;{report.notes}&rdquo;
                          </div>
                        )}

                        <div className="text-[10px] text-on-surface-variant">
                          Reported by: <strong>{report.user.email}</strong> on {new Date(report.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Moderation actions */}
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleDismissReport(report.id, report.characterId)}
                        disabled={processingId !== null}
                        className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl border border-border text-on-surface hover:bg-surface-container font-bold text-xs transition-all cursor-pointer"
                      >
                        Dismiss
                      </button>

                      <button
                        onClick={() => handleOpenReject(report.characterId, report.id, true)}
                        disabled={processingId !== null}
                        className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-error text-white hover:bg-opacity-95 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        Restrict (Private)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          /* MANUAL TOKEN LEDGER ADJUSTER */
          <section className="glass-panel rounded-3xl p-8 max-w-xl">
            <h3 className="text-base font-bold text-on-surface mb-2 flex items-center gap-2">
              <Coins className="text-primary" size={18} />
              Manual Token Adjustment
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              Adjust user available token balance by submitting an audit log. Positive values credit tokens; negative values debit tokens.
            </p>

            <form onSubmit={handleAdjustTokens} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                  User Email Address
                </label>
                <input
                  type="email"
                  required
                  value={tokenEmail}
                  onChange={(e) => setTokenEmail(e.target.value)}
                  className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface"
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                  Adjustment Value (+/-)
                </label>
                <input
                  type="number"
                  required
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface font-mono"
                  placeholder="e.g. 10000 or -5000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                  Reason for Adjustment
                </label>
                <textarea
                  required
                  rows={3}
                  value={tokenReason}
                  onChange={(e) => setTokenReason(e.target.value)}
                  className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface resize-none"
                  placeholder="Provide detailed description for transaction history audit log..."
                />
              </div>

              <button
                type="submit"
                disabled={tokenPending}
                className="px-6 py-3 rounded-xl bg-primary text-white font-extrabold text-xs hover:bg-opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {tokenPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Coins size={14} />
                )}
                Submit Ledger Adjustment
              </button>
            </form>
          </section>
        )}
      </div>

      {/* REJECTION / RESOLVE REPORT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-border bg-surface shadow-2xl relative">
            <h3 className="text-lg font-bold text-error flex items-center gap-2 mb-2">
              <AlertTriangle size={20} />
              Confirm Content Rejection
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              This will set the character to <strong>private</strong> and log a 24-hour resubmission block. 
              The creator will see the reason below.
            </p>
            
            <div className="space-y-1.5 mb-6">
              <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                Rejection Reason (creator audit)
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-surface-container-high/40 border border-border/30 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-error text-sm text-on-surface"
                placeholder="Briefly explain the issue (e.g., contains duplicate prompts, inappropriate images, etc.)..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
                className="px-5 py-2.5 rounded-xl bg-error text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                Restrict Character
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
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
