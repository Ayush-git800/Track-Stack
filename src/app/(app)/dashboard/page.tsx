"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { appStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClubLogo } from "@/components/ui/club-logo";
import { toast } from "sonner";
import {
  Compass,
  CalendarDays,
  Sparkles,
  Users,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Download,
  FileText,
  Pin,
  Megaphone,
  Filter,
  BarChart3,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Layers,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { downloadCsv, generateTabularReportPdf } from "@/lib/export";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());

  // Global Filters for Admin & Manager
  const [selectedCampusId, setSelectedCampusId] = React.useState<string>(
    role === "campus_manager" ? "c1111111-1111-1111-1111-111111111111" : "all"
  );
  const [selectedClubId, setSelectedClubId] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<string>("all");

  // Announcement Modal State (for Coordinator / Advisor)
  const [showAnnounceModal, setShowAnnounceModal] = React.useState(false);
  const [announceTitle, setAnnounceTitle] = React.useState("");
  const [announceContent, setAnnounceContent] = React.useState("");
  const [announcePinned, setAnnouncePinned] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const campuses = storeState.campuses;
  const clubs = storeState.clubs;
  const clubDays = storeState.clubDays;
  const activities = storeState.activities;
  const nextClubDay = clubDays.find((d) => d.status === "active" || d.status === "announced") || clubDays[0];

  // Scoped Data
  const studentMemberships = user ? appStore.getStudentMemberships(user.id) : [];
  const myClubs = clubs.filter((c) => studentMemberships.some((m) => m.club_id === c.id));
  const myCertificates = user ? appStore.getCertificatesForUser(user.id) : [];
  const myDutyLeaves = user ? storeState.dutyLeaves.filter((dl) => dl.user_id === user.id) : [];

  // Pinned Announcements for Students & Members
  const userClubIds = myClubs.map((c) => c.id);
  const pinnedAnnouncements = appStore.getPinnedAnnouncements(
    user?.campus_id || "c1111111-1111-1111-1111-111111111111",
    userClubIds.length > 0 ? userClubIds : undefined
  );

  // Admin Dashboard Computed Metrics
  const adminMetrics = React.useMemo(() => {
    return appStore.getAdminDashboardMetrics({
      campusId: selectedCampusId === "all" ? undefined : selectedCampusId,
      clubId: selectedClubId === "all" ? undefined : selectedClubId,
    });
  }, [storeState, selectedCampusId, selectedClubId]);

  // Needs Attention Items
  const needsAttentionItems = React.useMemo(() => {
    return appStore.getNeedsAttentionItems(
      role === "campus_manager" ? "c1111111-1111-1111-1111-111111111111" : undefined
    );
  }, [storeState, role]);

  // Monthly Reports
  const monthlyReports = React.useMemo(() => {
    return appStore.getMonthlyReports(
      role === "campus_manager" ? "c1111111-1111-1111-1111-111111111111" : undefined
    );
  }, [storeState, role]);

  // Coordinator / Advisor Club Scope
  const coordinatorClub = React.useMemo(() => {
    if (role === "student_coordinator" || role === "faculty_advisor") {
      const matchMember = storeState.memberships.find(
        (m) => m.user_id === user?.id && (m.designation?.toLowerCase().includes("coordinator") || m.designation?.toLowerCase().includes("advisor"))
      );
      if (matchMember) return clubs.find((c) => c.id === matchMember.club_id) || clubs[1];
    }
    return clubs[1]; // Fallback to Kaizen Dev
  }, [storeState, user, role, clubs]);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinatorClub || !user) return;
    if (!announceTitle.trim() || !announceContent.trim()) {
      toast.error("Please enter a title and announcement content.");
      return;
    }

    setIsSubmitting(true);
    try {
      appStore.createAnnouncement(
        {
          club_id: coordinatorClub.id,
          club_name: coordinatorClub.name,
          campus_id: coordinatorClub.campus_id,
          title: announceTitle.trim(),
          content: announceContent.trim(),
          author_id: user.id,
          author_name: user.full_name,
          author_role: user.role,
          is_pinned: announcePinned,
          target_audience: "all_members",
        },
        user
      );
      toast.success("Announcement broadcasted and sent to all members!");
      setShowAnnounceModal(false);
      setAnnounceTitle("");
      setAnnounceContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportTopContributorsCsv = () => {
    const headers = ["Student Name", "Student ID", "Campus", "Verified Attendances", "Submissions", "Average Score (/10)"];
    const rows = adminMetrics.topContributors.map((c) => [
      c.name,
      c.studentId,
      c.campus,
      c.attendances,
      c.submissions,
      c.averageScore,
    ]);
    downloadCsv(`top-contributors-${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
    toast.success("Exported top contributors to CSV.");
  };

  const handleExportAttendanceTrendsCsv = () => {
    const headers = ["Session", "Date", "Title", "Attendees Count", "Compliance Rate (%)"];
    const rows = adminMetrics.attendanceTrends.map((t) => [
      t.name,
      t.date,
      t.title,
      t.attendances,
      t.rate,
    ]);
    downloadCsv(`attendance-trends-${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
    toast.success("Exported attendance trends to CSV.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. WELCOME BANNER & WORKSPACE ACTIONS                                     */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-navy-800 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-cyan-50/70 dark:from-navy-900 dark:via-navy-850 dark:to-navy-900 p-6 md:p-8 shadow-sm dark:shadow-none">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="gradient" className="uppercase font-mono text-[10px] tracking-wider">
                {role.replace("_", " ")} Workspace
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {user?.campus_name || "Delhi-NCR Campus"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="gradient-text">{user?.full_name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-muted-foreground mt-1 max-w-xl">
              {role === "admin" && "Executive institutional intelligence, automated Club Day flows, audit compliance, and cross-campus analytics."}
              {role === "campus_manager" && "Campus operational health, verified attendance monitoring, Duty Leave authorizations, and monthly reporting."}
              {role === "faculty_advisor" && "Curriculum approvals, lesson plan reviews, rubric scoring, and achievement certifications."}
              {role === "student_coordinator" && "Session check-ins, member communication, attendance correction logs, and activity planning."}
              {role === "student" && "Track verified attendance, upcoming Club Day schedules, project deliverables, and official transcripts."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {role === "student" && (
              <>
                <Link href="/events">
                  <Button variant="gradient" size="sm" className="gap-1.5 shadow-glow">
                    <Sparkles className="h-4 w-4" /> Flagship Events
                  </Button>
                </Link>
                <Link href="/transcript">
                  <Button variant="secondary" size="sm" className="gap-1.5 border-cyan-500/30 text-cyan-700 dark:text-cyan-400">
                    <Award className="h-4 w-4" /> My Transcript
                  </Button>
                </Link>
              </>
            )}

            {(role === "student_coordinator" || role === "faculty_advisor") && (
              <>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => setShowAnnounceModal(true)}
                  className="gap-1.5 shadow-glow"
                >
                  <Megaphone className="h-4 w-4" /> Post Announcement
                </Button>
                <Link href="/activities">
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <Sparkles className="h-4 w-4" /> Plan Activity
                  </Button>
                </Link>
              </>
            )}

            {(role === "admin" || role === "campus_manager") && (
              <>
                <Link href="/events">
                  <Button variant="gradient" size="sm" className="gap-1.5 shadow-glow">
                    <Sparkles className="h-4 w-4" /> Events & Results
                  </Button>
                </Link>
                <Link href="/duty-leave">
                  <Button variant="secondary" size="sm" className="gap-1.5 border-slate-200 dark:border-navy-800">
                    <ShieldCheck className="h-4 w-4" /> Duty Leave
                  </Button>
                </Link>
              </>
            )}

            <Link href="/calendar">
              <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 dark:border-navy-800">
                <CalendarDays className="h-4 w-4" /> Calendar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PINNED CLUB ANNOUNCEMENTS BANNER (FOR STUDENTS & MEMBERS)             */}
      {/* ========================================================================= */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3">
          {pinnedAnnouncements.slice(0, 2).map((ann) => (
            <div
              key={ann.id}
              className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-4 flex items-start gap-3.5 shadow-sm"
            >
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
                <Pin className="h-4 w-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="gradient" className="text-[10px] px-1.5 py-0 font-mono">
                    {ann.club_name} Announcement
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    By {ann.author_name} ({ann.author_role.replace("_", " ")})
                  </span>
                </div>
                <h4 className="font-bold text-sm text-foreground">{ann.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{ann.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADMIN & CAMPUS MANAGER DASHBOARD (RECHARTS + FILTERS + NEEDS ATTENTION) */}
      {/* ========================================================================= */}
      {(role === "admin" || role === "campus_manager") && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Filter className="h-4 w-4 text-cyan-500" />
                <span>Dashboard Scope & Filters:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {role === "admin" && (
                  <select
                    value={selectedCampusId}
                    onChange={(e) => setSelectedCampusId(e.target.value)}
                    className="text-xs rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-2 font-medium"
                  >
                    <option value="all">All Campuses (Consolidated)</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="text-xs rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-2 font-medium"
                >
                  <option value="all">All Clubs & Societies</option>
                  {clubs.filter((c) => c.category !== "Parent Society").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="text-xs rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-2 font-medium"
                >
                  <option value="all">October 2026 (Full Term)</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="current">Next Saturday Session</option>
                </select>
              </div>
            </div>
          </Card>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-4 border-slate-200 dark:border-navy-800">
              <div className="text-[11px] text-muted-foreground font-medium">Total Students</div>
              <div className="text-2xl font-extrabold font-heading text-foreground mt-1">
                {adminMetrics.kpi.totalEnrolled}
              </div>
              <div className="text-[10px] text-cyan-600 mt-0.5">Enrolled Members</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800">
              <div className="text-[11px] text-muted-foreground font-medium">Active Clubs</div>
              <div className="text-2xl font-extrabold font-heading text-foreground mt-1">
                {adminMetrics.kpi.totalClubs}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across Campus</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800">
              <div className="text-[11px] text-muted-foreground font-medium">Verified Attendances</div>
              <div className="text-2xl font-extrabold font-heading text-emerald-600 dark:text-emerald-400 mt-1">
                {adminMetrics.kpi.totalAttendances}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">HMAC Validated</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800">
              <div className="text-[11px] text-muted-foreground font-medium">Deliverables</div>
              <div className="text-2xl font-extrabold font-heading text-blue-600 dark:text-blue-400 mt-1">
                {adminMetrics.kpi.totalSubmissions}
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5">Projects Submitted</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800">
              <div className="text-[11px] text-muted-foreground font-medium">Average Rubric</div>
              <div className="text-2xl font-extrabold font-heading text-violet-600 dark:text-violet-400 mt-1">
                {adminMetrics.kpi.averageRubricScore} <span className="text-xs font-normal text-muted-foreground">/10</span>
              </div>
              <div className="text-[10px] text-violet-600 mt-0.5">Faculty Scored</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800">
              <div className="text-[11px] text-muted-foreground font-medium">Certificates</div>
              <div className="text-2xl font-extrabold font-heading text-cyan-600 dark:text-cyan-400 mt-1">
                {adminMetrics.kpi.activeCertificates}
              </div>
              <div className="text-[10px] text-cyan-600 mt-0.5">Signed & Valid</div>
            </Card>
          </div>

          {/* Unified "Needs Attention" Widget */}
          {needsAttentionItems.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-800 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Needs Attention ({needsAttentionItems.length} Escalations)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Unified compliance radar detecting inactive societies, unreviewed plans, and zero-participation students.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {needsAttentionItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 flex flex-col justify-between space-y-2 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-foreground truncate">{item.title}</span>
                          <Badge
                            variant={item.severity === "critical" ? "default" : "outline"}
                            className="text-[9px] uppercase px-1 py-0 shrink-0"
                          >
                            {item.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {item.subtitle}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-navy-850 flex justify-end">
                        <Link href={item.action_url}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-cyan-500/30 text-cyan-600">
                            {item.action_label} <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recharts Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Attendance Trends Over Time */}
            <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-500" />
                    Attendance Trends Over Time
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Weekly Club Day checked-in student count across sessions.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportAttendanceTrendsCsv}
                  className="h-7 text-[11px] gap-1"
                >
                  <Download className="h-3 w-3" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={adminMetrics.attendanceTrends}>
                      <defs>
                        <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="attendances"
                        stroke="#22D3EE"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#attGrad)"
                        name="Attendees"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Participation Matrix by Club */}
            <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Participation & Submissions by Club
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparison of membership size and deliverables submitted.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminMetrics.clubParticipation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="members" fill="#3B82F6" name="Enrolled Members" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="submissions" fill="#8B5CF6" name="Deliverables" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Funnel & Top Contributors Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Funnel */}
            <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Inter-Campus Event Funnel</CardTitle>
                <CardDescription className="text-xs">
                  Progression from registration to verified certificates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-1">
                  {adminMetrics.eventFunnel.map((stage, idx) => (
                    <div key={stage.stage} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{stage.stage}</span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400">{stage.count}</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-navy-900 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(10, Math.min(100, (stage.count / Math.max(1, adminMetrics.eventFunnel[0].count)) * 100))}%`,
                            backgroundColor: stage.fill,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors Table */}
            <Card className="lg:col-span-2 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" /> Top Student Contributors
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Students with highest attendance, submissions, and rubric performance.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportTopContributorsCsv}
                  className="h-7 text-xs gap-1 border-slate-200 dark:border-navy-800"
                >
                  <Download className="h-3 w-3" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-navy-800 text-muted-foreground">
                        <th className="pb-2 font-semibold">Student</th>
                        <th className="pb-2 font-semibold">Campus</th>
                        <th className="pb-2 font-semibold text-center">Attendances</th>
                        <th className="pb-2 font-semibold text-center">Submissions</th>
                        <th className="pb-2 font-semibold text-right">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
                      {adminMetrics.topContributors.slice(0, 6).map((c, i) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-900/50">
                          <td className="py-2.5">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                              {c.name}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground pl-5">{c.studentId}</div>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{c.campus}</td>
                          <td className="py-2.5 text-center font-mono font-bold text-emerald-600">{c.attendances}</td>
                          <td className="py-2.5 text-center font-mono font-bold text-blue-600">{c.submissions}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-cyan-600">{c.averageScore} / 10</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Reports Section */}
          <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-500" />
                  Monthly Club Performance Reports
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated monthly performance summaries verified against raw check-in signatures.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlyReports.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
                    No monthly reports generated yet. Scheduled at month end or trigger via cron.
                  </div>
                ) : (
                  monthlyReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 rounded-xl border border-slate-100 dark:border-navy-850 bg-slate-50/50 dark:bg-navy-900/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs text-foreground">{rep.club_name}</div>
                          <div className="text-[10px] text-muted-foreground">{rep.month} • {rep.campus_name}</div>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {rep.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 dark:border-navy-800 text-center">
                        <div>
                          <div className="text-[10px] text-muted-foreground">Attendance</div>
                          <div className="font-mono text-xs font-bold text-emerald-600">{rep.attendance_rate}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground">Submissions</div>
                          <div className="font-mono text-xs font-bold text-blue-600">{rep.submissions_count}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground">Avg Score</div>
                          <div className="font-mono text-xs font-bold text-cyan-600">{rep.average_score}/10</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <a
                          href={rep.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-600 hover:underline font-semibold text-[11px]"
                        >
                          <Download className="h-3 w-3" /> Download PDF
                        </a>
                        <a
                          href={rep.csv_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-[11px]"
                        >
                          <Download className="h-3 w-3" /> CSV
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADVISOR & COORDINATOR DASHBOARD (CLUB SPECIFIC METRICS)                */}
      {/* ========================================================================= */}
      {(role === "student_coordinator" || role === "faculty_advisor") && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <div className="text-xs text-muted-foreground">Managing Club</div>
              <div className="text-lg font-bold text-foreground mt-1 truncate">
                {coordinatorClub?.name || "Kaizen Dev Club"}
              </div>
              <div className="text-[11px] text-cyan-600 mt-1 capitalize">{role.replace("_", " ")}</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <div className="text-xs text-muted-foreground">Enrolled Members</div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {storeState.memberships.filter((m) => m.club_id === coordinatorClub?.id && m.status === "approved").length}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Active Rosters</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <div className="text-xs text-muted-foreground">Activity Submissions</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {storeState.submissions.filter((s) => s.club_id === coordinatorClub?.id).length}
              </div>
              <div className="text-[11px] text-blue-600 mt-1">Uploaded Deliverables</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <div className="text-xs text-muted-foreground">Pending Evaluations</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {
                  storeState.submissions.filter(
                    (s) => s.club_id === coordinatorClub?.id && !storeState.evaluations.some((e) => e.submission_id === s.id)
                  ).length
                }
              </div>
              <div className="text-[11px] text-amber-600 mt-1">Awaiting Scores</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold">Recent Club Submissions</CardTitle>
                <Link href="/activities">
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    View All Queue
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {storeState.submissions.filter((s) => s.club_id === coordinatorClub?.id).slice(0, 5).map((sub) => (
                    <div key={sub.id} className="p-3 rounded-xl border border-slate-100 dark:border-navy-850 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-foreground">{sub.user_name}</div>
                        <div className="text-[11px] text-muted-foreground">{sub.activity_title}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Submitted
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold">Upcoming Club Days</CardTitle>
                <Link href="/calendar">
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Full Calendar
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clubDays.slice(0, 3).map((cd) => (
                    <div key={cd.id} className="p-3 rounded-xl border border-slate-100 dark:border-navy-850 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-foreground">{cd.title}</div>
                        <div className="text-[11px] text-muted-foreground">{formatDate(cd.date)}</div>
                      </div>
                      <Badge className="bg-cyan-500/10 text-cyan-600 border border-cyan-500/30 text-[10px]">
                        {cd.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STUDENT DASHBOARD (ENROLMENTS, ATTENDANCE, CERTIFICATES, TRANSCRIPT)    */}
      {/* ========================================================================= */}
      {role === "student" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <div className="text-xs text-muted-foreground">My Enrolled Clubs</div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {studentMemberships.length} / 2
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Enrolment Cap Active</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <div className="text-xs text-muted-foreground">Next Club Day</div>
              <div className="text-base font-bold text-foreground mt-1 truncate">
                {nextClubDay ? formatDate(nextClubDay.date) : "Oct 24, 2026"}
              </div>
              <div className="text-[11px] text-cyan-600 mt-1 truncate">{nextClubDay?.title}</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <div className="text-xs text-muted-foreground">Verified Certificates</div>
              <div className="text-2xl font-bold text-cyan-600 mt-1">
                {myCertificates.length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Cryptographic Badges</div>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <div className="text-xs text-muted-foreground">Duty Leave Sanctions</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {myDutyLeaves.length}
              </div>
              <div className="text-[11px] text-purple-600 mt-1">Inter-Campus Events</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">My Clubs & Attendance</CardTitle>
                  <CardDescription className="text-xs">
                    Your approved collegiate memberships and session participation rates.
                  </CardDescription>
                </div>
                <Link href="/clubs">
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Browse Clubs
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myClubs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      You have not joined any clubs yet. Join a club to begin verified attendance!
                    </div>
                  ) : (
                    myClubs.map((club) => {
                      const attCount = storeState.attendances.filter(
                        (a) => a.user_id === user?.id && a.club_id === club.id && a.status === "present"
                      ).length;
                      return (
                        <div key={club.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-navy-850 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ClubLogo name={club.name} logoUrl={club.logo_url} size="md" />
                            <div>
                              <div className="font-bold text-xs text-foreground">{club.name}</div>
                              <div className="text-[10px] text-muted-foreground">{club.category} • {club.meeting_day}s</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-600">{attCount} Sessions</div>
                            <Link href={`/clubs/${club.id}`} className="text-[10px] text-cyan-600 hover:underline">
                              Club Space →
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Co-Curricular Portfolio</CardTitle>
                <CardDescription className="text-xs">
                  Your cryptographically signed institutional achievement record.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-navy-850 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student ID:</span>
                    <span className="font-mono font-bold text-foreground">{user?.student_id || "2024-CS-001"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Clubs:</span>
                    <span className="font-bold text-foreground">{studentMemberships.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credentials:</span>
                    <span className="font-bold text-emerald-600">{myCertificates.length} Issued</span>
                  </div>
                </div>

                <Link href="/transcript" className="block">
                  <Button variant="gradient" className="w-full gap-2 shadow-glow text-xs">
                    <GraduationCap className="h-4 w-4" /> Download Official Transcript PDF
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. POST ANNOUNCEMENT MODAL (FOR COORDINATOR / ADVISOR)                    */}
      {/* ========================================================================= */}
      {showAnnounceModal && coordinatorClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-850 pb-3">
              <div>
                <h3 className="font-bold text-foreground text-sm">Post Club Announcement</h3>
                <p className="text-xs text-muted-foreground">{coordinatorClub.name}</p>
              </div>
              <button
                onClick={() => setShowAnnounceModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Announcement Title *</label>
                <Input
                  placeholder="e.g. Workshop Deliverable Guidelines Released"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Content / Instructions *</label>
                <textarea
                  rows={4}
                  placeholder="Type message for all enrolled club members..."
                  value={announceContent}
                  onChange={(e) => setAnnounceContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinBanner"
                  checked={announcePinned}
                  onChange={(e) => setAnnouncePinned(e.target.checked)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="pinBanner" className="text-xs text-foreground font-medium cursor-pointer">
                  Pin as glowing banner on member dashboards
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-navy-850">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnounceModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5 shadow-glow"
                >
                  <Megaphone className="h-3.5 w-3.5" /> {isSubmitting ? "Publishing..." : "Broadcast Announcement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
