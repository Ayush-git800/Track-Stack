"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Submission, Evaluation, RubricScores } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Link2,
  Send,
  Sliders,
  TrendingUp,
  X,
  Sparkles,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function ActivityEvaluatePage() {
  const params = useParams();
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());

  const activityId = params.id as string;
  const activity = appStore.getActivityById(activityId);

  // Active scoring modal
  const [scoringSubmission, setScoringSubmission] = React.useState<Submission | null>(null);
  const [rubricScores, setRubricScores] = React.useState<RubricScores>({
    content: 8,
    presentation: 8,
    participation: 9,
    total: 8.3,
  });
  const [feedback, setFeedback] = React.useState("");

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

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

  // Get all submissions for this activity
  const submissions = appStore.getSubmissions(activity.id);
  const evaluations = appStore.getEvaluations(activity.id);

  // Calculate statistics
  const scoredCount = evaluations.length;
  const publishedCount = evaluations.filter((e) => e.is_published).length;
  const draftCount = evaluations.filter((e) => !e.is_published).length;

  const totalSum = evaluations.reduce((acc, e) => acc + (e.rubric_scores.total || 0), 0);
  const classAverage = evaluations.length > 0 ? (totalSum / evaluations.length).toFixed(1) : "N/A";

  const isAuthorizedReviewer =
    role === "admin" ||
    role === "faculty_advisor" ||
    (role === "student_coordinator" && user?.club_id === activity.club_id);

  const handleOpenScore = (sub: Submission) => {
    setScoringSubmission(sub);
    const existing = evaluations.find((e) => e.submission_id === sub.id);
    if (existing) {
      setRubricScores(existing.rubric_scores);
      setFeedback(existing.feedback || "");
    } else {
      setRubricScores({ content: 8, presentation: 8, participation: 8, total: 8.0 });
      setFeedback("");
    }
  };

  const handleSaveScore = (isPublished: boolean) => {
    if (!scoringSubmission || !user) return;

    appStore.evaluateSubmission({
      submissionId: scoringSubmission.id,
      evaluator: user,
      rubricScores,
      feedback,
      isPublished,
    });

    toast.success(
      isPublished
        ? "Score published! Student can now view result."
        : "Draft score saved! Hidden from student until batch publish."
    );
    setScoringSubmission(null);
  };

  const handlePublishAll = () => {
    if (!user) return;
    const count = appStore.publishActivityEvaluations(activity.id, user);
    toast.success(`Published ${count} evaluations! Activity marked as EVALUATED.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div>
        <Link
          href="/activities"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Activities
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-navy-800 bg-navy-900/90 p-6 gradient-border-top shadow-glass">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                {activity.club_name}
              </span>
              <span className="text-muted-foreground text-xs">&bull;</span>
              <span className="text-xs text-muted-foreground font-mono">
                {formatDate(activity.club_day_date)}
              </span>
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-white">
              Rubric Evaluation: {activity.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Topic: <strong>{activity.topic}</strong> &bull; Deliverable: {activity.deliverable_spec || "Standard Project"}
            </p>
          </div>

          {isAuthorizedReviewer && draftCount > 0 && (
            <Button
              variant="gradient"
              onClick={handlePublishAll}
              className="gap-2 shrink-0 shadow-glow"
            >
              <Send className="h-4 w-4" /> Publish All Scores ({draftCount})
            </Button>
          )}
        </div>

        {/* Evaluation Metrics Row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-navy-800/80 pt-4 text-xs">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-mono block">Submissions</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5">{submissions.length} Total</span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-mono block">Scored / Pending</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5">
              {scoredCount} Scored ({submissions.length - scoredCount} Pending)
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-mono block">Visibility</span>
            <span className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
              {publishedCount} Published &bull; {draftCount} Draft
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase font-mono block">Class Average</span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> {classAverage} / 10
            </span>
          </div>
        </div>
      </div>

      {/* Evaluation Queue Table */}
      <Card className="border-navy-800 bg-navy-900/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span>Student Submission & Evaluation Queue</span>
            <span className="text-xs text-muted-foreground font-normal">
              Scores remain strictly hidden from students until published
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              No submissions uploaded yet for this activity.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Deliverable</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => {
                  const ev = evaluations.find((e) => e.submission_id === sub.id);
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-semibold text-white">{sub.user_name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {sub.student_id || "ID-Pending"}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        {sub.file_name ? (
                          <span className="flex items-center gap-1 font-mono text-cyan-300">
                            <FileText className="h-3.5 w-3.5" /> {sub.file_name}
                          </span>
                        ) : (
                          <a
                            href={sub.link_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 font-mono text-cyan-300 hover:underline"
                          >
                            <Link2 className="h-3.5 w-3.5" /> Link &rarr;
                          </a>
                        )}
                        {sub.is_late && (
                          <Badge variant="warning" className="text-[9px] uppercase font-mono mt-0.5">
                            Late
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        v{sub.version}
                      </TableCell>

                      <TableCell className="font-mono font-bold text-xs">
                        {ev ? (
                          <span className="text-cyan-400">
                            {ev.rubric_scores.total} / 10
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {ev ? (
                          ev.is_published ? (
                            <Badge variant="success" className="text-[10px] gap-1">
                              <Eye className="h-2.5 w-2.5" /> Published
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-300">
                              <EyeOff className="h-2.5 w-2.5" /> Draft (Hidden)
                            </Badge>
                          )
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Not Scored
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {isAuthorizedReviewer && (
                          <Button
                            size="sm"
                            variant={ev ? "secondary" : "gradient"}
                            onClick={() => handleOpenScore(sub)}
                            className="h-8 text-xs"
                          >
                            {ev ? "Edit Score" : "Grade"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Interactive Rubric Scoring Modal */}
      {scoringSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setScoringSubmission(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1">
              Grade Deliverable: {scoringSubmission.user_name}
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Score across standard 0-10 rubrics. Scores remain hidden from students until published.
            </p>

            <div className="space-y-4">
              {/* Deliverable preview summary */}
              <div className="rounded-xl border border-navy-800 bg-navy-950/60 p-3 text-xs flex items-center justify-between">
                <span>Submitted File:</span>
                <span className="font-mono text-cyan-300">
                  {scoringSubmission.file_name || scoringSubmission.link_url}
                </span>
              </div>

              {/* Rubric 1: Content Mastery */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>1. Content Mastery & Technical Rigor (40%)</span>
                  <span className="font-mono text-cyan-400 text-sm">{rubricScores.content} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={rubricScores.content}
                  onChange={(e) => {
                    const c = parseFloat(e.target.value);
                    const total = parseFloat(((c + rubricScores.presentation + rubricScores.participation) / 3).toFixed(1));
                    setRubricScores({ ...rubricScores, content: c, total });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Rubric 2: Presentation Quality */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>2. Presentation & Architecture Clarity (30%)</span>
                  <span className="font-mono text-cyan-400 text-sm">{rubricScores.presentation} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={rubricScores.presentation}
                  onChange={(e) => {
                    const p = parseFloat(e.target.value);
                    const total = parseFloat(((rubricScores.content + p + rubricScores.participation) / 3).toFixed(1));
                    setRubricScores({ ...rubricScores, presentation: p, total });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Rubric 3: Participation & Effort */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>3. Engagement & Timeliness (30%)</span>
                  <span className="font-mono text-cyan-400 text-sm">{rubricScores.participation} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={rubricScores.participation}
                  onChange={(e) => {
                    const part = parseFloat(e.target.value);
                    const total = parseFloat(((rubricScores.content + rubricScores.presentation + part) / 3).toFixed(1));
                    setRubricScores({ ...rubricScores, participation: part, total });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Calculated Total Score */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Weighted Total Grade:</span>
                <span className="font-heading font-extrabold text-xl text-cyan-400 font-mono">
                  {rubricScores.total} / 10
                </span>
              </div>

              {/* Written Feedback */}
              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Written Feedback & Recommendations
                </label>
                <Textarea
                  placeholder="Commendations on code quality, error handling suggestions, or notes on presentation..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-navy-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setScoringSubmission(null)}
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleSaveScore(false)}
                  >
                    Save Draft (Hidden)
                  </Button>
                  <Button
                    type="button"
                    variant="gradient"
                    onClick={() => handleSaveScore(true)}
                  >
                    Publish Score
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
