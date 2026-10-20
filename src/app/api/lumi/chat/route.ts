import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import type { UserProfile } from "@/lib/types";
import { getLumiProvider, type LumiMessage } from "@/lib/lumi/provider";
import {
  checkLumiRateLimit,
  getLumiSettings,
  getOrCreateConversation,
  saveMessage,
} from "@/lib/lumi/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      user: clientUser,
      currentPage = "/dashboard",
      conversationId,
      isPreLogin = false,
      history = [],
    } = body;

    // 1. Settings check: Is Lumi enabled globally or for this role?
    const settings = getLumiSettings();
    if (!settings.enabled) {
      return NextResponse.json(
        {
          error: "maintenance",
          text: settings.maintenance_message,
          deepLinks: [{ label: "Help & FAQs", href: "/help" }],
        },
        { status: 503 }
      );
    }

    if (clientUser?.role && settings.disabled_roles.includes(clientUser.role)) {
      return NextResponse.json(
        {
          error: "disabled_for_role",
          text: `Lumi is currently disabled for ${clientUser.role} accounts.`,
          deepLinks: [{ label: "Help & FAQs", href: "/help" }],
        },
        { status: 403 }
      );
    }

    // 2. Rate Limiting Check: max 20/min, 200/day
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateKey = isPreLogin || !clientUser?.id ? `ip-${clientIp}` : `user-${clientUser.id}`;

    const rateResult = checkLumiRateLimit(rateKey);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          error: "rate_limited",
          text: `⏳ ${rateResult.reason || "Rate limit reached. Please wait a moment."}`,
          retryAfter: rateResult.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 3. Validate & sanitize message length (500 chars limit)
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message text" }, { status: 400 });
    }
    const sanitizedInput = message.trim().slice(0, settings.max_chars || 500);

    // 4. Authenticate & strictly verify user (prevent user ID spoofing)
    let validatedUser: UserProfile | null = null;
    if (!isPreLogin && clientUser?.id) {
      const state = appStore.getState();
      const existing = state.students.find((s) => s.id === clientUser.id);
      if (existing) {
        validatedUser = existing;
      } else {
        // Fallback for valid demo roles
        validatedUser = clientUser as UserProfile;
      }
    }

    // 5. Manage Conversation & Persistence
    const userId = validatedUser ? validatedUser.id : `guest-${clientIp}`;
    const conversation = conversationId
      ? { id: conversationId }
      : getOrCreateConversation(userId);

    // Save incoming user message
    saveMessage({
      conversation_id: conversation.id,
      sender: "user",
      content: sanitizedInput,
    });

    // 6. Build prompt message history
    const messageHistory: LumiMessage[] = (history || []).map((h: any) => ({
      role: h.sender === "user" ? "user" : "assistant",
      content: h.content,
    }));
    messageHistory.push({ role: "user", content: sanitizedInput });

    // 7. Invoke Provider (Gemini or scored Knowledge Base fallback)
    const provider = getLumiProvider();
    const result = await provider.generateResponse({
      messages: messageHistory,
      user: validatedUser,
      currentPage,
    });

    // Save assistant reply
    const savedReply = saveMessage({
      conversation_id: conversation.id,
      sender: "lumi",
      content: result.text,
      tool_calls: result.toolCallsMade,
      deep_links: result.deepLinks,
    });

    return NextResponse.json({
      text: result.text,
      deepLinks: result.deepLinks,
      provider: result.providerUsed,
      toolCalls: result.toolCallsMade,
      canEscalate: result.canEscalate,
      messageId: savedReply.id,
      conversationId: conversation.id,
    });
  } catch (error: any) {
    console.error("[Lumi Chat API Error]:", error);
    return NextResponse.json(
      {
        text: "I encountered a brief hiccup while processing your request. Please try again in a few moments.",
        deepLinks: [{ label: "Help & FAQs", href: "/help" }],
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
