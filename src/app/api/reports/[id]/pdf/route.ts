// src/app/api/reports/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import { generateTabularReportPdf } from "@/lib/export";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = appStore.getMonthlyReportById(id);

  if (!report) {
    return NextResponse.json(
      { error: `Monthly report #${id} not found.` },
      { status: 404 }
    );
  }

  const headers = ["Metric", "Value", "Notes / Integrity Basis"];
  const rows = [
    ["Club Name", report.club_name, "Registered campus society"],
    ["Campus", report.campus_name, "Mirai School of Technology"],
    ["Reporting Month", report.month, "Official monthly cycle"],
    ["Total Enrolled Members", report.total_members, "Verified approved club memberships"],
    ["Scheduled Club Days", report.total_club_days, "Saturday sessions in cycle"],
    ["Total Verified Attendances", report.total_attendances, "HMAC-verified QR check-ins"],
    ["Attendance Compliance Rate", `${report.attendance_rate}%`, "Raw attendance / possible seats"],
    ["Deliverables Submitted", report.submissions_count, "Project uploads and links"],
    ["Evaluated Submissions", report.evaluated_count, "Graded by faculty advisors"],
    ["Average Rubric Score", `${report.average_score} / 10`, "Standardized rubric average"],
  ];

  const pdfBytes = await generateTabularReportPdf({
    title: `Monthly Club Report: ${report.club_name}`,
    subtitle: `Period: ${report.month}  •  Status: Verified & Stored`,
    campusName: report.campus_name,
    headers,
    rows,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="report-${report.club_name.toLowerCase().replace(/\s+/g, "-")}-${report.month.toLowerCase().replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
