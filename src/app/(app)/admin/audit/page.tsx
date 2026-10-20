"use client";

import * as React from "react";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ShieldAlert, Download, Search, Filter, Eye, FileText, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { downloadCsv, generateTabularReportPdf } from "@/lib/export";
import { toast } from "sonner";

export default function AuditLogPage() {
  const { role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [actionCategory, setActionCategory] = React.useState<string>("all");
  const [selectedLog, setSelectedLog] = React.useState<any | null>(null);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  if (role !== "admin") {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Audit logs are strictly restricted to System Administrators.
        </p>
      </div>
    );
  }

  const rawLogs = storeState.auditLogs;

  const filteredLogs = rawLogs.filter((log) => {
    // Action category filter
    if (actionCategory !== "all") {
      const act = log.action.toUpperCase();
      if (actionCategory === "corrections" && !act.includes("ATTENDANCE") && !act.includes("CORRECT")) return false;
      if (actionCategory === "roles" && !act.includes("ROLE") && !act.includes("USER") && !act.includes("MEMBER")) return false;
      if (actionCategory === "scores" && !act.includes("EVALUAT") && !act.includes("SCORE") && !act.includes("PUBLISH")) return false;
      if (actionCategory === "certificates" && !act.includes("CERT")) return false;
      if (actionCategory === "settings" && !act.includes("SETTING")) return false;
      if (actionCategory === "duty_leave" && !act.includes("DUTY_LEAVE")) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAct = log.action.toLowerCase().includes(q);
      const matchActor = (log.user_name || "").toLowerCase().includes(q);
      const matchEntity = (log.entity_type || "").toLowerCase().includes(q);
      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
      if (!matchAct && !matchActor && !matchEntity && !matchDetails) return false;
    }

    return true;
  });

  const handleExportCsv = () => {
    const headers = ["Timestamp", "Action", "Entity Type", "Entity ID", "Actor", "Details"];
    const rows = filteredLogs.map((l) => [
      l.created_at,
      l.action,
      l.entity_type,
      l.entity_id || "",
      l.user_name || "System",
      JSON.stringify(l.details || {}),
    ]);
    downloadCsv(`audit-log-${new Date().toISOString().substring(0, 10)}.csv`, headers, rows);
    toast.success(`Exported ${filteredLogs.length} audit records to CSV.`);
  };

  const handleExportPdf = async () => {
    const headers = ["Timestamp", "Action", "Entity", "Actor", "Payload Summary"];
    const rows = filteredLogs.slice(0, 80).map((l) => [
      l.created_at.substring(0, 19).replace("T", " "),
      l.action,
      l.entity_type,
      l.user_name || "System",
      JSON.stringify(l.details || {}).substring(0, 35),
    ]);

    const pdfBytes = await generateTabularReportPdf({
      title: "System Audit Log Compliance Report",
      subtitle: `Total Records: ${filteredLogs.length}  •  Filter: ${actionCategory.toUpperCase()}`,
      headers,
      rows,
    });

    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-report-${new Date().toISOString().substring(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Generated official Audit Log PDF report.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-red-500/30 text-red-500 font-mono text-[10px]">
              Immutable Compliance Trail
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">MSOT Official Ledger</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            System Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-muted-foreground mt-1">
            Filterable, immutable record of attendance corrections, role promotions, score publications, certificates, and settings changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 border-slate-200 dark:border-navy-800 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleExportPdf}
            className="gap-1.5 text-xs font-semibold shadow-glow"
          >
            <FileText className="h-3.5 w-3.5" /> Export PDF Report
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action, actor, or entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: "all", label: "All Actions" },
              { id: "corrections", label: "Attendance Corrections" },
              { id: "roles", label: "Roles & Members" },
              { id: "scores", label: "Scores & Evaluations" },
              { id: "certificates", label: "Certificates" },
              { id: "settings", label: "Settings" },
              { id: "duty_leave", label: "Duty Leaves" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActionCategory(cat.id)}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                  actionCategory === cat.id
                    ? "bg-cyan-500 text-navy-950 shadow-sm font-bold"
                    : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-navy-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-500" />
              Recorded Ledger ({filteredLogs.length} Records)
            </CardTitle>
            <CardDescription className="text-xs">
              Every administrative change writes before/after state to this tamper-proof trail.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-muted-foreground">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Entity</th>
                  <th className="pb-3 font-semibold">Actor</th>
                  <th className="pb-3 font-semibold">Payload Summary</th>
                  <th className="pb-3 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No audit records match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-900/50">
                      <td className="py-3 font-mono text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] uppercase font-bold tracking-tight"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 font-mono text-muted-foreground">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.substring(0, 8)})` : ""}
                      </td>
                      <td className="py-3 font-medium text-foreground">
                        {log.user_name || "System"}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-muted-foreground hover:text-foreground transition-colors"
                          title="View Full Payload"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-850 pb-3">
              <div>
                <h3 className="font-bold text-foreground text-sm">Audit Record Details</h3>
                <p className="text-xs font-mono text-muted-foreground">{selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-navy-850">
                <span className="text-muted-foreground">Action:</span>
                <span className="font-mono font-bold text-foreground">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-navy-850">
                <span className="text-muted-foreground">Actor:</span>
                <span className="font-medium text-foreground">{selectedLog.user_name || "System"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-navy-850">
                <span className="text-muted-foreground">Timestamp:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                  {formatDateTime(selectedLog.created_at)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-navy-850">
                <span className="text-muted-foreground">Entity:</span>
                <span className="font-mono text-foreground">
                  {selectedLog.entity_type} {selectedLog.entity_id ? `(${selectedLog.entity_id})` : ""}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-foreground">Before/After Payload:</div>
              <pre className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <Button
              onClick={() => setSelectedLog(null)}
              variant="secondary"
              className="w-full text-xs"
            >
              Close Record
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
