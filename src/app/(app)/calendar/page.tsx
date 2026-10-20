"use client";

import * as React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { ClubDay } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ClubLogo } from "@/components/ui/club-logo";
import { toast } from "sonner";
import {
  CalendarDays,
  ListFilter,
  UploadCloud,
  Plus,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CalendarPage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [viewMode, setViewMode] = React.useState<"calendar" | "list">("calendar");
  const [selectedCampus, setSelectedCampus] = React.useState("c1111111-1111-1111-1111-111111111111");

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [csvText, setCsvText] = React.useState("");
  const [parsedRows, setParsedRows] = React.useState<
    Array<{ date: string; title: string; academic_term: string; isValid: boolean; error?: string }>
  >([]);

  // Manual Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newDay, setNewDay] = React.useState({
    date: "",
    title: "",
    academic_term: "Fall 2026",
    status: "scheduled" as ClubDay["status"],
  });

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const clubDays = appStore.getClubDays(selectedCampus);
  const allActivities = storeState.activities;
  const isAdminOrManager = role === "admin" || role === "campus_manager";

  // CSV parser & validator
  const handleParseCsv = (content: string) => {
    setCsvText(content);
    const lines = content.trim().split("\n");
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const rows = lines.slice(1).map((line, idx) => {
      const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      const date = parts[0] || "";
      const title = parts[1] || "";
      const academic_term = parts[2] || "Fall 2026";

      // Validation
      let isValid = true;
      let error = "";

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        isValid = false;
        error = "Invalid date format. Expected YYYY-MM-DD.";
      } else if (!title) {
        isValid = false;
        error = "Title cannot be empty.";
      }

      return { date, title, academic_term, isValid, error };
    });

    setParsedRows(rows);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }

    const formatted = validRows.map((r) => ({
      campus_id: selectedCampus,
      date: r.date,
      title: r.title,
      academic_term: r.academic_term,
      status: "scheduled" as ClubDay["status"],
    }));

    appStore.importClubDays(formatted, user || undefined);
    toast.success(`Successfully imported ${validRows.length} Club Days!`);
    setIsImportModalOpen(false);
    setCsvText("");
    setParsedRows([]);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDay.date || !newDay.title) {
      toast.error("Please fill in both Date and Title");
      return;
    }

    appStore.addClubDay(
      {
        campus_id: selectedCampus,
        date: newDay.date,
        title: newDay.title,
        academic_term: newDay.academic_term,
        status: newDay.status,
      },
      user || undefined
    );

    toast.success(`Added Club Day: ${newDay.title}`);
    setIsAddModalOpen(false);
    setNewDay({ date: "", title: "", academic_term: "Fall 2026", status: "scheduled" });
  };

  const sampleCsv = `Date,Title,AcademicTerm
2026-11-21,Club Day #5: Winter Showcase,Fall 2026
2026-11-28,Club Day #6: Inter-Society Hackathon,Fall 2026
2026-12-05,Club Day #7: Annual Evaluation & Certificates,Fall 2026`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Club Day Calendar
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Official collegiate Saturday Club Day schedule and activity timelines.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-navy-800 bg-navy-900 p-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "calendar"
                  ? "bg-navy-800 text-cyan-400 shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-navy-800 text-cyan-400 shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              List View
            </button>
          </div>

          {isAdminOrManager && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleParseCsv(sampleCsv);
                  setIsImportModalOpen(true);
                }}
                className="gap-1.5 border-navy-800"
              >
                <UploadCloud className="h-4 w-4" /> Import CSV/Excel
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Club Day
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Calendar / List Render */}
      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {clubDays.map((cd, index) => {
            const dayActivities = allActivities.filter((a) => a.club_day_id === cd.id);
            return (
              <Card
                key={cd.id}
                className="flex flex-col justify-between border-navy-800 bg-navy-900/80 hover:border-navy-700 transition-all group overflow-hidden"
                gradientBorder={cd.status === "active"}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                      Week {index + 1}
                    </span>
                    <Badge
                      variant={
                        cd.status === "active"
                          ? "gradient"
                          : cd.status === "announced"
                          ? "info"
                          : "outline"
                      }
                      className="text-[10px] uppercase font-mono"
                    >
                      {cd.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold group-hover:text-cyan-400 transition-colors">
                    {cd.title}
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1.5 text-white font-medium mt-1">
                    <CalendarDays className="h-3.5 w-3.5 text-cyan-400" />
                    {formatDate(cd.date)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="rounded-xl border border-navy-800 bg-navy-950/60 p-3 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-2">
                      <span>Planned Sessions:</span>
                      <strong className="text-white font-mono">{dayActivities.length} Clubs</strong>
                    </div>

                    {dayActivities.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">
                        No activities planned yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {dayActivities.slice(0, 3).map((act) => (
                          <div
                            key={act.id}
                            className="flex items-center justify-between text-[11px] bg-navy-900/80 p-1.5 rounded-lg border border-navy-800"
                          >
                            <span className="text-white truncate font-medium max-w-[130px]">
                              {act.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] uppercase font-mono py-0 px-1"
                            >
                              {act.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>

                <div className="p-5 pt-0 border-t border-navy-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {cd.academic_term}
                  </span>
                  <Link
                    href={`/activities`}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    View Sessions &rarr;
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card className="border-navy-800 bg-navy-900/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Club Days Schedule</CardTitle>
            <CardDescription className="text-xs">
              Complete chronological schedule for Delhi-NCR Campus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Club Day Title</TableHead>
                  <TableHead>Academic Term</TableHead>
                  <TableHead>Active Activities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubDays.map((cd) => {
                  const actCount = allActivities.filter((a) => a.club_day_id === cd.id).length;
                  return (
                    <TableRow key={cd.id}>
                      <TableCell className="font-mono text-cyan-400 font-semibold text-xs">
                        {formatDate(cd.date)}
                      </TableCell>
                      <TableCell className="font-semibold text-white">{cd.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cd.academic_term}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {actCount} planned
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={cd.status === "active" ? "gradient" : "outline"}
                          className="text-[10px] uppercase font-mono"
                        >
                          {cd.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/activities`}
                          className="text-xs text-cyan-400 hover:underline"
                        >
                          View Activities &rarr;
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Manual Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-xl font-bold text-white mb-1">
              Add New Club Day
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Schedule a Saturday Club Day session for student activity planning
            </p>

            <form onSubmit={handleManualAdd} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Date (Saturday) *
                </label>
                <Input
                  type="date"
                  value={newDay.date}
                  onChange={(e) => setNewDay({ ...newDay, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Club Day Title *
                </label>
                <Input
                  value={newDay.title}
                  onChange={(e) => setNewDay({ ...newDay, title: e.target.value })}
                  placeholder="e.g. Club Day #5: Autumn Demos"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Academic Term
                </label>
                <Input
                  value={newDay.academic_term}
                  onChange={(e) => setNewDay({ ...newDay, academic_term: e.target.value })}
                  placeholder="Fall 2026"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient">
                  Schedule Club Day
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV / Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-white">
                  Import Club Days from CSV / Excel
                </h3>
                <p className="text-xs text-muted-foreground">
                  Paste or upload comma-separated values for bulk scheduling
                </p>
              </div>
            </div>

            <div className="space-y-4 my-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    CSV Content (Date, Title, AcademicTerm)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleParseCsv(sampleCsv)}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Load Sample CSV
                  </button>
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  className="w-full h-28 rounded-xl border border-navy-800 bg-navy-950/80 p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  placeholder="Date,Title,AcademicTerm&#10;2026-11-21,Club Day #5,Fall 2026"
                />
              </div>

              {/* Row-Level Validation Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      Validation Preview ({parsedRows.filter((r) => r.isValid).length} of {parsedRows.length} valid)
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-navy-800">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedRows.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs text-white">
                              {r.date}
                            </TableCell>
                            <TableCell className="text-xs">{r.title}</TableCell>
                            <TableCell>
                              {r.isValid ? (
                                <Badge variant="success" className="text-[10px]">
                                  Valid
                                </Badge>
                              ) : (
                                <Badge variant="danger" className="text-[10px]">
                                  {r.error}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsImportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="gradient"
                onClick={handleConfirmImport}
                disabled={parsedRows.filter((r) => r.isValid).length === 0}
              >
                Confirm & Import {parsedRows.filter((r) => r.isValid).length} Rows
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
