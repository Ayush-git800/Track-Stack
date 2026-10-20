"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { CampusEvent, EventRegistration, EventTeam } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CalendarDays,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserPlus,
  QrCode,
  Award,
  AlertCircle,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import QRCode from "qrcode";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user, role } = useAuth();

  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [activeTab, setActiveTab] = React.useState<"overview" | "roster" | "teams">("overview");

  // Registration modal state
  const [showRegModal, setShowRegModal] = React.useState(false);
  const [regMode, setRegMode] = React.useState<"individual" | "team_create" | "team_join">("individual");
  const [teamName, setTeamName] = React.useState("");
  const [invitedMembers, setInvitedMembers] = React.useState("");
  const [selectedTeamId, setSelectedTeamId] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Rotating QR Check-In Modal state for organizers/coordinators
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState("");
  const [oneTimeCode, setOneTimeCode] = React.useState("842109");
  const [secondsRemaining, setSecondsRemaining] = React.useState(25);

  // Student manual check-in code input
  const [studentInputCode, setStudentInputCode] = React.useState("");

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const event = storeState.events.find((e) => e.id === eventId);
  const registrations = storeState.eventRegistrations.filter((r) => r.event_id === eventId);
  const teams = appStore.getEventTeams(eventId);

  const myRegistration = user
    ? registrations.find((r) => r.user_id === user.id && r.status !== "cancelled" && r.status !== "declined")
    : null;

  const myDutyLeave = user
    ? storeState.dutyLeaves.find((dl) => dl.event_id === eventId && dl.user_id === user.id)
    : null;

  const canManage = role === "admin" || role === "campus_manager" || role === "student_coordinator" || role === "faculty_advisor";

  // Rotating QR code effect when modal is active
  React.useEffect(() => {
    if (!showQrModal || !event) return;

    const generateNewToken = async () => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setOneTimeCode(code);
      setSecondsRemaining(25);

      const payload = JSON.stringify({
        eventId: event.id,
        code,
        timestamp: Date.now(),
        type: "EVENT_CHECKIN",
      });

      try {
        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("QR gen error:", err);
      }
    };

    generateNewToken();

    const countdown = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          generateNewToken();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [showQrModal, event]);

  if (!event) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Event Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested event could not be found or has been removed.</p>
        <Link href="/events">
          <Button variant="secondary">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to register.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (regMode === "team_create") {
        if (!teamName.trim()) {
          toast.error("Please enter a team name.");
          setIsSubmitting(false);
          return;
        }
        const invites = invitedMembers
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const res = appStore.createTeam(event.id, teamName.trim(), user.id, invites);
        if (res.success) {
          toast.success(res.message);
          setShowRegModal(false);
          setTeamName("");
          setInvitedMembers("");
        } else {
          toast.error(res.message);
        }
      } else if (regMode === "team_join") {
        if (!selectedTeamId) {
          toast.error("Please select a team to join.");
          setIsSubmitting(false);
          return;
        }
        const res = appStore.registerForEvent(event.id, user.id, "team", selectedTeamId, "member");
        if (res.success) {
          toast.success(res.message);
          setShowRegModal(false);
        } else {
          toast.error(res.message);
        }
      } else {
        const res = appStore.registerForEvent(event.id, user.id, "individual");
        if (res.success) {
          toast.success(res.message);
          setShowRegModal(false);
        } else {
          toast.error(res.message);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentManualCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!studentInputCode.trim()) {
      toast.error("Please enter the 6-digit session check-in code.");
      return;
    }

    const res = appStore.checkinEventParticipant(event.id, user.id, "code");
    if (res.success) {
      toast.success(res.message);
      setStudentInputCode("");
    } else {
      toast.error(res.message);
    }
  };

  const handleCoordinatorQuickCheckin = (targetUserId: string) => {
    const res = appStore.checkinEventParticipant(event.id, targetUserId, "code");
    if (res.success) {
      toast.success("Participant check-in confirmed!");
    } else {
      toast.error(res.message);
    }
  };

  const confirmedRegistrations = registrations.filter((r) => r.status === "confirmed");
  const waitlistedRegistrations = registrations.filter((r) => r.status === "waitlisted");
  const checkedInCount = registrations.filter((r) => r.checked_in).length;
  const capacityPercent = Math.min(100, Math.round((confirmedRegistrations.length / event.capacity) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Events Directory
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQrModal(true)}
              className="gap-1.5 border-cyan-500/30 text-cyan-700 dark:text-cyan-400"
            >
              <QrCode className="h-4 w-4" /> Live Check-In QR
            </Button>
            <Link href={`/events/${event.id}/results`}>
              <Button variant="gradient" size="sm" className="gap-1.5">
                <Trophy className="h-4 w-4" /> Enter Results & Issue Certificates
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                {event.code}
              </Badge>
              {event.is_inter_campus ? (
                <Badge variant="gradient" className="gap-1">
                  <Sparkles className="h-3 w-3" /> Inter-Campus Flagship
                </Badge>
              ) : (
                <Badge variant="secondary">Campus Exclusive</Badge>
              )}
              <Badge
                className={
                  event.status === "completed"
                    ? "bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300"
                    : event.status === "live"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                }
              >
                {event.status.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {event.mode === "team" ? `Team (${event.min_team_size}-${event.max_team_size} members)` : "Individual"}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
              {event.name}
            </h1>

            <p className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed">
              {event.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-navy-850">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-foreground">{formatDate(event.start_date)}</div>
                  <div className="text-[11px]">Event Date</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-foreground truncate max-w-[140px]">{event.venue}</div>
                  <div className="text-[11px]">{event.campus_name || "Delhi-NCR"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-foreground">
                    {confirmedRegistrations.length} / {event.capacity}
                  </div>
                  <div className="text-[11px]">Seats Filled ({capacityPercent}%)</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-foreground">{formatDate(event.registration_end)}</div>
                  <div className="text-[11px]">Deadline</div>
                </div>
              </div>
            </div>
          </div>

          {/* User Registration Status / Action card */}
          <div className="w-full lg:w-80 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-900/60 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Registration Status
            </h3>

            {myRegistration ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={myRegistration.status === "confirmed" ? "default" : "secondary"}
                    className={
                      myRegistration.status === "confirmed"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : ""
                    }
                  >
                    {myRegistration.status.toUpperCase()}
                  </Badge>
                </div>

                {myRegistration.team_name && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Team</span>
                    <span className="font-semibold text-foreground">{myRegistration.team_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Attendance</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      myRegistration.checked_in
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {myRegistration.checked_in ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Checked In
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5" /> Not Checked In
                      </>
                    )}
                  </span>
                </div>

                {/* Duty Leave Quick Link if Inter-Campus */}
                {event.is_inter_campus && (
                  <div className="pt-2 border-t border-slate-200 dark:border-navy-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Duty Leave Request</span>
                      <Badge
                        variant="outline"
                        className={
                          myDutyLeave?.status === "approved"
                            ? "text-emerald-600 border-emerald-500/30"
                            : "text-amber-600 border-amber-500/30"
                        }
                      >
                        {myDutyLeave?.status || "Pending"}
                      </Badge>
                    </div>
                    {myDutyLeave?.status === "approved" && (
                      <a
                        href={`/api/duty-leave/${myDutyLeave.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline mt-1 font-medium"
                      >
                        <Download className="h-3 w-3" /> Download Approved Leave Letter
                      </a>
                    )}
                  </div>
                )}

                {/* Self Check-In Form for Student if not yet checked in */}
                {!myRegistration.checked_in && (
                  <form onSubmit={handleStudentManualCheckin} className="pt-2 border-t border-slate-200 dark:border-navy-800 space-y-2">
                    <label className="text-xs font-semibold text-foreground block">
                      Fast Event Check-In
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="6-digit code"
                        maxLength={6}
                        value={studentInputCode}
                        onChange={(e) => setStudentInputCode(e.target.value)}
                        className="text-xs font-mono uppercase text-center"
                      />
                      <Button type="submit" size="sm" variant="gradient">
                        Submit
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  You are not yet registered for this event. Register now to reserve your seat or team slot.
                </p>
                <Button
                  onClick={() => setShowRegModal(true)}
                  variant="gradient"
                  className="w-full gap-2 shadow-glow"
                >
                  <UserPlus className="h-4 w-4" /> Register Now
                </Button>
                {event.is_inter_campus && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 italic">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                    Duty Leave request will be automatically filed for you.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-navy-800 gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Event Overview & Rules
        </button>
        <button
          onClick={() => setActiveTab("roster")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "roster"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Participant Roster</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {registrations.length}
          </Badge>
        </button>
        {event.mode === "team" && (
          <button
            onClick={() => setActiveTab("teams")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "teams"
                ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Teams</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {teams.length}
            </Badge>
          </button>
        )}
      </div>

      {/* Tab 1: Overview & Rules */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rules & Competition Guidelines</CardTitle>
                <CardDescription>Strictly enforced integrity rules and deliverables for all participants.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-navy-850">
                  <p className="font-mono text-xs whitespace-pre-line leading-relaxed">
                    {event.rules ||
                      "1. All teams must register through Track Stack before the registration deadline.\n2. Genuine attendance at venue check-in is mandatory for certificate issuance.\n3. Anti-tamper verification will be conducted on all submissions.\n4. Zero tolerance for plagiarism or academic misconduct."}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                    Certificates & Recognition
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    1st, 2nd, and 3rd place winners will receive official Winner Certificates cryptographically signed with HMAC-SHA256 and verified through the public registry. All active participants with confirmed check-in will receive verified participation credentials.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule of Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-4 p-3 rounded-lg border border-slate-100 dark:border-navy-850">
                    <div className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0 w-24">
                      09:00 AM
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Registration & Live Rotating QR Check-In</div>
                      <div className="text-[11px] text-muted-foreground">Main Auditorium Lobby</div>
                    </div>
                  </div>
                  <div className="flex gap-4 p-3 rounded-lg border border-slate-100 dark:border-navy-850">
                    <div className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0 w-24">
                      10:30 AM
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Keynote & Problem Statement Release</div>
                      <div className="text-[11px] text-muted-foreground">Central Arena</div>
                    </div>
                  </div>
                  <div className="flex gap-4 p-3 rounded-lg border border-slate-100 dark:border-navy-850">
                    <div className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0 w-24">
                      03:30 PM
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Final Demonstrations & Judging</div>
                      <div className="text-[11px] text-muted-foreground">Innovation Labs 1-4</div>
                    </div>
                  </div>
                  <div className="flex gap-4 p-3 rounded-lg border border-slate-100 dark:border-navy-850">
                    <div className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0 w-24">
                      05:30 PM
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Podium Ceremony & Bulk Certificate Issuance</div>
                      <div className="text-[11px] text-muted-foreground">Main Stage</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-850">
                  <span className="text-muted-foreground">Campus</span>
                  <span className="font-semibold text-foreground">{event.campus_name || "All Campuses"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-850">
                  <span className="text-muted-foreground">Registration Type</span>
                  <span className="font-semibold text-foreground capitalize">{event.mode}</span>
                </div>
                {event.mode === "team" && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-850">
                    <span className="text-muted-foreground">Team Size Limit</span>
                    <span className="font-semibold text-foreground">
                      {event.min_team_size} to {event.max_team_size} Members
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-850">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-semibold text-foreground">{event.capacity} Slots</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-850">
                  <span className="text-muted-foreground">Checked-In Count</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{checkedInCount} Present</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Waitlisted</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {waitlistedRegistrations.length} Students
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Participant Roster */}
      {activeTab === "roster" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Registered Participants</CardTitle>
              <CardDescription>
                Live participant roster with attendance confirmation status.
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {checkedInCount} / {registrations.length} Checked In
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-800 text-muted-foreground">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Campus</th>
                    <th className="pb-3 font-semibold">Team / Role</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Attendance</th>
                    {canManage && <th className="pb-3 font-semibold text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No students registered yet.
                      </td>
                    </tr>
                  ) : (
                    registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-900/50">
                        <td className="py-3">
                          <div className="font-semibold text-foreground">{reg.user_name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{reg.student_id}</div>
                        </td>
                        <td className="py-3 text-muted-foreground">{reg.campus_name}</td>
                        <td className="py-3">
                          {reg.team_name ? (
                            <div>
                              <span className="font-medium text-foreground">{reg.team_name}</span>
                              <Badge variant="outline" className="ml-1.5 text-[9px] capitalize">
                                {reg.role}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Individual</span>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={reg.status === "confirmed" ? "default" : "secondary"}
                            className="text-[10px] capitalize"
                          >
                            {reg.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {reg.checked_in ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 text-[10px]">
                              <CheckCircle2 className="h-3 w-3" /> Checked In
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground italic">Not Present</span>
                          )}
                        </td>
                        {canManage && (
                          <td className="py-3 text-right">
                            {!reg.checked_in ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-cyan-500/30 text-cyan-600 hover:bg-cyan-50"
                                onClick={() => handleCoordinatorQuickCheckin(reg.user_id)}
                              >
                                Mark Present
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Verified</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Teams (if team mode) */}
      {activeTab === "teams" && event.mode === "team" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No teams created yet.
            </div>
          ) : (
            teams.map((t) => (
              <Card key={t.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">{t.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {t.members_count || t.members?.length || 1} Members
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Leader: <span className="font-semibold text-foreground">{t.leader_name}</span> ({t.leader_student_id})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Roster
                  </div>
                  <div className="space-y-1">
                    {t.members?.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 dark:bg-navy-900"
                      >
                        <span className="font-medium text-foreground">{m.user_name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase">{m.role}</span>
                          {m.checked_in && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROTATING QR CHECK-IN MODAL FOR ORGANIZERS                                */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-850 pb-3">
              <div className="text-left">
                <h3 className="font-bold text-foreground text-sm">Live Check-In Portal</h3>
                <p className="text-xs text-muted-foreground">{event.name}</p>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-inner">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Live Rotating QR" className="w-56 h-56 object-contain" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-muted-foreground">
                  Generating secure HMAC QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Rotating 6-Digit Code:</div>
              <div className="font-mono text-3xl font-extrabold tracking-widest text-cyan-600 dark:text-cyan-400">
                {oneTimeCode}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> Rotates in{" "}
                <span className="font-mono font-bold text-foreground">{secondsRemaining}s</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-navy-850 flex items-center justify-around text-xs">
              <div>
                <span className="text-muted-foreground">Live Present: </span>
                <span className="font-bold text-emerald-600">{checkedInCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Enrolled: </span>
                <span className="font-bold">{registrations.length}</span>
              </div>
            </div>

            <Button
              onClick={() => setShowQrModal(false)}
              variant="secondary"
              className="w-full text-xs"
            >
              Close Check-In Display
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REGISTRATION MODAL                                                        */}
      {/* ========================================================================= */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-850 pb-3">
              <div>
                <h3 className="font-bold text-foreground text-sm">Register for {event.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {event.is_inter_campus ? "Inter-campus event (Duty Leave auto-filed)" : "Campus event"}
                </p>
              </div>
              <button
                onClick={() => setShowRegModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {event.mode === "team" ? (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-foreground">Select Registration Option:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegMode("team_create")}
                      className={`p-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                        regMode === "team_create"
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                          : "border-slate-200 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-900"
                      }`}
                    >
                      <div className="font-bold">Create New Team</div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        You become Team Leader
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegMode("team_join")}
                      className={`p-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                        regMode === "team_join"
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                          : "border-slate-200 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-900"
                      }`}
                    >
                      <div className="font-bold">Join Existing Team</div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        Select an existing squad
                      </div>
                    </button>
                  </div>

                  {regMode === "team_create" && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Team Name *</label>
                        <Input
                          placeholder="e.g. Delhi Strikers"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          Invite Members (Student IDs or Emails, comma-separated)
                        </label>
                        <Input
                          placeholder="e.g. 2024-CS-002, priya.sharma@mirai.edu"
                          value={invitedMembers}
                          onChange={(e) => setInvitedMembers(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Min team size: {event.min_team_size}, Max: {event.max_team_size}.
                        </p>
                      </div>
                    </div>
                  )}

                  {regMode === "team_join" && (
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-medium text-foreground">Choose Team *</label>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-2.5"
                        required
                      >
                        <option value="">-- Select a Team --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (Leader: {t.leader_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-900 text-xs space-y-1 text-slate-600 dark:text-muted-foreground">
                  <p>
                    You are registering individually as{" "}
                    <strong className="text-foreground">{user?.full_name}</strong> ({user?.student_id || user?.email}).
                  </p>
                  <p>Upon registration, your slot will be confirmed immediately (or placed on waitlist if full).</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-navy-850">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Confirm Registration"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
