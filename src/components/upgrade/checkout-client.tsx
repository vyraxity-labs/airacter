"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, ArrowLeft, ShieldCheck, Lock, Check, Loader2, Coins, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PackDetails {
  id: "lite" | "standard" | "pro";
  name: string;
  price: string;
  tokens: number;
}

const PACKS: Record<string, PackDetails> = {
  lite: { id: "lite", name: "Airacter Lite", price: "$4.99", tokens: 50000 },
  standard: { id: "standard", name: "Airacter Standard", price: "$9.99", tokens: 150000 },
  pro: { id: "pro", name: "Airacter Pro", price: "$19.99", tokens: 400000 },
};

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packId = searchParams.get("packId") || "standard";
  const pack = PACKS[packId] || PACKS.standard;

  // Form states
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  
  // Checkout process states
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepText, setStepText] = useState("Securing connection...");
  const [errorMsg, setErrorMsg] = useState("");

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (cardNumber.replace(/\s/g, "").length < 16) {
      setErrorMsg("Please enter a valid 16-digit card number.");
      return;
    }
    if (expiry.length < 5) {
      setErrorMsg("Please enter a valid card expiry date (MM/YY).");
      return;
    }
    if (cvc.length < 3) {
      setErrorMsg("Please enter a valid CVV/CVC code.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Please enter the cardholder's name.");
      return;
    }

    setIsProcessing(true);
    
    // Simulate interactive secure payment steps
    const steps = [
      "Securing connection...",
      "Authorizing with card issuer...",
      "Verifying secure transaction token...",
      "Crediting balance ledger...",
    ];

    for (let i = 0; i < steps.length; i++) {
      setStepText(steps[i]);
      await new Promise((res) => setTimeout(res, 800));
    }

    try {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment verification failed");
      }

      router.push(`/upgrade/success?packId=${pack.id}&tx=${data.transactionId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred finalizing the payment ledger.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-grow min-h-screen overflow-y-auto custom-scrollbar select-none bg-background pb-24">
      <div className="max-w-5xl mx-auto py-10 px-8">
        
        {/* BACK ACTION */}
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary font-bold mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Plans
        </Link>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-error/20 bg-error/10 text-error text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: ORDER SUMMARY (5 Columns) */}
          <section className="lg:col-span-5 glass-panel rounded-3xl p-6 space-y-6">
            <div>
              <span className="text-[10px] text-primary uppercase font-bold tracking-widest block mb-1">
                Review Order
              </span>
              <h3 className="text-lg font-bold text-on-surface">Order Summary</h3>
            </div>

            {/* Pack Emblem */}
            <div className="bg-surface-container/30 border border-border/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Coins size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">{pack.name}</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {pack.tokens.toLocaleString()} High-Speed Tokens
                </p>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-3.5 pt-4 border-t border-border/20">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant font-medium">Subtotal</span>
                <span className="text-on-surface font-bold">{pack.price}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant font-medium">VAT / Sales Tax (0%)</span>
                <span className="text-on-surface font-bold">$0.00</span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-dashed border-border/20">
                <span className="text-sm font-bold text-on-surface">Total Due</span>
                <span className="text-lg font-black text-primary">{pack.price}</span>
              </div>
            </div>

            {/* Security trust badge */}
            <div className="pt-2 flex items-center gap-2 text-[10px] text-on-surface-variant/70 font-semibold leading-relaxed">
              <ShieldCheck className="text-primary shrink-0" size={16} />
              <span>Payments are simulated securely. No real money will be charged.</span>
            </div>
          </section>

          {/* RIGHT COLUMN: CARD PAYMENT SIMULATOR (7 Columns) */}
          <section className="lg:col-span-7 glass-panel rounded-3xl p-8 relative overflow-hidden">
            {isProcessing ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="animate-spin text-primary" size={36} />
                <h4 className="text-sm font-bold text-on-surface">{stepText}</h4>
                <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                  Completing your ledger top-up safely. Do not refresh or close this browser session.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <CreditCard size={18} className="text-primary" />
                    Secure Simulated Checkout
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Enter any mock details or use the standard test card credential to complete purchase.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Card Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 pl-10 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface font-mono"
                        placeholder="4242 4242 4242 4242"
                      />
                      <Lock className="absolute left-3.5 top-3.5 text-on-surface-variant/50" size={16} />
                    </div>
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface font-mono"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                        CVC / CVV
                      </label>
                      <input
                        type="password"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ""))}
                        maxLength={4}
                        className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface font-mono"
                        placeholder="•••"
                      />
                    </div>
                  </div>

                  {/* Name on Card */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider ml-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface-container/50 border border-border/40 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm text-on-surface font-sans"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-2.5">
                  <ShieldCheck className="text-primary shrink-0 mt-0.5" size={14} />
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Test Mode: Use the card number <strong>4242 4242 4242 4242</strong> with any expiry date and CVC to test.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-primary text-white font-extrabold text-xs hover:bg-opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                >
                  <Lock size={14} />
                  Pay {pack.price} Securely
                </button>
              </form>
            )}
            <div className="absolute -right-16 -bottom-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
          </section>

        </div>
      </div>
    </div>
  );
}
