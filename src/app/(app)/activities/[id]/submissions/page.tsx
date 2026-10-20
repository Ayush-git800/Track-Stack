"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Submission } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Link2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function ActivitySubmissionsPage() {
  const params = useParams();
  const { user } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());

  const activityId = params.id as string;
  const activity = appStore.getActivityById(activityId);

  // Form state
  const [submissionType, setSubmissionType] = React.useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

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

  // Submissions for this activity by current student
  const studentSubmissions = user
    ? appStore.getSubmissions(activity.id, user.id).sort((a, b) => b.version - a.version)
    : [];

  const latestSubmission = studentSubmissions[0];
  const isPastDeadline = activity.submission_deadline
    ? Date.now() > new Date(activity.submission_deadline).getTime()
    : false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedExts = [".pdf", ".pptx", ".ppt", ".docx", ".png", ".jpg", ".jpeg", ".zip"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      if (!allowedExts.includes(ext)) {
        toast.error(`Invalid file format. Allowed types: ${allowedExts.join(", ")}`);
        return;
      }

      const maxSizeMb = storeState.settings.submission_rules.max_size_mb || 25;
      if (file.size > maxSizeMb * 1024 * 1024) {
        toast.error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds allowed limit of ${maxSizeMb} MB`);
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit");
      return;
    }

    if (submissionType === "file" && !selectedFile) {
      toast.error("Please select a deliverable file to upload");
      return;
    }
    if (submissionType === "link" && !linkUrl.trim()) {
      toast.error("Please provide a repository or project link URL");
      return;
    }

    setIsUploading(true);

    // Sanitize filename: remove special characters, replace spaces with hyphens
    const sanitizedFileName = selectedFile
      ? selectedFile.name.toLowerCase().replace(/[^a-z0-9.]/g, "-")
      : undefined;

    const res = appStore.submitDeliverable({
      activityId: activity.id,
      student: user,
      fileName: sanitizedFileName,
      fileSize: selectedFile?.size,
      fileType: selectedFile?.type,
      fileUrl: selectedFile ? `/storage/submissions/${sanitizedFileName}` : undefined,
      linkUrl: submissionType === "link" ? linkUrl : undefined,
      notes,
    });

    setIsUploading(false);

    if (res.success) {
      toast.success(res.message);
      setSelectedFile(null);
      setLinkUrl("");
      setNotes("");
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <Link
          href="/activities"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Activities
        </Link>
      </div>

      {/* Activity Deliverable Banner */}
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
              {activity.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Topic: <strong>{activity.topic}</strong> &bull; Venue: {activity.venue}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] uppercase font-mono text-muted-foreground block">
              Submission Deadline
            </span>
            <span
              className={`text-xs font-semibold font-mono flex items-center sm:justify-end gap-1.5 mt-0.5 ${
                isPastDeadline ? "text-amber-400" : "text-cyan-400"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {activity.submission_deadline
                ? formatDateTime(activity.submission_deadline)
                : "48 hours post-session"}
            </span>
            {isPastDeadline && (
              <Badge variant="warning" className="text-[9px] uppercase font-mono mt-1">
                Deadline Passed (Late Allowed)
              </Badge>
            )}
          </div>
        </div>

        {/* Deliverable Spec */}
        {activity.deliverable_spec && (
          <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 text-xs text-cyan-300">
            <strong>Required Deliverable:</strong> {activity.deliverable_spec}
          </div>
        )}
      </div>

      {/* Upload & Submission Form */}
      <Card className="border-navy-800 bg-navy-900/80">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span>
              {latestSubmission ? `Submit Revision (Version ${latestSubmission.version + 1})` : "Submit Deliverable"}
            </span>
            {latestSubmission && (
              <Badge variant="outline" className="text-xs font-mono">
                Current Version: v{latestSubmission.version}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Supports PPT, PPTX, PDF, DOCX, PNG, JPG, ZIP (max 25 MB) or public repository link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSubmissionType("file")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                  submissionType === "file"
                    ? "bg-navy-800 text-cyan-400 border border-navy-700 shadow-sm"
                    : "bg-navy-950/60 text-muted-foreground hover:text-white"
                }`}
              >
                <UploadCloud className="h-4 w-4" /> Upload File
              </button>

              <button
                type="button"
                onClick={() => setSubmissionType("link")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                  submissionType === "link"
                    ? "bg-navy-800 text-cyan-400 border border-navy-700 shadow-sm"
                    : "bg-navy-950/60 text-muted-foreground hover:text-white"
                }`}
              >
                <Link2 className="h-4 w-4" /> Link URL (GitHub / Figma)
              </button>
            </div>

            {/* File Upload Box */}
            {submissionType === "file" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Deliverable File *
                </label>
                <div className="relative border-2 border-dashed border-navy-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center bg-navy-950/60 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.pptx,.ppt,.docx,.png,.jpg,.jpeg,.zip"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="h-10 w-10 text-cyan-400/60 mx-auto mb-2" />
                  <p className="text-xs text-white font-medium">
                    {selectedFile ? selectedFile.name : "Drag and drop or click to choose file"}
                  </p>
                  <span className="text-[11px] text-muted-foreground font-mono mt-1 block">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(0)} KB &bull; Ready to upload`
                      : "PDF, PPTX, DOCX, ZIP, PNG, JPG (up to 25 MB)"}
                  </span>
                </div>
              </div>
            )}

            {/* Link Input */}
            {submissionType === "link" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Project or Repository Link URL *
                </label>
                <Input
                  type="url"
                  placeholder="https://github.com/alex-msot/microservices-lab"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="font-mono"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Student Notes / Instructions for Evaluator (Optional)
              </label>
              <Textarea
                placeholder="Mention branch name, test instructions, or specific challenges tackled..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-11"
              disabled={isUploading}
            >
              {isUploading ? "Uploading to Cloud Storage..." : latestSubmission ? "Submit New Version" : "Submit Deliverable"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Version History List */}
      {studentSubmissions.length > 0 && (
        <Card className="border-navy-800 bg-navy-900/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-cyan-400" />
              Submission Version History ({studentSubmissions.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Every revision is archived with immutable timestamp and evaluation status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-xl border border-navy-800 bg-navy-950/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-white text-sm">
                      Version {sub.version}
                    </span>
                    {sub.is_late ? (
                      <Badge variant="warning" className="text-[10px] uppercase font-mono">
                        Late
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px] uppercase font-mono">
                        On Time
                      </Badge>
                    )}
                    {sub.evaluation?.is_published && (
                      <Badge variant="gradient" className="text-[10px] font-mono">
                        Score: {sub.evaluation.rubric_scores.total} / 10
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
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
                        <Link2 className="h-3.5 w-3.5" /> {sub.link_url}
                      </a>
                    )}
                  </div>

                  {sub.notes && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">
                      "{sub.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-muted-foreground block">
                    {formatDateTime(sub.submitted_at)}
                  </span>
                  {sub.evaluation?.is_published ? (
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Evaluated by {sub.evaluation.evaluator_name}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      In Evaluation Queue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
