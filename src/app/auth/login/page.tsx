"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle, Loader } from "lucide-react";
import { useThemeStore } from "@/hooks/use-theme-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useThemeStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Show verified success message if redirected from verify page
    if (searchParams.get("verified") === "true") {
      setSuccessMsg("Email verified successfully! You can now log in.");
    }
    // Show error if redirected from next-auth error callbacks
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(
        oauthError === "OAuthSignin" || oauthError === "OAuthCallback"
          ? "Failed to sign in with Google. Please try again."
          : "An authentication error occurred."
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password.");
        } else {
          setError(result.error);
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <main className="w-full max-w-[420px] z-10 py-8">
      {/* Brand identity */}
      <div className="flex flex-col items-center mb-8 space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
          <Sparkles size={24} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Airacter</h1>
        <p className="text-sm text-on-surface-variant">Step into your digital imagination</p>
      </div>

      {/* Login Form Card using shadcn Card */}
      <Card className="glass-panel border-0 ring-0 py-8 px-6 rounded-[2rem] shadow-2xl theme-transition">
        <CardContent className="p-0 flex flex-col gap-5">
          {/* Notifications */}
          {error && (
            <div className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm flex items-start gap-2">
              <Sparkles size={18} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
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
                  className="h-12 w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-2">
                <Label htmlFor="password" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Password
                </Label>
                <Link href="#" className="text-xs font-semibold text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 group-focus-within:text-primary transition-colors z-10">
                  <Lock size={16} />
                </span>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground placeholder:text-on-surface-variant/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all theme-transition"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button using shadcn Button */}
            <Button
              type="submit"
              disabled={loading}
              variant="gradient"
              className="h-12 w-full rounded-2xl font-semibold flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              <span>{loading ? "Logging in..." : "Login"}</span>
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

          {/* Google Login Button using shadcn Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="h-12 w-full border border-outline-variant/30 rounded-2xl flex items-center justify-center gap-3 bg-surface-container-highest/30 hover:bg-surface-container-highest/60 transition-all font-semibold text-sm text-foreground active:scale-98 disabled:opacity-50 cursor-pointer theme-transition"
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
        </CardContent>
      </Card>

      {/* Footer Link */}
      <p className="text-center mt-6 text-sm text-on-surface-variant">
        Don't have an account?
        <Link href="/auth/register" className="text-primary font-semibold hover:text-primary/80 transition-colors ml-1">
          Register for free
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDelay: "2s" }} />

      <Suspense fallback={
        <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md shadow-2xl text-center flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary animate-spin">
            <Loader size={32} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Loading</h2>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
