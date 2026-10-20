import { NextRequest, NextResponse } from "next/server";
import { createSupportRequest, getSupportRequests } from "@/lib/lumi/escalation";
import { appStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, question, lumiSummary, clubId, category } = body;

    if (!userId || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const state = appStore.getState();
    const user = state.students.find((s) => s.id === userId) || {
      id: userId,
      full_name: "Student",
      email: "student@msot.edu",
      role: "student",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      campus_name: "Delhi-NCR Campus",
    };

    const requestRecord = await createSupportRequest({
      user: user as any,
      question,
      lumiSummary,
      clubId,
      category,
    });

    return NextResponse.json({
      success: true,
      supportRequest: requestRecord,
      message: `Your request has been routed to the ${requestRecord.target_role.replace("_", " ")}. You will be notified in-app once reviewed.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to escalate" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || undefined;
  const list = getSupportRequests(userId);
  return NextResponse.json({ supportRequests: list });
}
