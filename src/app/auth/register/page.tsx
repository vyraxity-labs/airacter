"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to register. Please try again.");
      } else {
        setRegistered(true);
      }
    } catch (err: any) {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="flex-grow flex items-center justify-center p-6 relative overflow-hidden min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Background ambient glowing balls */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Main Registration Layout */}
      <div className="relative z-10 w-full max-w-[1000px] grid md:grid-cols-2 gap-12 px-4 py-8 items-center">
        
        {/* Brand Narrative Column (Desktop Only) */}
        {!registered && (
          <div className="hidden md:flex flex-col justify-center space-y-8 pr-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold tracking-tight text-primary">Airacter</h1>
              <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                Join the premier platform for AI personas. Craft, interact, and evolve your digital companions in a professional playground designed for creators.
              </p>
            </div>
            
            {/* Features Row */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-panel border-0 ring-0 p-5 rounded-xl space-y-2 text-left bg-glass-bg/60">
                <CardContent className="p-0 space-y-2">
                  <Sparkles size={24} className="text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">Persona Flow</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Persistent prompts with rich contextual reasoning.</p>
                </CardContent>
              </Card>
              <Card className="glass-panel border-0 ring-0 p-5 rounded-xl space-y-2 text-left bg-glass-bg/60">
                <CardContent className="p-0 space-y-2">
                  <User size={24} className="text-secondary" />
                  <h3 className="font-semibold text-sm text-foreground">Character Hub</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Discover public personas or build private companions.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Form Column */}
        <div className={`flex items-center justify-center w-full ${registered ? 'md:col-span-2' : ''}`}>
          
          {!registered ? (
            /* Registration Card using shadcn Card */
            <Card className="glass-panel border-0 ring-0 py-8 px-6 md:p-10 rounded-[2rem] w-full max-w-md shadow-2xl theme-transition">
              <CardContent className="p-0 flex flex-col gap-5">
                <div className="mb-2 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Create Account</h2>
                  <p className="text-sm text-on-surface-variant">Enter your details to start your journey.</p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-sm flex items-start gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs font-semibold text-on-surface-variant ml-2 uppercase tracking-wider">
                      Full Name
                    </Label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors z-10">
                        <User size={16} />
                      </span>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-semibold text-on-surface-variant ml-2 uppercase tracking-wider">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors z-10">
                        <Mail size={16} />
                      </span>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-xs font-semibold text-on-surface-variant ml-2 uppercase tracking-wider">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold text-on-surface-variant ml-2 uppercase tracking-wider">
                        Confirm
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    variant="gradient"
                    className="h-12 w-full rounded-2xl font-semibold flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    <span>{loading ? "Creating Account..." : "Create Account"}</span>
                    {!loading && <ArrowRight size={16} />}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface px-4 text-on-surface-variant/70">Or continue with</span>
                  </div>
                </div>

                {/* Google Account signup */}
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  variant="outline"
                  className="h-12 w-full border border-outline-variant/30 rounded-xl flex items-center justify-center gap-3 bg-surface-container-highest/30 hover:bg-surface-container-highest/60 transition-all font-semibold text-sm text-foreground active:scale-98 disabled:opacity-50 cursor-pointer theme-transition"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Google Account</span>
                </Button>

                <p className="mt-6 text-center text-sm text-on-surface-variant">
                  Already have an account?
                  <Link href="/auth/login" className="text-primary font-semibold hover:text-primary/80 transition-colors ml-1">
                    Login
                  </Link>
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Success View */
            <Card className="glass-panel border-0 ring-0 p-8 md:p-12 rounded-[2rem] w-full max-w-md shadow-2xl text-center flex flex-col items-center space-y-6 theme-transition animate-in fade-in zoom-in duration-500">
              <CardContent className="p-0 flex flex-col items-center gap-5 w-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mb-2 text-white shadow-md shadow-primary/20">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Verify Email</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  We've sent a verification link to <span className="text-primary font-semibold block mt-1">{email}</span>.
                  Please check your inbox and click the link to activate your Airacter account.
                </p>
                
                <div className="w-full space-y-4 pt-4">
                  <Link
                    href="/auth/login"
                    className="w-full block py-3.5 rounded-xl font-semibold btn-gradient text-white active:scale-98 transition-all shadow-md shadow-primary/10 text-center"
                  >
                    Back to Login
                  </Link>
                  <div className="text-xs text-on-surface-variant flex justify-center gap-1">
                    <span>Need help?</span>
                    <Link href="#" className="text-secondary hover:underline font-medium">Contact Support</Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

      </div>
    </div>
  );
}
