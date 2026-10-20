"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Attendance, CheckinSession } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RotatingQR } from "@/components/checkin/rotating-qr";
import { toast } from "sonner";
import {
  ArrowLeft,
  Play,
  StopCircle,
  Users,
  Trophy,
  Mic,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Edit3,
  MapPin,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CoordinatorRunScreen() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());

  const activityId = params.id as string;
  const activity = appStore.getActivityById(activityId);

  // Active checkin session state
  const [activeSession, setActiveSession] = React.useState<CheckinSession | null>(null);
  const [showQRModal, setShowQRModal] = React.useState(false);
  const [geoEnabled, setGeoEnabled] = React.useState(false);

  // Correction Modal state
  const [correctingStudent, setCorrectingStudent] = React.useState<{
    studentId: string;
    studentName: string;
    currentStatus: Attendance["status"];
    attendanceId?: string;
  } | null>(null);
  const [targetStatus, setTargetStatus] = React.useState<Attendance["status"]>("present");
  const [correctionReason, setCorrectionReason] = React.useState("");

  // Presenter / Spot Award Modal
  const [awardingStudent, setAwardingStudent] = React.useState<{
    studentId: string;
    studentName: string;
    isPresenter: boolean;
    spotResult: Attendance["spot_result"];
    attendanceId?: string;
  } | null>(null);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  // Sync active session
  React.useEffect(() => {
    if (activity) {
      const sess = appStore.getActiveSession(activity.club_id, activity.club_day_id);
      setActiveSession(sess || null);
    }
  }, [activity, storeState.checkinSessions]);

  if (!activity) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Activity Not Found</h2>
        <Link href="/activities">
          <Button variant="outline" className="mt-4">
            Back to Activities
          </Button>
        </Link>
      </div>
    );
  }

  // Club members enrolled
  const clubMembers = appStore.getClubMembers(activity.club_id).filter((m) => m.status === "approved");
  const attendances = appStore.getAttendances({
    clubId: activity.club_id,
    clubDayId: activity.club_day_id,
  });

  const checkedInCount = attendances.filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceRate = clubMembers.length > 0 ? Math.round((checkedInCount / clubMembers.length) * 100) : 0;

  // Handlers
  const handleStartCheckin = () => {
    if (!user) return;
    const session = appStore.startCheckinSession(
      activity.club_id,
      activity.club_day_id,
      activity.id,
      30, // 30 minutes window
      geoEnabled,
      user
    );
    setActiveSession(session);
    setShowQRModal(true);
    toast.success("Check-in window is now LIVE! Rotating QR active.");
  };

  const handleCloseCheckin = () => {
    if (!activeSession || !user) return;
    appStore.closeCheckinSession(activeSession.id, user);
    setActiveSession(null);
    setShowQRModal(false);
    toast.info("Check-in session closed.");
  };

  const handleQuickStatusClick = (
    studentId: string,
    studentName: string,
    newStatus: Attendance["status"],
    existingAtt?: Attendance
  ) => {
    // If student is already marked with this status, no-op
    if (existingAtt && existingAtt.status === newStatus) return;

    // Direct toggle or prompt reason if changing from an existing verified status
    if (existingAtt && existingAtt.status !== newStatus) {
      setCorrectingStudent({
        studentId,
        studentName,
        currentStatus: existingAtt.status,
        attendanceId: existingAtt.id,
      });
      setTargetStatus(newStatus);
      setCorrectionReason("");
    } else {
      // First-time manual mark by coordinator requires note
      setCorrectingStudent({
        studentId,
        studentName,
        currentStatus: "absent",
        attendanceId: existingAtt?.id,
      });
      setTargetStatus(newStatus);
      setCorrectionReason("Manual coordinator check-in during Club Day session");
    }
  };

  const handleConfirmCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingStudent || !user) return;

    if (!correctionReason.trim()) {
      toast.error("A mandatory correction reason is required.");
      return;
    }

    const res = appStore.correctAttendance({
      attendanceId: correctingStudent.attendanceId,
      clubId: activity.club_id,
      clubDayId: activity.club_day_id,
      studentId: correctingStudent.studentId,
      newStatus: targetStatus,
      reason: correctionReason,
      correctedByUser: user,
    });

    if (res.success) {
      toast.success(res.message);
      setCorrectingStudent(null);
      setCorrectionReason("");
    } else {
      toast.error(res.message);
    }
  };

  const handleSaveAward = () => {
    if (!awardingStudent || !user) return;
    const res = appStore.correctAttendance({
      attendanceId: awardingStudent.attendanceId,
      clubId: activity.club_id,
      clubDayId: activity.club_day_id,
      studentId: awardingStudent.studentId,
      newStatus: "present",
      reason: `Awarded: ${awardingStudent.spotResult || "None"}, Presenter: ${awardingStudent.isPresenter}`,
      correctedByUser: user,
      isPresenter: awardingStudent.isPresenter,
      spotResult: awardingStudent.spotResult,
    });
    if (res.success) {
      toast.success(`Updated recognition for ${awardingStudent.studentName}`);
      setAwardingStudent(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-2xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/activities"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Activities
        </Link>
        <Badge variant="outline" className="font-mono text-[11px] uppercase border-cyan-500/40 text-cyan-300">
          Coordinator Run Deck
        </Badge>
      </div>

      {/* Activity Summary Card */}
      <div className="rounded-2xl border border-navy-800 bg-navy-900/90 p-5 gradient-border-top shadow-glass">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                {activity.club_name}
              </span>
              <span className="text-muted-foreground text-xs">&bull;</span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {formatDate(activity.club_day_date)}
              </span>
            </div>
            <h1 className="font-heading text-xl font-bold text-white leading-snug">
              {activity.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" /> {activity.venue}
              </span>
              <span>&bull;</span>
              <span className="capitalize">{activity.format}</span>
            </div>
          </div>

          <Badge
            variant={activeSession ? "danger" : "secondary"}
            className="text-[10px] uppercase font-mono py-1 px-2.5 shrink-0"
          >
            {activeSession ? "LIVE SESSION" : activity.status}
          </Badge>
        </div>
      </div>

      {/* BIG ONE-HANDED RUN CONTROLLER (Optimized for Phone in Hand) */}
      <div className="sticky top-20 z-30 space-y-3 rounded-2xl border border-cyan-500/30 bg-navy-900/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white">Live Attendance Count</span>
          </div>
          <span className="font-heading font-extrabold text-lg text-cyan-400 font-mono">
            {checkedInCount} / {clubMembers.length}{" "}
            <span className="text-xs text-muted-foreground font-normal">({attendanceRate}%)</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-navy-950 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
            style={{ width: `${attendanceRate}%` }}
          />
        </div>

        {/* Big Start / Fullscreen Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {activeSession ? (
            <>
              <Button
                variant="gradient"
                size="lg"
                onClick={() => setShowQRModal(true)}
                className="w-full h-13 text-sm font-bold gap-2 shadow-glow"
              >
                <QrCode className="h-5 w-5" /> View Rotating QR ({activeSession.current_otp})
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={handleCloseCheckin}
                className="w-full h-13 text-sm font-semibold gap-2"
              >
                <StopCircle className="h-5 w-5" /> Close Window Early
              </Button>
            </>
          ) : (
            <div className="col-span-full space-y-2">
              <Button
                variant="gradient"
                size="lg"
                onClick={handleStartCheckin}
                className="w-full h-14 text-base font-extrabold tracking-wide gap-2 shadow-glow active:scale-[0.98]"
              >
                <Play className="h-5 w-5 fill-current" /> START CHECK-IN SESSION
              </Button>

              <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={geoEnabled}
                  onChange={(e) => setGeoEnabled(e.target.checked)}
                  className="rounded border-navy-800 bg-navy-950"
                />
                <span>Enable 300m Campus Geofence check</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Roster & Attendance Toggles (One-Handed Taps) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-heading font-bold text-white text-base">
              Enrolled Roster & Spot Recognition
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Tap status to change with audit reason, mark presenters, or award winners
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {clubMembers.length} Enrolled
          </span>
        </div>

        <div className="space-y-2.5">
          {clubMembers.map((member) => {
            const att = attendances.find((a) => a.user_id === member.user_id);
            const status = att ? att.status : "absent";
            const isPresenter = att?.is_presenter;
            const spotResult = att?.spot_result;

            return (
              <div
                key={member.id}
                className={`rounded-2xl border p-3.5 transition-all duration-150 ${
                  status === "present"
                    ? "border-emerald-500/30 bg-navy-900/80"
                    : status === "late"
                    ? "border-amber-500/30 bg-navy-900/80"
                    : status === "excused"
                    ? "border-blue-500/30 bg-navy-900/80"
                    : "border-navy-800 bg-navy-950/60"
                }`}
              >
                {/* Student Info & Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {member.user_name}
                      </span>
                      {isPresenter && (
                        <Badge variant="outline" className="border-cyan-400 text-cyan-300 text-[9px] gap-1 py-0">
                          <Mic className="h-2.5 w-2.5" /> Presenter
                        </Badge>
                      )}
                      {spotResult && (
                        <Badge variant="outline" className="border-amber-400 text-amber-300 text-[9px] gap-1 py-0 capitalize">
                          <Trophy className="h-2.5 w-2.5" /> {spotResult.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {member.student_id || "ID-Pending"} &bull; Year {member.year_of_study || 1} &bull; {member.designation}
                    </div>
                  </div>

                  {/* Recognition button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setAwardingStudent({
                        studentId: member.user_id,
                        studentName: member.user_name || "Student",
                        isPresenter: Boolean(isPresenter),
                        spotResult: spotResult || null,
                        attendanceId: att?.id,
                      })
                    }
                    className="h-7 px-2 text-[10px] text-muted-foreground hover:text-white"
                  >
                    <Trophy className="h-3 w-3 mr-1" /> Award
                  </Button>
                </div>

                {/* Quick 1-Tap Status Toggles */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() =>
                      handleQuickStatusClick(member.user_id, member.user_name || "Student", "present", att)
                    }
                    className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                      status === "present"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                        : "bg-navy-950 text-muted-foreground border border-navy-800 hover:text-white"
                    }`}
                  >
                    Present
                  </button>

                  <button
                    onClick={() =>
                      handleQuickStatusClick(member.user_id, member.user_name || "Student", "late", att)
                    }
                    className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                      status === "late"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                        : "bg-navy-950 text-muted-foreground border border-navy-800 hover:text-white"
                    }`}
                  >
                    Late
                  </button>

                  <button
                    onClick={() =>
                      handleQuickStatusClick(member.user_id, member.user_name || "Student", "absent", att)
                    }
                    className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                      status === "absent"
                        ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm"
                        : "bg-navy-950 text-muted-foreground border border-navy-800 hover:text-white"
                    }`}
                  >
                    Absent
                  </button>

                  <button
                    onClick={() =>
                      handleQuickStatusClick(member.user_id, member.user_name || "Student", "excused", att)
                    }
                    className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                      status === "excused"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm"
                        : "bg-navy-950 text-muted-foreground border border-navy-800 hover:text-white"
                    }`}
                  >
                    Excused
                  </button>
                </div>

                {/* Audit notice if corrected */}
                {att?.correction_reason && (
                  <div className="mt-2 text-[10px] text-muted-foreground font-mono truncate">
                    Reason: {att.correction_reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FULLSCREEN ROTATING QR MODAL */}
      {showQRModal && activeSession && (
        <RotatingQR
          session={activeSession}
          onCloseSession={() => setShowQRModal(false)}
          isFullScreenDefault={true}
        />
      )}

      {/* ATTENDANCE CORRECTION MODAL (Mandatory Reason Requirement) */}
      {correctingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setCorrectingStudent(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                Audit-Logged Correction
              </Badge>
            </div>
            <h3 className="font-heading text-lg font-bold text-white">
              Adjust Attendance: {correctingStudent.studentName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">
              Change status to <strong className="text-white uppercase">{targetStatus}</strong>. A mandatory reason is required by policy.
            </p>

            <form onSubmit={handleConfirmCorrection} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Mandatory Reason for Adjustment *
                </label>
                <Textarea
                  placeholder="e.g. Verified technical glitch with phone camera, student was actively coding at table 4"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="min-h-[85px]"
                  required
                  autoFocus
                />
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-[11px] text-cyan-300">
                🛡 This change will be permanently logged with your coordinator ID, before/after status, and timestamp.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-navy-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCorrectingStudent(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient">
                  Confirm & Write to Audit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AWARD & RECOGNITION MODAL */}
      {awardingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setAwardingStudent(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1">
              Spot Recognition: {awardingStudent.studentName}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Mark session presentation or award on-the-spot contest results
            </p>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-navy-800 bg-navy-950/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={awardingStudent.isPresenter}
                  onChange={(e) =>
                    setAwardingStudent({ ...awardingStudent, isPresenter: e.target.checked })
                  }
                  className="rounded border-navy-800"
                />
                <div>
                  <div className="text-xs font-semibold text-white">Delivered Presentation / Demo</div>
                  <div className="text-[10px] text-muted-foreground">Credit applied towards rubric bonus</div>
                </div>
              </label>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  On-The-Spot Contest Result
                </label>
                <select
                  value={awardingStudent.spotResult || ""}
                  onChange={(e) =>
                    setAwardingStudent({
                      ...awardingStudent,
                      spotResult: (e.target.value as Attendance["spot_result"]) || null,
                    })
                  }
                  className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="">No Special Award (General Attendance)</option>
                  <option value="winner">Winner (1st Place)</option>
                  <option value="runner_up">Runner-Up (2nd Place)</option>
                  <option value="honourable_mention">Honourable Mention</option>
                  <option value="participant">Active Participant</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAwardingStudent(null)}
                >
                  Cancel
                </Button>
                <Button variant="gradient" onClick={handleSaveAward}>
                  Save Recognition
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
