// src/app/api/reports/[id]/csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import { generateCsvString } from "@/lib/export";

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

  const headers = ["Metric", "Value", "Raw Data Source"];
  const rows = [
    ["Report ID", report.id, "System UUID"],
    ["Club Name", report.club_name, "clubs.name"],
    ["Campus", report.campus_name, "campuses.name"],
    ["Month", report.month, "Cycle"],
    ["Total Members", report.total_members, "COUNT(club_members) WHERE status = 'approved'"],
    ["Total Club Days", report.total_club_days, "COUNT(club_days) in month"],
    ["Total Verified Attendances", report.total_attendances, "COUNT(attendances) WHERE status = 'present'"],
    ["Attendance Rate (%)", report.attendance_rate, "(total_attendances / (total_members * total_club_days)) * 100"],
    ["Submissions Count", report.submissions_count, "COUNT(submissions)"],
    ["Evaluated Submissions", report.evaluated_count, "COUNT(evaluations)"],
    ["Average Rubric Score", report.average_score, "AVG(evaluations.rubric_scores.total)"],
    ["Generated At", report.generated_at, "UTC Timestamp"],
  ];

  const csvContent = generateCsvString(headers, rows);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${report.club_name.toLowerCase().replace(/\s+/g, "-")}-${report.month.toLowerCase().replace(/\s+/g, "-")}.csv"`,
    },
  });
}
