"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { CampusEvent, EventRegistration, Certificate } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Trophy,
  Award,
  Medal,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Download,
  ExternalLink,
  Sparkles,
  Users,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

export default function EventResultsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user, role } = useAuth();

  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [firstPlaceUserId, setFirstPlaceUserId] = React.useState("");
  const [secondPlaceUserId, setSecondPlaceUserId] = React.useState("");
  const [thirdPlaceUserId, setThirdPlaceUserId] = React.useState("");
  const [signatoryName, setSignatoryName] = React.useState("Dr. Vikram Malhotra");
  const [signatoryTitle, setSignatoryTitle] = React.useState("Campus Director & Dean of Student Affairs");
  const [autoIssueParticipation, setAutoIssueParticipation] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const event = storeState.events.find((e) => e.id === eventId);
  const registrations = storeState.eventRegistrations.filter((r) => r.event_id === eventId);
  const certificates = storeState.certificates.filter((c) => c.event_id === eventId);

  const canManage = role === "admin" || role === "campus_manager" || role === "student_coordinator" || role === "faculty_advisor";

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold">Event Not Found</h2>
        <Link href="/events">
          <Button variant="secondary" className="mt-4">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const handleRecordResults = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("Unauthorized: Only coordinators, advisors, or managers can enter results.");
      return;
    }

    if (!firstPlaceUserId) {
      toast.error("Please select a 1st place winner.");
      return;
    }

    setIsSubmitting(true);
    try {
      const results: { userId: string; position?: "1st" | "2nd" | "3rd" | "finalist" | "participant"; score?: number }[] = [];

      results.push({ userId: firstPlaceUserId, position: "1st", score: 98 });
      if (secondPlaceUserId) results.push({ userId: secondPlaceUserId, position: "2nd", score: 92 });
      if (thirdPlaceUserId) results.push({ userId: thirdPlaceUserId, position: "3rd", score: 87 });

      // Auto issue participation to all checked-in attendees who are not on podium
      if (autoIssueParticipation) {
        registrations.forEach((r) => {
          if (
            r.checked_in &&
            r.user_id !== firstPlaceUserId &&
            r.user_id !== secondPlaceUserId &&
            r.user_id !== thirdPlaceUserId
          ) {
            results.push({ userId: r.user_id, position: "participant" });
          }
        });
      }

      const res = appStore.recordEventResults(event.id, results, user || undefined);
      if (res.success) {
        toast.success(`Results recorded! Successfully issued ${res.issuedCertificatesCount} cryptographically signed certificates.`);
      } else {
        toast.error("Failed to record results.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkIssueAllCheckedIn = () => {
    const checkedInRegs = registrations.filter((r) => r.checked_in);
    if (checkedInRegs.length === 0) {
      toast.error("No checked-in participants found for this event.");
      return;
    }

    const items = checkedInRegs.map((r) => ({
      user_id: r.user_id,
      user_name: r.user_name || "Student",
      student_id: r.student_id || "MSOT-TEMP",
      campus_name: r.campus_name || "Delhi-NCR Campus",
      type: "participation" as const,
      title: `Certificate of Participation - ${event.name}`,
      description: `Verified attendance and participation in ${event.name}.`,
      event_id: event.id,
      event_name: event.name,
      signatory_name: signatoryName,
      signatory_title: signatoryTitle,
    }));

    const issued = appStore.bulkIssueCertificates(items, user || undefined);
    toast.success(`Bulk issuance complete! Issued ${issued.length} participation certificates.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Event Overview
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gradient" className="gap-1 font-mono text-[10px]">
              <Trophy className="h-3 w-3" /> Results & Certification
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">{event.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
            {event.name} — Podium Entry
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-muted-foreground mt-1">
            Assign winning ranks and trigger cryptographic HMAC-SHA256 anti-tamper certificates.
          </p>
        </div>

        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkIssueAllCheckedIn}
            className="gap-1.5 border-cyan-500/30 text-cyan-700 dark:text-cyan-400"
          >
            <Award className="h-4 w-4" /> Bulk Issue Participation (All Checked In)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Podium Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Medal className="h-5 w-5 text-amber-500" /> Official Podium Placement
              </CardTitle>
              <CardDescription>
                Assigning 1st, 2nd, and 3rd place will instantly generate verified winner certificates with tamper-proof signatures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordResults} className="space-y-4">
                {/* 1st Place */}
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Trophy className="h-4 w-4" /> 1st Place Winner (Gold) *
                  </div>
                  <select
                    value={firstPlaceUserId}
                    onChange={(e) => setFirstPlaceUserId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-2.5 font-medium"
                    required
                  >
                    <option value="">-- Select Winner --</option>
                    {registrations.map((r) => (
                      <option key={r.id} value={r.user_id}>
                        {r.user_name} ({r.student_id}) {r.team_name ? `• Team: ${r.team_name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2nd Place */}
                <div className="p-3.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-100/50 dark:bg-navy-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Medal className="h-4 w-4 text-slate-400" /> 2nd Place Runner-Up (Silver)
                  </div>
                  <select
                    value={secondPlaceUserId}
                    onChange={(e) => setSecondPlaceUserId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-2.5 font-medium"
                  >
                    <option value="">-- Select Runner-Up (Optional) --</option>
                    {registrations
                      .filter((r) => r.user_id !== firstPlaceUserId)
                      .map((r) => (
                        <option key={r.id} value={r.user_id}>
                          {r.user_name} ({r.student_id}) {r.team_name ? `• Team: ${r.team_name}` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 3rd Place */}
                <div className="p-3.5 rounded-xl border border-amber-700/30 bg-amber-700/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-500">
                    <Medal className="h-4 w-4 text-amber-700" /> 3rd Place (Bronze)
                  </div>
                  <select
                    value={thirdPlaceUserId}
                    onChange={(e) => setThirdPlaceUserId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-2.5 font-medium"
                  >
                    <option value="">-- Select 3rd Place (Optional) --</option>
                    {registrations
                      .filter((r) => r.user_id !== firstPlaceUserId && r.user_id !== secondPlaceUserId)
                      .map((r) => (
                        <option key={r.id} value={r.user_id}>
                          {r.user_name} ({r.student_id}) {r.team_name ? `• Team: ${r.team_name}` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Certificate Signatory Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Signatory Name</label>
                    <Input
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Signatory Designation</label>
                    <Input
                      value={signatoryTitle}
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoIssue"
                    checked={autoIssueParticipation}
                    onChange={(e) => setAutoIssueParticipation(e.target.checked)}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <label htmlFor="autoIssue" className="text-xs text-foreground font-medium cursor-pointer">
                    Auto-issue verified participation certificates to all checked-in attendees
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-navy-850">
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={isSubmitting || !canManage}
                    className="gap-2 shadow-glow"
                  >
                    <Sparkles className="h-4 w-4" /> {isSubmitting ? "Generating Signatures..." : "Publish Results & Issue Certificates"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Issued Certificates Ledger */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Issued Certificates</span>
                <Badge variant="secondary" className="text-xs">
                  {certificates.length} Total
                </Badge>
              </CardTitle>
              <CardDescription>
                Cryptographically signed certificates issued for this event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {certificates.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No certificates issued yet. Submit results to generate.
                  </div>
                ) : (
                  certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-navy-850 bg-slate-50/50 dark:bg-navy-900/50 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-xs text-foreground">{cert.user_name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{cert.id}</div>
                        </div>
                        <Badge
                          variant={cert.type === "winner" ? "gradient" : "outline"}
                          className="text-[9px] uppercase"
                        >
                          {cert.type}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-muted-foreground line-clamp-1">{cert.title}</div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-navy-800 text-[11px]">
                        <Link
                          href={`/verify/${cert.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          <ShieldCheck className="h-3 w-3" /> Verify Publicly
                        </Link>
                        <a
                          href={`/api/certificates/${cert.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-foreground hover:text-cyan-500 font-medium"
                        >
                          <Download className="h-3 w-3" /> PDF
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
