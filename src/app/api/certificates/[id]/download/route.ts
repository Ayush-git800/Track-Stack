import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import { generateCertificatePdf } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cert = appStore.getCertificateById(id);

  if (!cert) {
    return NextResponse.json(
      { error: `Certificate #${id} not found in official registry.` },
      { status: 404 }
    );
  }

  const origin = request.nextUrl.origin || "http://localhost:3000";
  const pdfBytes = await generateCertificatePdf(cert, origin);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cert.id}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
