"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Coins, ArrowRight, History, MessageSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PackDetails {
  id: "lite" | "standard" | "pro";
  name: string;
  tokens: number;
}

const PACKS: Record<string, PackDetails> = {
  lite: { id: "lite", name: "Airacter Lite", tokens: 50000 },
  standard: { id: "standard", name: "Airacter Standard", tokens: 150000 },
  pro: { id: "pro", name: "Airacter Pro", tokens: 400000 },
};

export function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packId = searchParams.get("packId") || "standard";
  const txId = searchParams.get("tx") || "mock-tx-123456";
  const pack = PACKS[packId] || PACKS.standard;

  // Optimistic reload of Next.js router data to sync ledger balance on nav
  useEffect(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="flex-grow min-h-screen flex items-center justify-center bg-background px-8 pb-24">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 text-center space-y-6 relative overflow-hidden shadow-2xl">
        
        {/* Animated Checkmark Indicator */}
        <div className="flex justify-center relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse scale-150"></div>
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center relative z-10">
            <CheckCircle2 className="text-primary animate-bounce" size={36} />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-on-surface tracking-tight">
            Payment Completed!
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your payment has been simulated successfully and your account token balance is updated.
          </p>
        </div>

        {/* Credit details receipt box */}
        <div className="bg-surface-container/30 border border-border/10 rounded-2xl p-5 text-left space-y-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant font-semibold">Package Tier</span>
            <span className="text-on-surface font-extrabold">{pack.name}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant font-semibold">Tokens Added</span>
            <span className="text-primary font-black flex items-center gap-1">
              <Coins size={14} />
              +{pack.tokens.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pt-3.5 border-t border-border/10">
            <span className="text-on-surface-variant font-semibold">Transaction ID</span>
            <span className="text-on-surface font-mono text-[10px] bg-surface-container-high px-2 py-0.5 rounded border border-border">
              {txId}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-on-surface-variant/70 italic">
          High-speed tokens have been credited to your ledger.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/chats"
            className="w-full py-3.5 rounded-xl bg-primary text-white font-extrabold text-xs hover:bg-opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 scale-98 active:scale-95"
          >
            <MessageSquare size={14} />
            Start Chatting Now
            <ArrowRight size={14} />
          </Link>

          <Link
            href="/settings"
            className="w-full py-3.5 rounded-xl border border-border text-on-surface hover:bg-surface-container font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer scale-98 active:scale-95"
          >
            <History size={14} />
            View Account Ledger
          </Link>
        </div>

        <div className="absolute -left-16 -top-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
}
