"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { appStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClubLogo } from "@/components/ui/club-logo";
import {
  User,
  Mail,
  GraduationCap,
  Building,
  Phone,
  FileCheck2,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, role, switchRole } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const studentMemberships = user ? appStore.getStudentMemberships(user.id) : [];
  const maxClubs = user ? appStore.getStudentAllowedClubs(user) : 2;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Student Profile & Identity
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Official co-curricular profile, campus enrolment, and verified participation records.
        </p>
      </div>

      {/* Profile Header Card */}
      <Card className="glass-card gradient-border-top p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/30 border border-cyan-500/40 text-2xl font-bold text-cyan-300 shadow-glow">
            {user?.full_name?.charAt(0) || "U"}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                  {user?.full_name}
                </h2>
                <p className="text-xs font-mono text-cyan-400 mt-0.5">
                  {user?.student_id || "STAFF-ID"} &bull; {user?.email}
                </p>
              </div>

              <Badge variant="gradient" className="uppercase font-mono text-xs px-3 py-1 shrink-0">
                {role.replace("_", " ")}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-navy-800/80 pt-4 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-mono block">Campus</span>
                <span className="text-white font-medium">{user?.campus_name || "Delhi-NCR Campus"}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-mono block">Program</span>
                <span className="text-white font-medium">{user?.program || "General"}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-mono block">Year of Study</span>
                <span className="text-white font-medium">Year {user?.year_of_study || 1}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Enrolled Clubs Section */}
      <Card className="border-navy-800 bg-navy-900/80">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">Active Club Enrolments</CardTitle>
            <CardDescription className="text-xs">
              Maximum {maxClubs} clubs enforced per student policy
            </CardDescription>
          </div>
          <Badge variant={studentMemberships.length >= maxClubs ? "warning" : "success"}>
            {studentMemberships.length} of {maxClubs} Clubs Enrolled
          </Badge>
        </CardHeader>
        <CardContent>
          {studentMemberships.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No club enrolments active. Visit the clubs directory to join.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {studentMemberships.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-navy-800 bg-navy-950/60 p-4"
                >
                  <div className="flex items-start gap-3">
                    <ClubLogo
                      name={m.club_name || "Club"}
                      logoUrl={m.club_logo}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-white">{m.club_name}</h4>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {m.designation}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <Badge
                          variant={
                            m.status === "approved"
                              ? "success"
                              : m.status === "waitlisted"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[10px] capitalize"
                        >
                          {m.status} {m.waitlist_position ? `(Position #${m.waitlist_position})` : ""}
                        </Badge>
                        <Link
                          href={`/clubs/${m.club_id}`}
                          className="text-cyan-400 hover:underline"
                        >
                          Details &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verified Record Preview Box (Phase 4 stretch item teaser) */}
      <Card className="border-navy-800 bg-navy-900/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                Official Co-Curricular Transcript
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
                Your verified record of club participation, Club Day check-ins, deliverables, and faculty ratings backed by an immutable HMAC cryptographic signature.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Full cryptographic PDF transcript generation and public HMAC verification active in Phase 4.")}
            className="shrink-0 border-navy-800"
          >
            Download Transcript Preview
          </Button>
        </div>
      </Card>
    </div>
  );
}
