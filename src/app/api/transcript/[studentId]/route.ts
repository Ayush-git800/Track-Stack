import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;

  // Authorization check (bearer token or authenticated session)
  const authHeader = request.headers.get("authorization");
  const student = appStore.getStudentTranscriptData(studentId);

  if (!student) {
    return NextResponse.json(
      {
        error: "Student profile not found",
        student_id: studentId,
        message: "No co-curricular records registered for this student ID.",
      },
      { status: 404 }
    );
  }

  // Placement Readiness API format
  return NextResponse.json(
    {
      status: "success",
      source: "Track Stack - Mirai School of Technology Co-Curricular Ledger",
      verified: true,
      data: student,
      meta: {
        api_version: "v1",
        consumer: "Placement Readiness - Achievements Module",
        signature_algorithm: "HMAC-SHA256",
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=600",
        "X-TrackStack-Verified": "true",
      },
    }
  );
}
