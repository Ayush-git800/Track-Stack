"use client";

import * as React from "react";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { SystemSettings } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  ShieldAlert,
  Save,
  CheckCircle2,
  Clock,
  FileCheck2,
  Users,
  Sparkles,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [settings, setSettings] = React.useState<SystemSettings>(storeState.settings);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  if (role !== "admin") {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Restricted Access</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Only the System Administrator can modify global platform parameters.
        </p>
      </div>
    );
  }

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    appStore.updateSettings(settings, user || undefined);
    toast.success("System settings updated & written to immutable audit log!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
              System Administration
            </Badge>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            System & Policy Configuration
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Configure membership constraints, check-in windows, flow automation, and submission rules.
          </p>
        </div>

        <Button variant="gradient" onClick={handleSaveAll} className="gap-2 shrink-0 shadow-glow">
          <Save className="h-4 w-4" /> Save All Settings
        </Button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* 1. Membership Rules & Limit */}
        <Card className="border-navy-800 bg-navy-900/80 gradient-border-top">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">
                    Student Club Enrolment Limits
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Controls maximum concurrent active memberships allowed per student across all campuses
                  </CardDescription>
                </div>
              </div>
              <Badge variant="gradient" className="font-mono text-xs">
                Active Limit: {settings.membership_rules.max_clubs_per_student} Clubs
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Default Max Clubs Per Student
                </label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={settings.membership_rules.max_clubs_per_student}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      membership_rules: {
                        ...settings.membership_rules,
                        max_clubs_per_student: Number(e.target.value),
                      },
                    })
                  }
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Enforced in UI and via database triggers on <code>public.club_members</code>.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Final Year (Year 4) Limit Override
                </label>
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={settings.membership_rules.year_overrides["4"] ?? 1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      membership_rules: {
                        ...settings.membership_rules,
                        year_overrides: {
                          ...settings.membership_rules.year_overrides,
                          "4": Number(e.target.value),
                        },
                      },
                    })
                  }
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Senior students focus on capstone and placement prep (default 1 club).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Check-in Rules & QR Rotation */}
        <Card className="border-navy-800 bg-navy-900/80">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Club Day Check-In & Rotation Parameters
                </CardTitle>
                <CardDescription className="text-xs">
                  Controls the active check-in window and late attendance grace periods
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Check-In Window (Minutes)
                </label>
                <Input
                  type="number"
                  value={settings.checkin_rules.window_minutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      checkin_rules: {
                        ...settings.checkin_rules,
                        window_minutes: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Default: 45 minutes</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Late Grace Period (Minutes)
                </label>
                <Input
                  type="number"
                  value={settings.checkin_rules.late_grace_minutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      checkin_rules: {
                        ...settings.checkin_rules,
                        late_grace_minutes: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Late flag applied after window</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Rotating QR Code Duration (Seconds)
                </label>
                <Input
                  type="number"
                  value={settings.checkin_rules.qr_rotation_seconds}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      checkin_rules: {
                        ...settings.checkin_rules,
                        qr_rotation_seconds: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Anti-proxy code regeneration</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Club Day Flow Timings */}
        <Card className="border-navy-800 bg-navy-900/80">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Club Day Automation Cadence
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated timeline rules: 7 days plan, 3 days announce, 48h submit, 5 days evaluate
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Plan Lock Deadline
                </label>
                <Input
                  type="number"
                  value={settings.flow_timings.plan_days_before}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      flow_timings: {
                        ...settings.flow_timings,
                        plan_days_before: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Days before session (7 days)</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Announcement Trigger
                </label>
                <Input
                  type="number"
                  value={settings.flow_timings.announce_days_before}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      flow_timings: {
                        ...settings.flow_timings,
                        announce_days_before: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Days before session (3 days)</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Submission Window
                </label>
                <Input
                  type="number"
                  value={settings.flow_timings.submission_hours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      flow_timings: {
                        ...settings.flow_timings,
                        submission_hours: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Hours post-session (48 hours)</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Evaluation Window
                </label>
                <Input
                  type="number"
                  value={settings.flow_timings.evaluation_days}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      flow_timings: {
                        ...settings.flow_timings,
                        evaluation_days: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Days for faculty review (5 days)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Submission Rules & Allowed Types */}
        <Card className="border-navy-800 bg-navy-900/80">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Deliverable & Submission Rules
                </CardTitle>
                <CardDescription className="text-xs">
                  Storage constraints, allowed deliverable formats, and late policies
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Max Deliverable Size (MB)
                </label>
                <Input
                  type="number"
                  value={settings.submission_rules.max_size_mb}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      submission_rules: {
                        ...settings.submission_rules,
                        max_size_mb: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Default: 25 MB</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Late Submissions Allowed
                </label>
                <select
                  value={settings.submission_rules.late_allowed ? "true" : "false"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      submission_rules: {
                        ...settings.submission_rules,
                        late_allowed: e.target.value === "true",
                      },
                    })
                  }
                  className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="true">Allowed (With Penalty)</option>
                  <option value="false">Disallowed (Strict Lock)</option>
                </select>
                <span className="text-[11px] text-muted-foreground mt-1 block">Grace period with auto-tagging</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Authorized Faculty Domains
                </label>
                <Input
                  value={settings.staff_domain_hint.allowed_domains.join(", ")}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      staff_domain_hint: {
                        allowed_domains: e.target.value.split(",").map((s) => s.trim()),
                      },
                    })
                  }
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Comma-separated email domain hints</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-4 border-t border-navy-800">
            <Button type="submit" variant="gradient" className="gap-2">
              <Save className="h-4 w-4" /> Save All Configurations
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
