import { NextRequest, NextResponse } from "next/server";
import {
  getUserChatHistory,
  clearUserChatHistory,
  getOrCreateConversation,
} from "@/lib/lumi/storage";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ messages: [] });
  }

  const messages = getUserChatHistory(userId);
  return NextResponse.json({ messages });
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    clearUserChatHistory(userId);
    return NextResponse.json({ success: true, message: "Chat history cleared successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to clear history" }, { status: 500 });
  }
}
