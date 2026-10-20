import { NextRequest, NextResponse } from "next/server";
import { rateAnswer } from "@/lib/lumi/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, rating, comment } = body;

    if (!messageId || !rating || (rating !== "up" && rating !== "down")) {
      return NextResponse.json({ error: "Invalid rating payload" }, { status: 400 });
    }

    const success = rateAnswer(messageId, rating, comment);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to record rating" }, { status: 500 });
  }
}
