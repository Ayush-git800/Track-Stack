"use client";

import * as React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Attendance } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClubLogo } from "@/components/ui/club-logo";
import { toast } from "sonner";
import {
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Camera,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function StudentCheckinPage() {
  const { user } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [mode, setMode] = React.useState<"camera" | "code">("code");
  const [manualCode, setManualCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Result state
  const [checkinResult, setCheckinResult] = React.useState<{
    success: boolean;
    message: string;
    attendance?: Attendance;
    flags?: { late: boolean; geoDistance?: number; deviceReuse: boolean };
  } | null>(null);

  // Geo & Device details
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  // Fetch current geolocation
  React.useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Fallback to campus coordinate in development if GPS denied
          setUserLocation({ lat: 28.4595, lng: 77.0266 });
          setGeoError("Using campus GPS coordinates fallback.");
        },
        { timeout: 5000 }
      );
    } else {
      setUserLocation({ lat: 28.4595, lng: 77.0266 });
    }
  }, []);

  // Find active sessions for clubs the student belongs to
  const studentMemberships = user ? appStore.getStudentMemberships(user.id) : [];
  const approvedClubIds = studentMemberships
    .filter((m) => m.status === "approved")
    .map((m) => m.club_id);

  const activeSessions = storeState.checkinSessions.filter(
    (s) => s.status === "active" && approvedClubIds.includes(s.club_id)
  );

  const primarySession = activeSessions[0] || storeState.checkinSessions.find((s) => s.status === "active");

  const handleProcessCheckin = (tokenOrCode: { token?: string; code?: string }) => {
    if (!user) {
      toast.error("Please sign in to check in");
      return;
    }
    if (!primarySession) {
      toast.error("No active check-in session found for your enrolled clubs.");
      return;
    }

    setIsSubmitting(true);

    const deviceFingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}`;

    const res = appStore.studentCheckin({
      token: tokenOrCode.token,
      code: tokenOrCode.code,
      clubId: primarySession.club_id,
      clubDayId: primarySession.club_day_id,
      student: user,
      userLocation: userLocation || undefined,
      deviceFingerprint,
      ip: "127.0.0.1",
    });

    setCheckinResult(res);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleSimulateScan = () => {
    if (!primarySession) {
      toast.error("No active session running to simulate.");
      return;
    }
    if (!primarySession.current_token) {
      toast.error("Session token not generated yet.");
      return;
    }
    handleProcessCheckin({ token: primarySession.current_token });
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || manualCode.length < 6) {
      toast.error("Please enter the 6-digit one-time code.");
      return;
    }
    handleProcessCheckin({ code: manualCode.trim() });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 mb-2">
          Verified Attendance Scanner
        </Badge>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Club Day Check-In
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Scan the rotating QR code projected in your club room or enter the 6-digit one-time code.
        </p>
      </div>

      {/* Result Display Screen */}
      {checkinResult ? (
        <Card
          className={
            checkinResult.success
              ? "glass-card border-emerald-500/40 gradient-border-top p-6 text-center animate-in zoom-in-95"
              : "glass-card border-red-500/40 p-6 text-center animate-in zoom-in-95"
          }
        >
          <div
            className={
              checkinResult.success
                ? "h-16 w-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-glow"
                : "h-16 w-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4"
            }
          >
            {checkinResult.success ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <AlertCircle className="h-8 w-8" />
            )}
          </div>

          <h3 className="font-heading text-xl font-bold text-white">
            {checkinResult.success
              ? checkinResult.flags?.late
                ? "Attendance Verified (Late)"
                : "Attendance Verified (Present)"
              : "Check-In Verification Failed"}
          </h3>

          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            {checkinResult.message}
          </p>

          {checkinResult.success && checkinResult.attendance && (
            <div className="mt-6 rounded-xl border border-navy-800 bg-navy-950/70 p-4 text-xs text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Club:</span>
                <span className="font-semibold text-white">
                  {checkinResult.attendance.club_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Timestamp:</span>
                <span className="font-mono text-cyan-400">
                  {new Date(checkinResult.attendance.checked_in_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verification Method:</span>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {checkinResult.attendance.checkin_method}
                </Badge>
              </div>
              {checkinResult.attendance.distance_meters !== undefined && checkinResult.attendance.distance_meters !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Geofence Distance:</span>
                  <span className="font-mono text-emerald-400">
                    {checkinResult.attendance.distance_meters}m from campus
                  </span>
                </div>
              )}
              {checkinResult.attendance.device_reuse_flag && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-[11px] text-amber-300">
                  ⚠ Note: Device fingerprint was shared with another student. Attendance flagged for coordinator review.
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCheckinResult(null);
                setManualCode("");
              }}
            >
              Scan Again
            </Button>
            <Link href="/dashboard">
              <Button variant="gradient" size="sm">
                Go to Dashboard &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Input & Scanning Form */
        <Card className="glass-card gradient-border-top p-6">
          {/* Active Session Indicator */}
          {primarySession ? (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 mb-6 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <div>
                  <span className="font-semibold text-white block">
                    Active Window: {primarySession.club_name}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {primarySession.club_day_title}
                  </span>
                </div>
              </div>
              <Badge variant="gradient" className="text-[10px] font-mono">
                Window Open
              </Badge>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 mb-6 text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>No active check-in window detected right now. Ask your coordinator to start the check-in session.</span>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setMode("code")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                mode === "code"
                  ? "bg-navy-800 text-cyan-400 border border-navy-700 shadow-sm"
                  : "bg-navy-950/60 text-muted-foreground hover:text-white"
              }`}
            >
              <KeyRound className="h-4 w-4" /> 6-Digit Code
            </button>

            <button
              onClick={() => setMode("camera")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                mode === "camera"
                  ? "bg-navy-800 text-cyan-400 border border-navy-700 shadow-sm"
                  : "bg-navy-950/60 text-muted-foreground hover:text-white"
              }`}
            >
              <Camera className="h-4 w-4" /> Camera Scanner
            </button>
          </div>

          {/* Tab 1: Manual 6-Digit Code */}
          {mode === "code" && (
            <form onSubmit={handleManualCodeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5 text-center">
                  Enter Rotating 6-Digit One-Time Code
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="h-14 text-center font-heading text-2xl tracking-widest font-extrabold text-cyan-400"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground text-center mt-1.5 font-mono">
                  Code changes every 25 seconds on the coordinator screen
                </p>
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11"
                disabled={isSubmitting || manualCode.length < 6}
              >
                {isSubmitting ? "Verifying Token..." : "Verify & Check In"}
              </Button>
            </form>
          )}

          {/* Tab 2: Camera Scanner View / Simulator */}
          {mode === "camera" && (
            <div className="space-y-4 text-center">
              <div className="relative mx-auto h-56 w-56 rounded-2xl border-2 border-dashed border-cyan-400/60 bg-navy-950 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                <QrCode className="h-16 w-16 text-cyan-400/50 mb-2" />
                <span className="text-[11px] text-muted-foreground font-mono px-4">
                  Point camera at the rotating QR display
                </span>
                {/* Scanner corner markers */}
                <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400" />
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleSimulateScan}
                  className="w-full h-11"
                  disabled={isSubmitting || !primarySession}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Simulate QR Scan (Read Live Token)
                </Button>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Simulates instant camera frame capture and HMAC-SHA256 verification
                </p>
              </div>
            </div>
          )}

          {/* Verification Parameters Notice */}
          <div className="mt-6 border-t border-navy-800 pt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Tamper-Proof HMAC
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" /> Anti-Screenshot Expiry
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" /> GPS Geofence Check
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-cyan-400" /> Device Reuse Flagging
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
