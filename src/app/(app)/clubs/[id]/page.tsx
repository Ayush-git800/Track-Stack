"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClubLogo } from "@/components/ui/club-logo";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Clock,
  MapPin,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [activeTab, setActiveTab] = React.useState<"overview" | "activities" | "members">("overview");

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const clubId = params.id as string;
  const club = appStore.getClubById(clubId);

  if (!club) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Club Not Found</h2>
        <Link href="/clubs">
          <Button variant="outline" className="mt-4">
            Back to Clubs Directory
          </Button>
        </Link>
      </div>
    );
  }

  const allMembers = appStore.getClubMembers(club.id);
  const approvedMembers = allMembers.filter((m) => m.status === "approved");
  const pendingRequests = allMembers.filter((m) => m.status === "pending");
  const waitlistedMembers = allMembers.filter((m) => m.status === "waitlisted");
  const clubActivities = appStore.getActivities({ clubId: club.id });

  const userMembership = user ? allMembers.find((m) => m.user_id === user.id) : null;
  const isCoordinator =
    role === "admin" ||
    role === "campus_manager" ||
    (role === "student_coordinator" && user?.club_id === club.id);

  const handleApprove = (membershipId: string, studentName: string) => {
    appStore.updateMembershipStatus(membershipId, "approved", "Approved by coordinator", user?.full_name);
    toast.success(`Approved ${studentName} into ${club.name}`);
  };

  const handleReject = (membershipId: string, studentName: string) => {
    appStore.updateMembershipStatus(membershipId, "rejected", "Rejected: Capacity constraints", user?.full_name);
    toast.info(`Rejected request for ${studentName}`);
  };

  const handleWithdraw = (membershipId: string) => {
    if (confirm("Are you sure you want to withdraw from this club? A waitlisted student will automatically be promoted to your seat.")) {
      appStore.updateMembershipStatus(membershipId, "withdrawn", "Student voluntarily withdrew", user?.full_name);
      toast.success("Successfully withdrawn. Seat released for waitlist.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <Link
          href="/clubs"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
        </Link>
      </div>

      {/* Hero Banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-navy-800 bg-navy-900/90 p-6 md:p-8 gradient-border-top"
        style={{
          boxShadow: `0 10px 30px -10px ${club.accent_color}22`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <ClubLogo
              name={club.name}
              logoUrl={club.logo_url}
              accentColor={club.accent_color}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  style={{ borderColor: `${club.accent_color}66`, color: club.accent_color }}
                >
                  {club.category}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {club.code} &bull; Delhi-NCR Campus
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                {club.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                {club.description}
              </p>
            </div>
          </div>

          {/* Membership Actions */}
          <div className="flex flex-col sm:items-end gap-2.5">
            {userMembership ? (
              <div className="flex flex-col sm:items-end gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      userMembership.status === "approved"
                        ? "success"
                        : userMembership.status === "waitlisted"
                        ? "warning"
                        : "secondary"
                    }
                    className="capitalize text-xs px-3 py-1 font-semibold"
                  >
                    Status: {userMembership.status}
                    {userMembership.waitlist_position ? ` (Position #${userMembership.waitlist_position})` : ""}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-mono uppercase">
                    {userMembership.designation}
                  </Badge>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleWithdraw(userMembership.id)}
                >
                  Withdraw from Club
                </Button>
              </div>
            ) : (
              <Link href="/clubs">
                <Button variant="gradient" size="sm">
                  Join This Club
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Meta Row */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-navy-800/80 pt-6">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-mono block">Meeting Schedule</span>
            <span className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              {club.meeting_day} &bull; {club.meeting_time}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-mono block">Meeting Venue</span>
            <span className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              {club.meeting_venue}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-mono block">Capacity & Enrolled</span>
            <span className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              {approvedMembers.length} / {club.capacity} seats ({waitlistedMembers.length} on waitlist)
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-mono block">Planned Activities</span>
            <span className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              {clubActivities.length} Club Day Sessions
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-800 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "overview"
              ? "bg-navy-850 text-cyan-400 border border-navy-800 shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Club Overview
        </button>

        <button
          onClick={() => setActiveTab("activities")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "activities"
              ? "bg-navy-850 text-cyan-400 border border-navy-800 shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Activities ({clubActivities.length})
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "members"
              ? "bg-navy-850 text-cyan-400 border border-navy-800 shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Members & Waitlist ({allMembers.length})
        </button>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-navy-800 bg-navy-900/80">
            <CardHeader>
              <CardTitle className="text-base font-bold">About {club.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <p>{club.description}</p>
              <p>
                As part of Mirai School of Technology's verified co-curricular curriculum, participation in this club contributes directly to your official university co-curricular transcript. All Club Day attendances are validated through high-frequency rotating QR verification and faculty evaluations.
              </p>
              <div className="rounded-xl border border-navy-800 bg-navy-950/60 p-4">
                <h4 className="font-semibold text-white text-xs mb-2">Club Standards & Rules:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Mandatory check-in during the 45-minute active window on Saturday mornings.</li>
                  <li>Deliverables must be submitted within 48 hours of activity conclusion.</li>
                  <li>Members are limited to 2 clubs maximum per university policy.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-navy-800 bg-navy-900/80">
            <CardHeader>
              <CardTitle className="text-base font-bold">Club Leadership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-purple-400 block">Faculty Advisor</span>
                  <span className="text-xs font-semibold text-white">Gaurav Kumar</span>
                  <span className="text-[11px] text-muted-foreground block">advisor.kaizen@msot.edu</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-emerald-400 block">Student Coordinator</span>
                  <span className="text-xs font-semibold text-white">Rishav Raj</span>
                  <span className="text-[11px] text-muted-foreground block">coordinator.kaizen@msot.edu</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Activities */}
      {activeTab === "activities" && (
        <Card className="border-navy-800 bg-navy-900/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Planned Activities</CardTitle>
              <CardDescription className="text-xs">
                Scheduled workshops and Club Day hands-on sessions
              </CardDescription>
            </div>
            {isCoordinator && (
              <Link href="/activities">
                <Button variant="gradient" size="sm">
                  + Plan New Activity
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {clubActivities.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No activities planned yet for this club.
              </div>
            ) : (
              clubActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-navy-800 bg-navy-950/60 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-white">{act.title}</h4>
                      <Badge
                        variant={
                          act.status === "live"
                            ? "danger"
                            : act.status === "approved" || act.status === "announced"
                            ? "success"
                            : "secondary"
                        }
                        className="text-[10px] uppercase font-mono"
                      >
                        {act.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl">{act.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                      <span>Venue: {act.venue}</span>
                      <span>&bull;</span>
                      <span>Format: {act.format}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-400 block">
                      {act.club_day_date ? formatDate(act.club_day_date) : "Oct 24, 2026"}
                    </span>
                    <Link
                      href={`/activities`}
                      className="text-xs text-cyan-400 hover:underline mt-1 inline-block"
                    >
                      Activity Details &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT: Members & Roster */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Pending Join Requests (Visible to Coordinators & Admins) */}
          {isCoordinator && pendingRequests.length > 0 && (
            <Card className="border-amber-500/30 bg-navy-900/90 gradient-border-top">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  Pending Enrolment Requests ({pendingRequests.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Review student join requests and confirm designation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Statement</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-semibold text-white">
                          {req.user_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{req.student_id || "N/A"}</TableCell>
                        <TableCell>Year {req.year_of_study || 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {req.designation}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {req.join_request_note || "No note provided"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove(req.id, req.user_name || "Student")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(req.id, req.user_name || "Student")}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Waitlisted Students */}
          {waitlistedMembers.length > 0 && (
            <Card className="border-navy-800 bg-navy-900/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  Waitlist Queue ({waitlistedMembers.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Automatically promoted in queue order as soon as a student departs or seat opens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Requested Designation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlistedMembers.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-mono font-bold text-cyan-400">
                          #{w.waitlist_position || 1}
                        </TableCell>
                        <TableCell className="font-semibold text-white">{w.user_name}</TableCell>
                        <TableCell className="font-mono text-xs">{w.student_id || "N/A"}</TableCell>
                        <TableCell>Year {w.year_of_study || 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {w.designation}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Active Enrolled Roster */}
          <Card className="border-navy-800 bg-navy-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-white">
                Active Enrolled Members ({approvedMembers.length} / {club.capacity})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedMembers.slice(0, 15).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-white">{m.user_name}</TableCell>
                      <TableCell className="font-mono text-xs">{m.student_id || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {m.designation}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {m.joined_at ? formatDate(m.joined_at) : "Oct 12, 2026"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" className="text-[10px] capitalize">
                          Enrolled
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
