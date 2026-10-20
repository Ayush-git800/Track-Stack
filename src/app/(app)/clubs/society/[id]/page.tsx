"use client";

import * as React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClubLogo } from "@/components/ui/club-logo";
import {
  ArrowLeft,
  Layers,
  Code,
  Binary,
  BrainCircuit,
  Users,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function SocietyGroupPage() {
  const [storeState, setStoreState] = React.useState(appStore.getState());

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const kaizenParent = storeState.clubs.find((c) => c.code === "KAIZEN_SOCIETY");
  const subClubs = storeState.clubs.filter(
    (c) => c.parent_club_id === "a1000000-0000-0000-0000-000000000001"
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Link
          href="/clubs"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
        </Link>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-navy-900/90 p-8 gradient-border-top shadow-glass">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <ClubLogo
              name="Kaizen Society"
              logoUrl="/logos/kaizen-society.png"
              accentColor="#4FA39A"
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className="border-teal-500/40 text-teal-300 bg-teal-500/10">
                  Technical Club &bull; 3 Sub-Clubs
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  KAIZEN_SOCIETY &bull; Delhi-NCR
                </span>
              </div>
              <h1 className="text-3xl font-bold font-heading text-white">
                Kaizen Society & Sub-Clubs
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Kaizen Society is the flagship engineering club at Mirai School of Technology. Students participate in its 3 specialized sub-clubs: Dev Club (software engineering), CP Club (competitive algorithms), and KI (Kaizen Intelligence - AI).
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="rounded-xl border border-navy-800 bg-navy-950/80 px-4 py-2 text-right">
              <span className="text-[11px] text-muted-foreground uppercase font-mono block">Sub-Clubs Count</span>
              <span className="text-lg font-bold text-teal-300 font-heading">3 Active Chapters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Clubs Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-heading text-white">
              Affiliated Joinable Sub-Clubs
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select any club to view active membership status, activities, and enrolment
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {subClubs.map((sub) => {
            const enrolled = sub.enrolled_count || 0;
            return (
              <Card
                key={sub.id}
                className="overflow-hidden border-navy-800 bg-navy-900/80 hover:border-teal-500/40 transition-all group flex flex-col justify-between"
                gradientBorder
              >
                <CardContent className="p-5 flex-1">
                  <div className="flex items-start gap-3.5 mb-3.5">
                    <ClubLogo
                      name={sub.name}
                      logoUrl={sub.logo_url}
                      accentColor={sub.accent_color}
                      size="md"
                    />
                    <div>
                      <h3 className="font-heading text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                        {sub.name}
                      </h3>
                      <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                        {sub.code}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                    {sub.description}
                  </p>

                  <div className="space-y-1.5 rounded-xl border border-navy-800 bg-navy-950/60 p-2.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span>{sub.meeting_day} &bull; {sub.meeting_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{sub.meeting_venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span>{enrolled} / {sub.capacity} seats</span>
                    </div>
                  </div>
                </CardContent>

                <div className="p-5 pt-0 border-t border-navy-800/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Technical Chapter</span>
                  <Link href={`/clubs/${sub.id}`}>
                    <Button size="sm" variant="gradient" className="gap-1 text-xs">
                      Open Club Hub &rarr;
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
