"use client";

import * as React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { DutyLeave } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FileCheck2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  Sparkles,
  Building2,
  UserCheck,
  Search,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DutyLeavePage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "approved" | "rejected">("all");

  // Approval modal state
  const [selectedRequest, setSelectedRequest] = React.useState<DutyLeave | null>(null);
  const [approvalDecision, setApprovalDecision] = React.useState<"approved" | "rejected">("approved");
  const [approvalComments, setApprovalComments] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const dutyLeaves = storeState.dutyLeaves;
  const isManagerOrAdmin = role === "campus_manager" || role === "admin";

  // Filter requests based on user role
  const visibleRequests = dutyLeaves.filter((dl) => {
    // If student, show only their requests
    if (role === "student" && user) {
      if (dl.user_id !== user.id) return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = dl.user_name.toLowerCase().includes(q);
      const matchEvent = dl.event_name.toLowerCase().includes(q);
      const matchStudentId = dl.student_id.toLowerCase().includes(q);
      if (!matchName && !matchEvent && !matchStudentId) return false;
    }
    // Status filter
    if (statusFilter !== "all" && dl.status !== statusFilter) return false;

    return true;
  });

  const pendingCount = dutyLeaves.filter((d) => d.status === "pending").length;
  const approvedCount = dutyLeaves.filter((d) => d.status === "approved").length;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !user) return;

    setIsSubmitting(true);
    try {
      const res = appStore.approveDutyLeave(
        selectedRequest.id,
        user,
        approvalComments.trim() || undefined,
        approvalDecision === "approved"
      );
      if (res.success) {
        toast.success(`Duty Leave request ${approvalDecision === "approved" ? "approved" : "rejected"} successfully.`);
        setSelectedRequest(null);
        setApprovalComments("");
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gradient" className="gap-1 font-mono text-[10px]">
              <FileCheck2 className="h-3 w-3" /> Academic Compliance
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">MSOT Official Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
            Duty Leave Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-muted-foreground mt-1">
            Official duty leave verification and signed letters for inter-college event participation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/events">
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 dark:border-navy-800">
              <CalendarDays className="h-4 w-4" /> Browse Events
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-medium">Total Requests</div>
          <div className="text-2xl font-bold font-heading text-foreground mt-1">
            {dutyLeaves.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-medium">Pending Manager Review</div>
          <div className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-medium">Approved Letters</div>
          <div className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 mt-1">
            {approvedCount}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-medium">Auto-Filing Protocol</div>
          <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-2 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Instant on Registration
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student, event, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-navy-950 shadow-sm"
                    : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-navy-850"
                }`}
              >
                All ({dutyLeaves.length})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === "pending"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-navy-850"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === "approved"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-navy-850"
                }`}
              >
                Approved ({approvedCount})
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duty Leave Table / List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Duty Leave Requests</CardTitle>
          <CardDescription>
            {role === "student"
              ? "Your filed duty leaves for inter-college flagship events."
              : "Review, approve, or reject student duty leaves for campus attendance exemption."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-muted-foreground">
                  <th className="pb-3 font-semibold">Student Details</th>
                  <th className="pb-3 font-semibold">Event / Dates</th>
                  <th className="pb-3 font-semibold">Campus</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Review Details</th>
                  <th className="pb-3 font-semibold text-right">Official Letter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
                {visibleRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No duty leave requests found matching filters.
                    </td>
                  </tr>
                ) : (
                  visibleRequests.map((dl) => (
                    <tr key={dl.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-900/50">
                      <td className="py-3.5">
                        <div className="font-semibold text-foreground">{dl.user_name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{dl.student_id}</div>
                      </td>
                      <td className="py-3.5">
                        <div className="font-medium text-foreground">{dl.event_name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-cyan-500" /> {dl.dates}
                        </div>
                      </td>
                      <td className="py-3.5 text-muted-foreground">{dl.campus_name}</td>
                      <td className="py-3.5">
                        <Badge
                          className={
                            dl.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : dl.status === "rejected"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          }
                        >
                          {dl.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-muted-foreground max-w-[200px]">
                        {dl.status === "approved" && (
                          <div className="text-[11px]">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Approved</span>
                            {dl.approver_name && ` by ${dl.approver_name}`}
                            {dl.approver_comments && <p className="italic text-[10px] mt-0.5">&quot;{dl.approver_comments}&quot;</p>}
                          </div>
                        )}
                        {dl.status === "rejected" && (
                          <div className="text-[11px]">
                            <span className="text-red-600 dark:text-red-400 font-medium">Rejected</span>
                            {dl.approver_comments && <p className="italic text-[10px] mt-0.5">&quot;{dl.approver_comments}&quot;</p>}
                          </div>
                        )}
                        {dl.status === "pending" && (
                          <span className="text-[11px] italic text-amber-600 dark:text-amber-400">
                            Awaiting Manager review
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        {dl.status === "approved" ? (
                          <a
                            href={`/api/duty-leave/${dl.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:border-cyan-500 transition-colors shadow-sm"
                          >
                            <Download className="h-3.5 w-3.5" /> Download PDF
                          </a>
                        ) : isManagerOrAdmin && dl.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="gradient"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedRequest(dl);
                              setApprovalDecision("approved");
                              setApprovalComments("");
                            }}
                          >
                            Review Request
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Campus Manager Approval Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-850 pb-3">
              <div>
                <h3 className="font-bold text-foreground text-sm">Review Duty Leave Application</h3>
                <p className="text-xs text-muted-foreground">{selectedRequest.event_name}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-semibold text-foreground">
                  {selectedRequest.user_name} ({selectedRequest.student_id})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Campus:</span>
                <span className="font-medium text-foreground">{selectedRequest.campus_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Excused Dates:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  {selectedRequest.dates}
                </span>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision("approved")}
                    className={`p-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      approvalDecision === "approved"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-200 dark:border-navy-800"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision("rejected")}
                    className={`p-2.5 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      approvalDecision === "rejected"
                        ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                        : "border-slate-200 dark:border-navy-800"
                    }`}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Approval Notes / Remarks</label>
                <Input
                  placeholder="e.g. Approved for inter-campus flagship representation."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-navy-850">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Confirming..." : "Submit Decision"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
