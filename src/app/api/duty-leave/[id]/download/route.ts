import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import { generateDutyLeavePdf } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const leaves = appStore.getDutyLeaves();
  const leave = leaves.find((dl) => dl.id === id);

  if (!leave) {
    return NextResponse.json(
      { error: `Duty Leave order #${id} not found.` },
      { status: 404 }
    );
  }

  const origin = request.nextUrl.origin || "http://localhost:3000";
  const pdfBytes = await generateDutyLeavePdf(leave, origin);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Duty-Leave-${leave.id}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
