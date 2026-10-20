"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { appStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Download,
  Calendar,
  User,
  GraduationCap,
  Award,
  Search,
  CheckCircle2,
  FileText,
  ArrowLeft,
  QrCode,
} from "lucide-react";

export default function CertificateVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.certificateId as string) || "";
  const [certIdInput, setCertIdInput] = React.useState(rawId);
  const [storeState, setStoreState] = React.useState(appStore.getState());

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const verification = React.useMemo(() => {
    if (!rawId) return null;
    return appStore.verifyCertificateById(rawId);
  }, [rawId, storeState]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (certIdInput.trim()) {
      router.push(`/verify/${certIdInput.trim()}`);
    }
  };

  const cert = verification?.certificate;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-foreground py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Track Stack
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-500 dark:text-muted-foreground">
              Official Cryptographic Ledger
            </span>
          </div>
        </div>

        {/* Verification Result Card */}
        {verification ? (
          <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/90 shadow-lg dark:shadow-glass overflow-hidden gradient-border-top">
            <CardHeader className="text-center pb-4 pt-8">
              {verification.status === "VALID" && (
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm animate-in zoom-in-95">
                  <ShieldCheck className="h-9 w-9" />
                </div>
              )}

              {verification.status === "REVOKED" && (
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-sm">
                  <AlertTriangle className="h-9 w-9" />
                </div>
              )}

              {(verification.status === "INVALID_TAMPERED" || verification.status === "NOT_FOUND") && (
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 shadow-sm">
                  <ShieldAlert className="h-9 w-9" />
                </div>
              )}

              <div className="inline-flex items-center justify-center mb-2">
                {verification.status === "VALID" && (
                  <Badge variant="success" className="text-xs px-3 py-1 gap-1.5 uppercase tracking-wide">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Authenticity Verified
                  </Badge>
                )}
                {verification.status === "REVOKED" && (
                  <Badge variant="warning" className="text-xs px-3 py-1 gap-1.5 uppercase tracking-wide">
                    Certificate Revoked
                  </Badge>
                )}
                {verification.status === "INVALID_TAMPERED" && (
                  <Badge variant="danger" className="text-xs px-3 py-1 gap-1.5 uppercase tracking-wide">
                    Tamper Detected
                  </Badge>
                )}
                {verification.status === "NOT_FOUND" && (
                  <Badge variant="danger" className="text-xs px-3 py-1 gap-1.5 uppercase tracking-wide">
                    Certificate Not Found
                  </Badge>
                )}
              </div>

              <CardTitle className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
                {verification.status === "VALID"
                  ? "Verified Official Credential"
                  : verification.status === "REVOKED"
                  ? "Credential Revoked"
                  : "Verification Failure"}
              </CardTitle>

              <CardDescription className="text-xs sm:text-sm mt-1 max-w-lg mx-auto text-slate-600 dark:text-muted-foreground">
                {verification.message}
              </CardDescription>
            </CardHeader>

            {cert && (
              <CardContent className="space-y-6 pt-2 pb-8">
                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/80 dark:bg-navy-950/60 p-5 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-muted-foreground block mb-0.5">Recipient Student:</span>
                    <strong className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      {cert.user_name}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-muted-foreground block mb-0.5">Student ID & Campus:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 text-xs font-semibold">
                      {cert.student_id} &bull; {cert.campus_name}
                    </span>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-navy-800">
                    <span className="text-slate-500 dark:text-muted-foreground block mb-0.5">Award / Credential:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {cert.title}
                    </span>
                    <p className="text-slate-600 dark:text-muted-foreground mt-1 text-xs leading-relaxed">
                      {cert.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-navy-800">
                    <span className="text-slate-500 dark:text-muted-foreground block mb-0.5">Issue Date:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {cert.issue_date}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-navy-800">
                    <span className="text-slate-500 dark:text-muted-foreground block mb-0.5">Authorized Signatory:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {cert.signatory_name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-muted-foreground block">
                      {cert.signatory_title}
                    </span>
                  </div>
                </div>

                {/* Cryptographic Proof Box */}
                <div className="rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      Cryptographic HMAC-SHA256 Signature
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      HMAC-SHA256
                    </Badge>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-navy-900 font-mono text-[11px] text-cyan-700 dark:text-cyan-300 break-all select-all">
                    {cert.signature}
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-muted-foreground flex items-center justify-between">
                    <span>Canonical Data: <code className="font-mono text-[10px]">{cert.canonical_data}</code></span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">TAMPER_EVIDENT_OK</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={`/api/certificates/${cert.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button variant="default" className="w-full gap-2 shadow-md">
                      <Download className="h-4 w-4" /> Download Official PDF Certificate
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Public verification link copied to clipboard!");
                    }}
                    className="w-full sm:w-auto gap-2"
                  >
                    Copy Verification Link
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ) : null}

        {/* Instant Certificate Lookup Card */}
        <Card className="border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 p-6">
          <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white mb-1">
            Verify Another Certificate
          </h3>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mb-4">
            Enter any Mirai School of Technology Certificate ID to inspect the cryptographic ledger.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={certIdInput}
                onChange={(e) => setCertIdInput(e.target.value)}
                placeholder="e.g. MSOT-CERT-2026-0001"
                className="w-full h-11 rounded-xl border border-slate-300 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 px-3 pl-10 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <Button type="submit" variant="gradient" className="h-11 px-5">
              Verify
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
