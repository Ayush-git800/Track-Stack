import { NextRequest, NextResponse } from "next/server";
import {
  getLumiSettings,
  updateLumiSettings,
  getLumiAnalytics,
} from "@/lib/lumi/storage";

export async function GET() {
  const settings = getLumiSettings();
  const analytics = getLumiAnalytics();
  return NextResponse.json({ settings, analytics });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = updateLumiSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update settings" }, { status: 500 });
  }
}
