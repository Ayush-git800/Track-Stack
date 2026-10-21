"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Lock, Building, Phone, BookOpen, Hash } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = React.useState({
    full_name: "",
    email: "",
    password: "",
    student_id: "",
    campus_id: "c1111111-1111-1111-1111-111111111111",
    year_of_study: 1,
    program: "B.Tech Computer Science",
    phone: "",
  });
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.student_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        student_id: formData.student_id,
        campus_id: formData.campus_id,
        year_of_study: Number(formData.year_of_study),
        program: formData.program,
        phone: formData.phone,
      });
      toast.success("Account created successfully! Welcome to Track Stack.");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to register. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-foreground relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-6 text-center relative z-10">
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
        <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1.5 font-mono">
          Student Registration & Co-Curricular Profile
        </p>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <Card className="glass-card gradient-border-top">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-2xl font-bold font-heading">
              Create Student Account
            </CardTitle>
            <CardDescription>
              Join MSOT clubs, check in to Club Days, and build your verified transcript
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name & Student ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. Chintu"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Student ID / Roll No *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="MSOT2026CS042"
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="pl-9 text-xs font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    University Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="alex.j@msot.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-9 text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Campus & Year of Study */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Campus *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                      value={formData.campus_id}
                      onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                      className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <option value="c1111111-1111-1111-1111-111111111111">Delhi-NCR (Primary)</option>
                      <option value="c2222222-2222-2222-2222-222222222222">Bangalore</option>
                      <option value="c3333333-3333-3333-3333-333333333333">Jaipur</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Year of Study *
                  </label>
                  <select
                    value={formData.year_of_study}
                    onChange={(e) => setFormData({ ...formData, year_of_study: Number(e.target.value) })}
                    className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value={1}>1st Year (Max 2 clubs)</option>
                    <option value={2}>2nd Year (Max 2 clubs)</option>
                  </select>
                </div>
              </div>

              {/* Program & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Academic Program
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="B.Tech Computer Science"
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-[11px] text-cyan-300/90 leading-relaxed">
                ℹ Enrolment Rule: Registered students are permitted to enrol in up to <strong>2 clubs</strong> simultaneously. Membership limit is enforced via database constraint.
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11 mt-1"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Complete Registration"}
              </Button>
            </form>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-400 font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
