"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClubLogo } from "@/components/ui/club-logo";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ShieldCheck,
  QrCode,
  FileCheck2,
  Users2,
  CalendarCheck,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function LandingPage() {
  const router = useRouter();
  const [certId, setCertId] = React.useState("");

  const handleVerifyCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) {
      toast.error("Please enter a Certificate ID");
      return;
    }
    router.push(`/verify/${certId.trim()}`);
  };

  const societies = [
    {
      name: "Kaizen Society",
      tagline: "Premier Technical & Engineering Society",
      description: "Host to Kaizen Dev Club, CP Club, and Kaizen Intelligence (KI). Driving open-source software, algorithms, and deep learning.",
      logo: "/logos/kaizen-society.png",
      accent: "#4FA39A",
      subClubs: ["Kaizen Dev Club", "CP Club", "Kaizen Intelligence"],
      code: "KAIZEN_SOCIETY",
    },
    {
      name: "NexCell",
      tagline: "Entrepreneurship & Innovation Cell",
      description: "Startup incubators, venture simulations, pitch days, and mentorship for student founders shaping modern industry.",
      logo: "/logos/nexcell.png",
      accent: "#3B9BE0",
      subClubs: ["Startup Sandbox", "Venture Pitch"],
      code: "NEXCELL",
    },
    {
      name: "Malhar",
      tagline: "The Cultural Society of Mirai",
      description: "Celebrating performing arts, dramatic productions, acoustic music jams, literary debates, and visual art installations.",
      logo: "/logos/malhar.png",
      accent: "#E8A935",
      subClubs: ["Performing Arts", "Music & Acoustics"],
      code: "MALHAR",
    },
    {
      name: "Khel Society",
      tagline: "Sports & Athletics Club",
      description: "Inter-college championships, fitness tournaments, football, athletics, and collegiate competitive sports leagues.",
      logo: "/logos/khel-society.png",
      accent: "#1E6FC0",
      subClubs: ["Football League", "Athletics & Fitness"],
      code: "KHEL",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-foreground selection:bg-cyan-500/30 selection:text-cyan-700 dark:selection:text-cyan-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-navy-800 bg-white/90 dark:bg-navy-950/80 backdrop-blur-xl shadow-xs dark:shadow-none">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-navy-950 border border-cyan-500/30 p-1.5 shadow-sm">
              <Image
                src="/logos/track-stack-mark.png"
                alt="Track Stack Logo"
                width={30}
                height={30}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                TRACK <span className="gradient-text">STACK</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-muted-foreground uppercase tracking-widest font-mono">
                Mirai School of Technology
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="gradient" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs text-cyan-700 dark:text-cyan-300 mb-8 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>MSOT Official Club Activities Management Platform</span>
          </div>

          {/* Glowing Lockup / Title */}
          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight md:leading-none">
            Verified co-curricular records for{" "}
            <span className="gradient-text">every student.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Run university Club Days effortlessly. Rotating-QR check-ins, automated submission deadlines, rubric-based faculty evaluations, and cryptographic co-curricular transcripts.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="gradient" size="lg" className="gap-2 shadow-glow">
                Launch Platform <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/clubs">
              <Button variant="secondary" size="lg" className="gap-2">
                Explore Societies & Clubs
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 p-4 shadow-sm dark:shadow-none backdrop-blur-sm">
              <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white">4 Societies</div>
              <div className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">6 Joinable Clubs</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 p-4 shadow-sm dark:shadow-none backdrop-blur-sm">
              <div className="text-2xl font-bold font-heading text-cyan-700 dark:text-cyan-400">100% Verified</div>
              <div className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">Every Check-in & Submission</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 p-4 shadow-sm dark:shadow-none backdrop-blur-sm">
              <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white">2 Clubs Limit</div>
              <div className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">Enforced via DB Trigger</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 p-4 shadow-sm dark:shadow-none backdrop-blur-sm">
              <div className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400">HMAC Signed</div>
              <div className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">Publicly Verifiable PDF</div>
            </div>
          </div>
        </div>
      </section>

      {/* Delhi-NCR Societies Section */}
      <section className="py-16 border-t border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-900/40 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3">
              Campus Societies
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Delhi-NCR Collegiate Societies
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-muted-foreground">
              MSOT Delhi-NCR features 4 primary societies encompassing 6 joinable units modeled hierarchically with custom capacities and meeting schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {societies.map((soc) => (
              <Card
                key={soc.code}
                className="overflow-hidden border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/80 hover:border-slate-300 dark:hover:border-navy-700 shadow-sm dark:shadow-none transition-all duration-200 group"
                gradientBorder
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <ClubLogo
                      name={soc.name}
                      logoUrl={soc.logo}
                      accentColor={soc.accent}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {soc.name}
                        </h3>
                        <Badge
                          variant="outline"
                          style={{ borderColor: `${soc.accent}55`, color: soc.accent }}
                        >
                          {soc.code === "KAIZEN_SOCIETY" ? "Parent Society" : "Society"}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-cyan-800 dark:text-cyan-300/90 mt-0.5">
                        {soc.tagline}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-muted-foreground mt-2.5 leading-relaxed">
                        {soc.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {soc.subClubs.map((sub) => (
                          <span
                            key={sub}
                            className="rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/60 px-2 py-0.5 text-[11px] text-slate-600 dark:text-muted-foreground font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/clubs">
              <Button variant="outline">
                View All Joinable Clubs & Enrolment Openings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Public "Verify a Certificate" Section */}
      <section className="py-16 border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Card className="glass-card gradient-border-top p-8 sm:p-10 text-center shadow-md dark:shadow-none">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 mb-4 shadow-sm dark:shadow-glass">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Public Certificate & Transcript Verification
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground max-w-lg mx-auto">
              Every certificate and transcript generated on Track Stack is signed with an immutable cryptographic HMAC signature. Anyone can verify authenticity instantly.
            </p>

            <form onSubmit={handleVerifyCert} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
                <input
                  type="text"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  placeholder="Enter Certificate ID (e.g. MSOT-CERT-2026-0842)"
                  className="w-full h-11 rounded-xl border border-slate-300 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/80 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
                />
              </div>
              <Button type="submit" variant="gradient" className="h-11 px-6">
                Verify
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-600 dark:text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Instant Public Lookup
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" /> Tamper-Proof Cryptography
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 py-8 text-center text-xs text-slate-600 dark:text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 shrink-0 flex items-center justify-center rounded-lg bg-navy-950 border border-cyan-500/30 p-0.5 shadow-xs">
              <Image
                src="/logos/track-stack-mark.png"
                alt="Track Stack"
                width={18}
                height={18}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">Track Stack</span>
            <span>— Mirai School of Technology (MSOT)</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="text-cyan-700 dark:text-cyan-400 font-medium">Built with AI assistance. Project by Ayush Chauhan</span>
            <span className="hidden sm:inline text-slate-300 dark:text-navy-700">&bull;</span>
            <div>Delhi-NCR Campus</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
