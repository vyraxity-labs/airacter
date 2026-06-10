"use client";

import React, { useState } from "react";
import { Key, Copy, Check, Loader2, RefreshCw, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ApiKeysClient() {
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerateKey = async () => {
    setIsPending(true);
    setErrorMsg("");
    setToken("");
    setCopied(false);
    setShowKey(false);

    try {
      const res = await fetch("/api/settings/keys", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate pairing token");
      }

      setToken(data.key);
      setExpiresAt(data.expiresAt);
      setShowKey(true);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred generating the key.");
    } finally {
      setIsPending(false);
    }
  };

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 min-h-screen overflow-y-auto custom-scrollbar select-none bg-background">
      {/* TOP APP BAR */}
      <header className="sticky top-0 z-40 h-16 w-full flex justify-between items-center px-8 bg-surface/80 border-b border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Key size={16} />
            Mobile Pairing & API Keys
          </h2>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="max-w-4xl mx-auto py-10 px-8 space-y-8 pb-24">
        
        {/* Key Generator Card */}
        <section className="glass-panel rounded-3xl p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-on-surface">Generate Pairing Token</h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Use this JWT token to pair your account with the Airacter mobile application.
              This token is valid for 30 days and grants access to your character workspace and token balance.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-error/20 bg-error/10 text-error text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {token ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                    Your Pairing Token (Expires in 30 days)
                  </span>
                  <span className="text-[10px] text-on-surface-variant/80">
                    Expires on: {new Date(expiresAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-surface-container/50 border border-border/40 rounded-xl p-2.5">
                  <div className="flex-1 font-mono text-xs overflow-x-auto whitespace-nowrap scrollbar-none py-1.5 px-2 text-on-surface">
                    {showKey ? token : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all cursor-pointer"
                      title={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1",
                        copied 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      )}
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-[10px] text-on-surface-variant/70 italic">
                  Make sure to copy your token now. It will not be shown again.
                </p>

                <button
                  onClick={handleGenerateKey}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw size={12} className={cn(isPending && "animate-spin")} />
                  Regenerate Token
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center border border-dashed border-border/40 rounded-2xl bg-surface-container/5">
              <Key className="text-primary/30 mb-3" size={32} />
              <p className="text-xs text-on-surface-variant font-medium mb-4 text-center max-w-sm">
                No active session pairing token generated. Click the button below to sign a 30-day token.
              </p>
              <button
                onClick={handleGenerateKey}
                disabled={isPending}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs hover:bg-opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Key size={14} />
                )}
                Generate Pairing Token
              </button>
            </div>
          )}
        </section>

        {/* Warning card */}
        <section className="p-6 rounded-3xl bg-error/5 border border-error/20 flex gap-4">
          <AlertTriangle className="text-error shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-xs font-bold text-error">Security Advisory</h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">
              Your pairing token grants full, unrestricted access to your Airacter account. 
              Never paste this key into untrusted applications, emails, or public repositories. 
              Airacter staff will never ask for your pairing key or secret tokens.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
