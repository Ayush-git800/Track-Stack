import { NextRequest, NextResponse } from "next/server";
import {
  getLumiFaqs,
  addLumiFaq,
  updateLumiFaq,
  deleteLumiFaq,
  importFaqsFromCsv,
} from "@/lib/lumi/storage";

export async function GET() {
  const faqs = getLumiFaqs();
  return NextResponse.json({ faqs });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // CSV Import
    if (contentType.includes("text/csv") || contentType.includes("multipart/form-data")) {
      const text = await request.text();
      const result = importFaqsFromCsv(text);
      return NextResponse.json(result);
    }

    const body = await request.json();

    if (body.csv) {
      const result = importFaqsFromCsv(body.csv);
      return NextResponse.json(result);
    }

    const { question, answer, category, roles = ["student"], active = true } = body;
    if (!question || !answer || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const created = addLumiFaq({
      question,
      answer,
      category,
      roles,
      keywords: question.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3),
      active,
    });

    return NextResponse.json({ success: true, faq: created });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create FAQ" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing FAQ ID" }, { status: 400 });
    }

    const updated = updateLumiFaq(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, faq: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update FAQ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing FAQ ID" }, { status: 400 });
    }

    const success = deleteLumiFaq(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete FAQ" }, { status: 500 });
  }
}
