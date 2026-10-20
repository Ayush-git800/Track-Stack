"use client";

import * as React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Activity, ActivityFormat, ActivityStatus } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClubLogo } from "@/components/ui/club-logo";
import { toast } from "sonner";
import {
  Sparkles,
  Clock,
  MapPin,
  FileCheck2,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Send,
  Plus,
  X,
  Filter,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ActivitiesPage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [statusFilter, setStatusFilter] = React.useState<string>("All");

  // Plan Activity Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);
  const [newActivity, setNewActivity] = React.useState({
    club_id: "a1000000-0000-0000-0000-000000000002", // Kaizen Dev
    club_day_id: "d1000000-0000-0000-0000-000000000002",
    title: "",
    topic: "",
    format: "workshop" as ActivityFormat,
    venue: "",
    description: "",
    deliverable_spec: "",
    submission_deadline: "2026-11-02T18:00:00Z",
  });

  // Selected Activity for Comment & Approval Drawer
  const [selectedActivity, setSelectedActivity] = React.useState<Activity | null>(null);
  const [commentText, setCommentText] = React.useState("");

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const clubs = storeState.clubs;
  const clubDays = storeState.clubDays;

  // Coordinators see their own club activities; Advisors see assigned clubs; Admins see all
  let visibleActivities = appStore.getActivities();
  if (role === "student_coordinator" && user?.club_id) {
    visibleActivities = visibleActivities.filter((a) => a.club_id === user.club_id);
  } else if (role === "faculty_advisor" && user?.club_id) {
    visibleActivities = visibleActivities.filter((a) => a.club_id === user.club_id);
  }

  if (statusFilter !== "All") {
    visibleActivities = visibleActivities.filter((a) => a.status === statusFilter);
  }

  const isCoordinator = role === "student_coordinator" || role === "admin";
  const isAdvisor = role === "faculty_advisor" || role === "admin";

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title || !newActivity.topic || !newActivity.venue) {
      toast.error("Please fill in Title, Topic, and Venue");
      return;
    }

    const clubId = role === "student_coordinator" && user?.club_id ? user.club_id : newActivity.club_id;

    appStore.createActivity(
      {
        ...newActivity,
        club_id: clubId,
        status: "draft",
      },
      user || undefined
    );

    toast.success("Activity plan created in Draft status!");
    setIsPlanModalOpen(false);
    setNewActivity({
      club_id: "a1000000-0000-0000-0000-000000000002",
      club_day_id: "d1000000-0000-0000-0000-000000000002",
      title: "",
      topic: "",
      format: "workshop",
      venue: "",
      description: "",
      deliverable_spec: "",
      submission_deadline: "2026-11-02T18:00:00Z",
    });
  };

  const handleUpdateStatus = (
    activityId: string,
    status: ActivityStatus,
    comment?: string
  ) => {
    const updated = appStore.updateActivityStatus(
      activityId,
      status,
      comment || commentText,
      user || undefined
    );
    if (updated) {
      toast.success(`Activity moved to ${status.replace("_", " ").toUpperCase()}`);
      setSelectedActivity(updated);
      setCommentText("");
    }
  };

  const statusList = [
    "All",
    "draft",
    "submitted",
    "approved",
    "changes_requested",
    "announced",
    "live",
    "closed",
    "evaluated",
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
              Club Day Lifecycle Engine
            </Badge>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Activity Planning & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            State Machine: Draft &rarr; Submitted &rarr; Approved / Changes Requested &rarr; Announced &rarr; Live &rarr; Evaluated.
          </p>
        </div>

        {isCoordinator && (
          <Button
            variant="gradient"
            onClick={() => setIsPlanModalOpen(true)}
            className="gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" /> Plan Club Day Session
          </Button>
        )}
      </div>

      {/* Status Pipeline Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statusList.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
              statusFilter === st
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "bg-navy-900/60 text-muted-foreground border border-navy-800 hover:text-white hover:border-navy-700"
            }`}
          >
            {st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleActivities.map((act) => (
          <Card
            key={act.id}
            className="border-navy-800 bg-navy-900/80 hover:border-navy-700 transition-all group overflow-hidden flex flex-col justify-between"
            gradientBorder={act.status === "live" || act.status === "approved"}
          >
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ClubLogo
                    name={act.club_name || "Club"}
                    logoUrl={act.club_logo}
                    accentColor={act.club_accent}
                    size="md"
                  />
                  <div>
                    <h3 className="font-heading text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {act.title}
                    </h3>
                    <div className="text-xs text-muted-foreground font-mono">
                      {act.club_name} &bull; {act.club_day_title}
                    </div>
                  </div>
                </div>

                <Badge
                  variant={
                    act.status === "live"
                      ? "danger"
                      : act.status === "approved" || act.status === "announced"
                      ? "success"
                      : act.status === "changes_requested"
                      ? "warning"
                      : "secondary"
                  }
                  className="text-[10px] uppercase font-mono py-1 px-2.5 shrink-0"
                >
                  {act.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="mt-3 text-xs text-cyan-300 font-medium">
                Topic: {act.topic}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {act.description}
              </p>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-3">
              <div className="rounded-xl border border-navy-800 bg-navy-950/60 p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Venue: {act.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Session Date: {formatDate(act.club_day_date)}</span>
                </div>
                {act.deliverable_spec && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileCheck2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">Deliverable: {act.deliverable_spec}</span>
                  </div>
                )}
              </div>

              {/* Phase 3 Action Hub */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-navy-800">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/activities/${act.id}/run`}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:underline font-medium"
                  >
                    Run Deck &rarr;
                  </Link>
                  <span className="text-muted-foreground text-xs">&bull;</span>
                  <Link
                    href={`/activities/${act.id}/submissions`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white"
                  >
                    Submissions
                  </Link>
                  <span className="text-muted-foreground text-xs">&bull;</span>
                  <Link
                    href={`/activities/${act.id}/evaluate`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white"
                  >
                    Rubrics
                  </Link>
                </div>

                <button
                  onClick={() => setSelectedActivity(act)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                  ({act.comments?.length || 0})
                </button>
              </div>

              {/* Status Action Buttons for Workflow */}
              <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                  {/* Coordinator Draft -> Submit */}
                  {isCoordinator && act.status === "draft" && (
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={() => handleUpdateStatus(act.id, "submitted", "Submitted for faculty review")}
                    >
                      Submit for Review
                    </Button>
                  )}

                  {/* Advisor Review Actions */}
                  {isAdvisor && (act.status === "submitted" || act.status === "changes_requested") && (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setSelectedActivity(act)}
                      >
                        Request Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateStatus(act.id, "approved", "Approved by Faculty Advisor")}
                      >
                        Approve Plan
                      </Button>
                    </>
                  )}

                  {/* Coordinator / Admin Launch to Announced / Live */}
                  {act.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(act.id, "announced", "Announced to enrolled students")}
                    >
                      Announce
                    </Button>
                  )}

                  {act.status === "announced" && (
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={() => handleUpdateStatus(act.id, "live", "Session is now live with rotating QR check-in")}
                    >
                      Go Live
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Activity Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-xl font-bold text-white mb-1">
              Plan Club Day Session
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Enter activity topic, learning objectives, deliverable specification, and venue
            </p>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Select Club
                  </label>
                  <select
                    value={role === "student_coordinator" && user?.club_id ? user.club_id : newActivity.club_id}
                    onChange={(e) => setNewActivity({ ...newActivity, club_id: e.target.value })}
                    disabled={role === "student_coordinator"}
                    className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {clubs.filter((c) => c.category !== "Parent Society").map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Club Day Session
                  </label>
                  <select
                    value={newActivity.club_day_id}
                    onChange={(e) => setNewActivity({ ...newActivity, club_day_id: e.target.value })}
                    className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {clubDays.map((d) => (
                      <option key={d.id} value={d.id}>
                        {formatDate(d.date)}: {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Activity Title *
                </label>
                <Input
                  placeholder="e.g. Distributed Microservices Hands-on Lab"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Core Topic *
                  </label>
                  <Input
                    placeholder="e.g. System Design & Redis Pub/Sub"
                    value={newActivity.topic}
                    onChange={(e) => setNewActivity({ ...newActivity, topic: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Format
                  </label>
                  <select
                    value={newActivity.format}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, format: e.target.value as ActivityFormat })
                    }
                    className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="practice">Practice / Contest</option>
                    <option value="performance">Performance / Jam</option>
                    <option value="discussion">Discussion / Case Study</option>
                    <option value="guest_lecture">Guest Lecture</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Venue *
                </label>
                <Input
                  placeholder="e.g. Lab 302, Innovation Block"
                  value={newActivity.venue}
                  onChange={(e) => setNewActivity({ ...newActivity, venue: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Session Description & Learning Goals
                </label>
                <Textarea
                  placeholder="What will students learn and practice during this session?"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Student Deliverable Specification (For Rubric Grading)
                </label>
                <Input
                  placeholder="e.g. GitHub Repository link with Dockerfile and 30s screen recording"
                  value={newActivity.deliverable_spec}
                  onChange={(e) => setNewActivity({ ...newActivity, deliverable_spec: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsPlanModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient">
                  Save Draft Activity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Details & Advisor Comment Thread Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedActivity(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="uppercase font-mono text-[10px]">
                {selectedActivity.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedActivity.club_name}
              </span>
            </div>

            <h3 className="font-heading text-lg font-bold text-white">
              {selectedActivity.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedActivity.description}
            </p>

            {/* Comment Thread */}
            <div className="mt-5 border-t border-navy-800 pt-4">
              <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                Advisor & Coordinator Discussion Thread
              </h4>

              <div className="space-y-2.5 max-h-48 overflow-y-auto mb-4">
                {selectedActivity.comments && selectedActivity.comments.length > 0 ? (
                  selectedActivity.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-navy-800 bg-navy-950/70 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white">{c.user_name}</span>
                        <Badge variant="outline" className="text-[9px] uppercase font-mono py-0">
                          {c.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No comments yet. Faculty advisor comments and change requests will appear here.
                  </p>
                )}
              </div>

              {/* Add Comment / Review Form */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add feedback, requested changes, or approval notes..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[70px]"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!commentText.trim()) return;
                      handleUpdateStatus(selectedActivity.id, selectedActivity.status, commentText);
                    }}
                  >
                    Post Comment
                  </Button>

                  {isAdvisor && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (!commentText.trim()) {
                            toast.error("Please add a note explaining the requested changes.");
                            return;
                          }
                          handleUpdateStatus(selectedActivity.id, "changes_requested", commentText);
                        }}
                      >
                        Request Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          handleUpdateStatus(selectedActivity.id, "approved", commentText || "Approved by Faculty Advisor");
                        }}
                      >
                        Approve Plan
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
