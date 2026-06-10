import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, ShieldCheck, Coins, ArrowUpRight, Check, Calendar, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BillingSettingsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const invoices = [
    { id: "INV-2026-003", date: "June 01, 2026", amount: "$19.00", status: "Paid" },
    { id: "INV-2026-002", date: "May 01, 2026", amount: "$19.00", status: "Paid" },
    { id: "INV-2026-001", date: "April 01, 2026", amount: "$19.00", status: "Paid" },
  ];

  return (
    <div className="flex-1 min-h-screen overflow-y-auto custom-scrollbar select-none bg-background">
      {/* TOP APP BAR */}
      <header className="sticky top-0 z-40 h-16 w-full flex justify-between items-center px-8 bg-surface/80 border-b border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <CreditCard size={16} />
            Billing & Subscriptions
          </h2>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="max-w-5xl mx-auto py-10 px-8 space-y-8 pb-24">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Plan Card */}
          <section className="lg:col-span-8 glass-panel rounded-3xl p-8 relative flex flex-col justify-between bg-primary/[0.02]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-primary/10 border border-primary/20">
                    Active Plan
                  </span>
                  <h3 className="text-2xl font-black text-on-surface mt-3">Pro Member Workspace</h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Unlimited custom personas and premium model endpoints.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-on-surface">$19.00</div>
                  <div className="text-[10px] text-on-surface-variant">per month</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/20">
                <div className="flex items-start gap-2.5">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">100k Monthly Token Refresh</h4>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Automatically credited on the 1st of every month.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Premium Models Access</h4>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Zero rate-limits on advanced agentic chat models.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/20">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Calendar size={14} className="text-primary" />
                <span>Next renewal: <strong>July 01, 2026</strong></span>
              </div>

              <Link
                href="/upgrade"
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:bg-opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Upgrade Plan
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </section>

          {/* Payment Method Card */}
          <section className="lg:col-span-4 glass-panel rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-6">
                <CreditCard size={18} className="text-primary" />
                Payment Method
              </h3>

              <div className="bg-surface-container/40 border border-border/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div className="text-xs font-bold text-on-surface-variant">Preferred Card</div>
                  <ShieldCheck size={20} className="text-primary" />
                </div>
                
                <div className="text-sm font-mono text-on-surface tracking-wider mb-2">
                  •••• •••• •••• 4242
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                  <span>EXPIRES: 12/29</span>
                  <span>VISA</span>
                </div>
              </div>
            </div>

            <button className="w-full mt-8 py-3 rounded-xl border border-border text-on-surface hover:bg-surface-container font-semibold text-xs transition-all cursor-pointer">
              Update Payment Card
            </button>
          </section>
        </div>

        {/* Invoice History */}
        <section className="glass-panel rounded-3xl p-8">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-6">
            <FileText size={16} className="text-primary" />
            Billing History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/40 text-on-surface-variant font-extrabold text-[10px] uppercase tracking-widest">
                  <th className="pb-4 px-2">Invoice ID</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border/10 hover:bg-surface-container-high/20 transition-colors"
                  >
                    <td className="py-4 px-2 font-bold text-on-surface">
                      {inv.id}
                    </td>
                    <td className="py-4 text-on-surface-variant">
                      {inv.date}
                    </td>
                    <td className="py-4 font-bold text-on-surface">
                      {inv.amount}
                    </td>
                    <td className="py-4 text-right">
                      <span className="px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border bg-primary/10 border-primary/20 text-primary">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
