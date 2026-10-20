"use client";

import * as React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { CoCurricularTranscript } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Award,
  CheckCircle2,
  CalendarDays,
  Compass,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Percent,
  QrCode,
  Code,
} from "lucide-react";
import QRCode from "qrcode";

export default function TranscriptPage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>(user?.id || "");
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>("");

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  React.useEffect(() => {
    if (user && !selectedStudentId) {
      setSelectedStudentId(user.id);
    }
  }, [user, selectedStudentId]);

  const students = storeState.students;
  const currentStudent = students.find((s) => s.id === selectedStudentId) || (user?.role === "student" ? user : students[0]);

  const transcriptData = currentStudent ? appStore.getStudentTranscriptData(currentStudent.id) : null;

  // Generate QR code for verification link
  React.useEffect(() => {
    if (!currentStudent) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const verificationUrl = `${origin}/verify/student/${currentStudent.student_id || currentStudent.id}`;
    QRCode.toDataURL(verificationUrl, { width: 140, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQrCodeDataUrl)
      .catch((err) => console.error("QR Error", err));
  }, [currentStudent]);

  if (!currentStudent || !transcriptData) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold">No Student Transcript Available</h2>
      </div>
    );
  }

  const isStaff = role === "admin" || role === "campus_manager" || role === "faculty_advisor";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gradient" className="gap-1 font-mono text-[10px]">
              <GraduationCap className="h-3 w-3" /> Official Academic Record
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">Mirai School of Technology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
            Co-Curricular Transcript
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-muted-foreground mt-1">
            Tamper-proof verifiable portfolio of club engagements, attendances, deliverables, and certificates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* JSON API Endpoint Button for Placement Readiness */}
          <a
            href={`/api/transcript/${currentStudent.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-cyan-500 hover:text-cyan-600 transition-colors shadow-sm"
          >
            <Code className="h-4 w-4" /> JSON API (Placement Ready)
          </a>

          {/* Download Official Signed PDF Transcript */}
          <a
            href={`/api/transcript/${currentStudent.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-glow"
          >
            <Download className="h-4 w-4" /> Download Official PDF
          </a>
        </div>
      </div>

      {/* Staff Student Selector */}
      {isStaff && (
        <Card className="p-4 bg-slate-50/50 dark:bg-navy-900/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-bold text-foreground">Staff Transcript Inspector:</span> Select any registered student to view and download their verified transcript.
            </div>
            <select
              value={currentStudent.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-2 font-medium"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.student_id}) - {s.campus_name}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Student Profile & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 md:col-span-2 flex items-center justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              {transcriptData.student_id}
            </Badge>
            <h2 className="text-xl font-bold font-heading text-foreground">
              {transcriptData.student_name}
            </h2>
            <div className="text-xs text-muted-foreground">
              {transcriptData.campus_name} • {transcriptData.email}
            </div>
            <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Cryptographically verified by MSOT Registrar
            </div>
          </div>

          {qrCodeDataUrl && (
            <div className="hidden sm:block text-center p-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeDataUrl} alt="Verify QR" className="w-20 h-20" />
              <div className="text-[8px] font-mono text-slate-500 mt-1 uppercase">Scan to Verify</div>
            </div>
          )}
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs text-muted-foreground font-medium">Club Day Attendance Rate</div>
          <div className="text-3xl font-extrabold font-heading text-cyan-600 dark:text-cyan-400 mt-2">
            {transcriptData.clubs.length > 0
              ? Math.round(transcriptData.clubs.reduce((acc, c) => acc + c.attendance_pct, 0) / transcriptData.clubs.length)
              : 0}
            %
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {transcriptData.summary.total_attendances} verified sessions attended
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs text-muted-foreground font-medium">Issued Credentials</div>
          <div className="text-3xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400 mt-2">
            {transcriptData.summary.total_certificates}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {transcriptData.summary.total_events} events • Avg Score: {transcriptData.summary.average_submission_score}/10
          </div>
        </Card>
      </div>

      {/* 4 Quadrants: Clubs, Attendance, Submissions, Certificates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quadrant 1: Clubs Enrolled */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Compass className="h-4 w-4 text-cyan-500" /> Clubs & Societies
            </CardTitle>
            <CardDescription className="text-xs">
              Official societies and approved student memberships.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {transcriptData.clubs.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No clubs joined.</div>
              ) : (
                transcriptData.clubs.map((c) => (
                  <div
                    key={c.club_id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-navy-850 bg-slate-50/50 dark:bg-navy-900/50"
                  >
                    <div>
                      <div className="font-semibold text-xs text-foreground">{c.club_name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {c.category} • {c.designation}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {c.attendance_pct}% Attended
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 2: Certificates & Honors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Certificates & Honors
            </CardTitle>
            <CardDescription className="text-xs">
              Cryptographically verified achievements and participation tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {transcriptData.certificates.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No certificates issued yet.
                </div>
              ) : (
                transcriptData.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-navy-850 bg-slate-50/50 dark:bg-navy-900/50 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-xs text-foreground">{cert.title}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{cert.id}</div>
                      </div>
                      <Badge
                        variant={cert.type === "winner" ? "gradient" : "outline"}
                        className="text-[9px] uppercase"
                      >
                        {cert.type}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-navy-850 text-[10px]">
                      <span className="text-muted-foreground">{cert.issue_date}</span>
                      <Link
                        href={`/verify/${cert.id}`}
                        target="_blank"
                        className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <ShieldCheck className="h-3 w-3" /> Verify
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 3: Project Deliverables & Evaluations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" /> Project Deliverables & Rubrics
            </CardTitle>
            <CardDescription className="text-xs">
              Evaluated submissions scored by faculty advisors and coordinators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {transcriptData.submissions.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No submissions recorded.
                </div>
              ) : (
                transcriptData.submissions.map((sub, idx) => (
                  <div
                    key={`${sub.activity_title}-${idx}`}
                    className="p-3 rounded-xl border border-slate-100 dark:border-navy-850 bg-slate-50/50 dark:bg-navy-900/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground truncate max-w-[200px]">
                        {sub.activity_title}
                      </span>
                      {sub.score !== null ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                          {sub.score} / 10
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Pending Grade
                        </Badge>
                      )}
                    </div>
                    {sub.feedback && (
                      <p className="text-[11px] text-muted-foreground italic">&quot;{sub.feedback}&quot;</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 4: Flagship Event Participations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" /> Flagship Competitions & Events
            </CardTitle>
            <CardDescription className="text-xs">
              Verified campus and inter-campus representation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {transcriptData.events.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No event participations recorded.
                </div>
              ) : (
                transcriptData.events.map((ev, idx) => (
                  <div
                    key={`${ev.event_name}-${idx}`}
                    className="p-3 rounded-xl border border-slate-100 dark:border-navy-850 bg-slate-50/50 dark:bg-navy-900/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-foreground">{ev.event_name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {ev.team_name ? `Team: ${ev.team_name}` : "Individual"} • {ev.role}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {ev.position || "Participant"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
