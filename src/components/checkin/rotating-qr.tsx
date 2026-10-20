"use client";

import * as React from "react";
import QRCode from "qrcode";
import { appStore } from "@/lib/store";
import { CheckinSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Minimize2, Users, Clock, ShieldCheck, X } from "lucide-react";

interface RotatingQRProps {
  session: CheckinSession;
  onCloseSession: () => void;
  isFullScreenDefault?: boolean;
}

export function RotatingQR({
  session,
  onCloseSession,
  isFullScreenDefault = false,
}: RotatingQRProps) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(25);
  const [currentOtp, setCurrentOtp] = React.useState<string>(session.current_otp);
  const [isFullScreen, setIsFullScreen] = React.useState<boolean>(isFullScreenDefault);
  const [checkedInCount, setCheckedInCount] = React.useState<number>(session.checked_in_count || 0);

  // Subscribe to store updates for live counter
  React.useEffect(() => {
    return appStore.subscribe(() => {
      const refreshed = appStore.getCheckinSession(session.id);
      if (refreshed) {
        setCheckedInCount(refreshed.checked_in_count || 0);
      }
    });
  }, [session.id]);

  // Refresh QR token every 25 seconds
  const refreshCode = React.useCallback(() => {
    const refreshed = appStore.refreshSessionTokenAndOtp(session.id);
    if (refreshed) {
      setCurrentOtp(refreshed.otp);
      QRCode.toDataURL(refreshed.token, {
        width: 450,
        margin: 1.5,
        color: {
          dark: "#060B18",
          light: "#FFFFFF",
        },
      }).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [session.id]);

  // Initial QR code generation
  React.useEffect(() => {
    if (session.current_token) {
      QRCode.toDataURL(session.current_token, {
        width: 450,
        margin: 1.5,
        color: {
          dark: "#060B18",
          light: "#FFFFFF",
        },
      }).then((url) => {
        setQrDataUrl(url);
      });
    } else {
      refreshCode();
    }
  }, [session.current_token, refreshCode]);

  // 1-second interval countdown timer
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          refreshCode();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshCode]);

  // Calculate circular stroke offset
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (secondsRemaining / 25) * circumference;

  return (
    <div
      className={
        isFullScreen
          ? "fixed inset-0 z-50 flex flex-col items-center justify-between p-6 md:p-10 bg-navy-950/95 backdrop-blur-2xl animate-in fade-in"
          : "flex flex-col items-center justify-center p-6 rounded-2xl border border-navy-800 bg-navy-900/90 shadow-glass"
      }
    >
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h3 className="font-heading font-bold text-white text-base md:text-lg">
              Live Check-In Window: {session.club_name}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {session.club_day_title} &bull; Anti-Proxy Rotating QR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="h-9 w-9 rounded-xl border-navy-800 bg-navy-900 text-muted-foreground hover:text-white"
            title={isFullScreen ? "Exit Fullscreen" : "Project Fullscreen"}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onCloseSession}
            className="text-xs"
          >
            Close Window
          </Button>
        </div>
      </div>

      {/* Center QR Display & Countdown */}
      <div className="flex flex-col items-center my-auto">
        <div className="relative p-4 rounded-3xl bg-white shadow-glow-lg border-4 border-cyan-400/40">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan Check-in QR"
              className={isFullScreen ? "w-72 h-72 md:w-96 md:h-96 object-contain rounded-xl" : "w-64 h-64 object-contain rounded-xl"}
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-xs text-navy-950 font-mono">
              Generating Cryptographic QR...
            </div>
          )}

          {/* Center TS Logo Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-2xl bg-navy-950 border-2 border-cyan-400 p-2 shadow-2xl flex items-center justify-center">
            <img src="/logos/track-stack-mark.png" alt="TS" className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Rotation Timer Ring & Code */}
        <div className="mt-6 flex items-center gap-6">
          {/* Countdown SVG Ring */}
          <div className="flex items-center gap-2 rounded-2xl border border-navy-800 bg-navy-950/80 px-4 py-2">
            <div className="relative h-10 w-10 flex items-center justify-center">
              <svg className="h-10 w-10 -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  stroke="#1F2A4D"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  stroke="#22D3EE"
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute font-mono text-xs font-bold text-cyan-400 tabular-nums">
                {secondsRemaining}s
              </span>
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                Rotation Interval
              </span>
              <span className="text-xs text-white font-medium">Screenshots Invalid</span>
            </div>
          </div>

          {/* 6-Digit One-Time Code Backup */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2">
            <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-wider">
              6-Digit Check-in Code
            </span>
            <span className="font-heading text-2xl md:text-3xl font-extrabold tracking-widest text-white tabular-nums">
              {currentOtp}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Live Metrics */}
      <div className="w-full max-w-2xl mt-4 flex items-center justify-between border-t border-navy-800 pt-4 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="gradient" className="font-mono text-xs px-3 py-1 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <strong className="text-white">{checkedInCount}</strong> Members Checked In
          </Badge>
          {session.geo_enabled && (
            <Badge variant="outline" className="border-amber-400/40 text-amber-300 text-[10px]">
              Campus Geofence (300m) Active
            </Badge>
          )}
        </div>

        <span className="text-muted-foreground font-mono text-[11px] flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> HMAC-SHA256 Signed
        </span>
      </div>
    </div>
  );
}
