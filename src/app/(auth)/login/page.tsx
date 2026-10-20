"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, UserCheck, GraduationCap, Award, User, Lock, Mail, Sparkles } from "lucide-react";
import { UserRole } from "@/lib/types";
import { LumiChatDrawer } from "@/components/lumi/lumi-chat-drawer";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole, isDemoMode } = useAuth();
  const [email, setEmail] = React.useState("admin@msot.edu");
  const [password, setPassword] = React.useState("••••••••");
  const [isOtpMode, setIsOtpMode] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showGoogleModal, setShowGoogleModal] = React.useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = React.useState<string | null>(null);
  const [customGoogleEmail, setCustomGoogleEmail] = React.useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success(`Signed in as ${email}`);
      router.push("/dashboard");
    } catch {
      toast.error("Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (targetRole: UserRole, targetEmail: string) => {
    switchRole(targetRole);
    toast.success(`Switched role to ${targetRole.replace("_", " ").toUpperCase()}`);
    router.push("/dashboard");
  };

  const handleGoogleAccountSelect = async (accountEmail: string, accountName: string) => {
    setGoogleAuthLoading(accountName);
    try {
      // Small simulated auth exchange delay for authentic Google OAuth feel
      await new Promise((r) => setTimeout(r, 650));
      await login(accountEmail);
      toast.success(`Google Workspace authenticated: Welcome, ${accountName}!`);
      setShowGoogleModal(false);
      router.push("/dashboard");
    } catch {
      toast.error("Google sign in encountered an issue.");
    } finally {
      setGoogleAuthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-foreground relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Lockup Banner */}
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="relative h-12 w-12 rounded-2xl bg-navy-950 p-2 border border-cyan-500/30 shadow-glow flex items-center justify-center group-hover:border-cyan-400 transition-colors">
            <Image
              src="/logos/track-stack-mark.png"
              alt="Track Stack"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <div className="text-left">
            <div className="font-heading text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              TRACK <span className="gradient-text">STACK</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-muted-foreground uppercase tracking-widest font-mono">
              MSOT Campus Activities OS
            </div>
          </div>
        </Link>
        <p className="text-xs text-slate-500 dark:text-muted-foreground mt-2 font-mono">
          Campus OS &bull; Mirai School of Technology
        </p>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="glass-card gradient-border-top">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold font-heading">
              {isOtpMode ? "Sign in with OTP" : "Sign in to Track Stack"}
            </CardTitle>
            <CardDescription>
              {isOtpMode
                ? "Enter your university email to receive a login code"
                : "Enter your credentials to access your dashboard"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-navy-800 bg-navy-900/60 hover:bg-navy-850 gap-2 cursor-pointer transition-all hover:border-cyan-500/40"
              onClick={() => setShowGoogleModal(true)}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z"
                />
              </svg>
              Sign in with Google Workspace
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-navy-800 w-full" />
              <span className="bg-navy-900 px-3 text-[11px] text-muted-foreground uppercase font-mono tracking-widest relative">
                Or with Email
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@msot.edu"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!isOtpMode && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => toast.info("Password reset link sent to registered email")}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11 mt-2"
                disabled={loading}
              >
                {loading ? "Signing in..." : isOtpMode ? "Send Verification Code" : "Sign In"}
              </Button>
            </form>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => setIsOtpMode(!isOtpMode)}
                className="text-cyan-400 hover:underline text-[11px]"
              >
                {isOtpMode ? "Switch to Password Sign In" : "Sign in via Email OTP"}
              </button>
              <Link href="/register" className="text-muted-foreground hover:text-white">
                Don't have an account? <span className="text-cyan-400 font-semibold">Register</span>
              </Link>
            </div>

            {/* Quick Demo Login Buttons (Phase 1 & 2 requirement) */}
            {isDemoMode && (
              <div className="mt-6 pt-4 border-t border-navy-800">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-cyan-400" />
                    Demo Role Quick-Login
                  </span>
                  <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                    Evaluation Mode
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("admin", "admin@msot.edu")}
                    className="flex items-center justify-between rounded-xl border border-navy-800 bg-navy-950/70 p-2 text-left text-xs hover:border-cyan-500/50 hover:bg-navy-900 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-400" />
                      <div>
                        <div className="font-semibold text-white">System Admin (Ayush Chauhan)</div>
                        <div className="text-[10px] text-muted-foreground">admin@msot.edu</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-cyan-400 group-hover:underline">Login &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("campus_manager", "manager.delhi@msot.edu")}
                    className="flex items-center justify-between rounded-xl border border-navy-800 bg-navy-950/70 p-2 text-left text-xs hover:border-blue-500/50 hover:bg-navy-900 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-400" />
                      <div>
                        <div className="font-semibold text-white">Campus Manager (Sundaram Mishra)</div>
                        <div className="text-[10px] text-muted-foreground">manager.delhi@msot.edu</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-400 group-hover:underline">Login &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("faculty_advisor", "advisor.kaizen@msot.edu")}
                    className="flex items-center justify-between rounded-xl border border-navy-800 bg-navy-950/70 p-2 text-left text-xs hover:border-purple-500/50 hover:bg-navy-900 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-400" />
                      <div>
                        <div className="font-semibold text-white">Faculty Advisor (Gaurav Kumar)</div>
                        <div className="text-[10px] text-muted-foreground">advisor.kaizen@msot.edu</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-purple-400 group-hover:underline">Login &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("student_coordinator", "coordinator.kaizen@msot.edu")}
                    className="flex items-center justify-between rounded-xl border border-navy-800 bg-navy-950/70 p-2 text-left text-xs hover:border-emerald-500/50 hover:bg-navy-900 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-white">Student Coordinator (Rishav Raj)</div>
                        <div className="text-[10px] text-muted-foreground">coordinator.kaizen@msot.edu</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 group-hover:underline">Login &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("student", "student.alex@msot.edu")}
                    className="flex items-center justify-between rounded-xl border border-navy-800 bg-navy-950/70 p-2 text-left text-xs hover:border-amber-500/50 hover:bg-navy-900 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-amber-400" />
                      <div>
                        <div className="font-semibold text-white">Student (Chintu)</div>
                        <div className="text-[10px] text-muted-foreground">Enrolled in 2 clubs</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 group-hover:underline">Login &rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google Workspace Account Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-2xl p-6 overflow-hidden">
            {googleAuthLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 dark:bg-navy-950/95 backdrop-blur-xs p-6 text-center animate-in fade-in">
                <div className="h-10 w-10 animate-spin rounded-full border-3 border-cyan-500 border-t-transparent mb-3" />
                <p className="font-semibold text-sm text-slate-900 dark:text-white">Connecting to Google Workspace...</p>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">Authenticating {googleAuthLoading}</p>
              </div>
            )}

            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center gap-2.5">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sign in with Google</h3>
                  <p className="text-[11px] text-slate-500 dark:text-muted-foreground">Mirai School of Technology (msot.edu)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 font-medium">Choose an institutional account:</p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {[
                  { name: "Ayush Chauhan", email: "admin@msot.edu", role: "System Admin", badge: "Admin", color: "text-cyan-400 border-cyan-500/30" },
                  { name: "Sundaram Mishra", email: "manager.delhi@msot.edu", role: "Campus Manager", badge: "Manager", color: "text-blue-400 border-blue-500/30" },
                  { name: "Gaurav Kumar", email: "advisor.kaizen@msot.edu", role: "Faculty Advisor", badge: "Faculty", color: "text-purple-400 border-purple-500/30" },
                  { name: "Rishav Raj", email: "coordinator.kaizen@msot.edu", role: "Student Coordinator", badge: "Coordinator", color: "text-emerald-400 border-emerald-500/30" },
                  { name: "Chintu", email: "student.alex@msot.edu", role: "Student (B.Tech CSE)", badge: "Student", color: "text-amber-400 border-amber-500/30" },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleGoogleAccountSelect(acc.email, acc.name)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/70 hover:border-cyan-500/50 hover:bg-cyan-50/50 dark:hover:bg-navy-850 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-700 flex items-center justify-center font-bold text-xs text-cyan-800 dark:text-cyan-300">
                        {acc.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-muted-foreground font-mono">
                          {acc.email}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border bg-white/50 dark:bg-navy-900/50 font-medium ${acc.color}`}>
                      {acc.badge}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customGoogleEmail.trim()) return;
                    handleGoogleAccountSelect(customGoogleEmail.trim(), customGoogleEmail.split("@")[0]);
                  }}
                  className="space-y-2"
                >
                  <label className="text-[11px] text-slate-500 dark:text-muted-foreground block">
                    Or sign in with another @msot.edu account:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      placeholder="your.name@msot.edu"
                      className="h-9 text-xs"
                    />
                    <Button type="submit" variant="gradient" size="sm" className="h-9 px-3 text-xs shrink-0">
                      Continue &rarr;
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lumi Pre-Login General Help Assistant */}
      <LumiChatDrawer isPreLogin={true} />
    </div>
  );
}
