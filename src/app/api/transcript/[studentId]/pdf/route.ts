import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import { generateTranscriptPdf } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const transcriptData = appStore.getStudentTranscriptData(studentId);

  if (!transcriptData) {
    return NextResponse.json(
      { error: `Student profile #${studentId} not found.` },
      { status: 404 }
    );
  }

  const pdfBytes = await generateTranscriptPdf(transcriptData);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Transcript-${transcriptData.student_id}.pdf"`,
      "Cache-Control": "public, max-age=1800",
    },
  });
}
