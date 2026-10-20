import { TRACK_STACK_FAQS, type TrackStackFAQ } from "./knowledge-base.ts";

export interface StoredMessage {
  id: string;
  conversation_id: string;
  sender: "user" | "lumi";
  content: string;
  tool_calls?: string[];
  deep_links?: { label: string; href: string }[];
  rating?: "up" | "down";
  rating_comment?: string;
  created_at: string;
}

export interface StoredConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  resolved: boolean;
}

export interface LumiSettings {
  enabled: boolean;
  disabled_roles: string[];
  maintenance_message: string;
  max_chars: number;
}

// In-memory singletons for persistence across requests
const conversationsMap = new Map<string, StoredConversation>();
const messagesList: StoredMessage[] = [];
let faqsList: TrackStackFAQ[] = [...TRACK_STACK_FAQS];
let lumiSettings: LumiSettings = {
  enabled: true,
  disabled_roles: [],
  maintenance_message: "Lumi is temporarily undergoing scheduled maintenance. Please check back shortly or visit the FAQ section.",
  max_chars: 500,
};

// Rate limiter tracking maps
const perMinuteLimitMap = new Map<string, { count: number; resetAt: number }>();
const perDayLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkLumiRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
  const now = Date.now();

  // 1. Minute check: 20 msgs / 60 seconds
  const minRecord = perMinuteLimitMap.get(identifier);
  if (minRecord && now < minRecord.resetAt) {
    if (minRecord.count >= 20) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((minRecord.resetAt - now) / 1000),
        reason: "Rate limit exceeded (max 20 messages per minute). Please slow down.",
      };
    }
    minRecord.count++;
  } else {
    perMinuteLimitMap.set(identifier, { count: 1, resetAt: now + 60_000 });
  }

  // 2. Day check: 200 msgs / 24 hours
  const dayRecord = perDayLimitMap.get(identifier);
  if (dayRecord && now < dayRecord.resetAt) {
    if (dayRecord.count >= 200) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((dayRecord.resetAt - now) / 1000),
        reason: "Daily limit exceeded (max 200 messages per day).",
      };
    }
    dayRecord.count++;
  } else {
    perDayLimitMap.set(identifier, { count: 1, resetAt: now + 24 * 60 * 60_000 });
  }

  return { allowed: true };
}

// Conversations & Messages
export function getOrCreateConversation(userId: string): StoredConversation {
  for (const conv of conversationsMap.values()) {
    if (conv.user_id === userId && !conv.resolved) {
      return conv;
    }
  }

  const newId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newConv: StoredConversation = {
    id: newId,
    user_id: userId,
    title: "Support Chat",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved: false,
  };
  conversationsMap.set(newId, newConv);
  return newConv;
}

export function saveMessage(params: {
  conversation_id: string;
  sender: "user" | "lumi";
  content: string;
  tool_calls?: string[];
  deep_links?: { label: string; href: string }[];
}): StoredMessage {
  const msg: StoredMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversation_id: params.conversation_id,
    sender: params.sender,
    content: params.content,
    tool_calls: params.tool_calls,
    deep_links: params.deep_links,
    created_at: new Date().toISOString(),
  };

  messagesList.push(msg);

  const conv = conversationsMap.get(params.conversation_id);
  if (conv) {
    conv.updated_at = msg.created_at;
  }

  return msg;
}

export function getConversationMessages(conversationId: string): StoredMessage[] {
  return messagesList.filter((m) => m.conversation_id === conversationId);
}

export function getUserChatHistory(userId: string): StoredMessage[] {
  const userConvs = new Set(
    Array.from(conversationsMap.values())
      .filter((c) => c.user_id === userId)
      .map((c) => c.id)
  );

  return messagesList.filter((m) => userConvs.has(m.conversation_id));
}

export function clearUserChatHistory(userId: string): void {
  const convIdsToDelete = new Set<string>();
  for (const [id, c] of conversationsMap.entries()) {
    if (c.user_id === userId) {
      convIdsToDelete.add(id);
      conversationsMap.delete(id);
    }
  }

  for (let i = messagesList.length - 1; i >= 0; i--) {
    if (convIdsToDelete.has(messagesList[i].conversation_id)) {
      messagesList.splice(i, 1);
    }
  }
}

export function rateAnswer(messageId: string, rating: "up" | "down", comment?: string): boolean {
  const msg = messagesList.find((m) => m.id === messageId);
  if (!msg) return false;
  msg.rating = rating;
  if (comment) msg.rating_comment = comment;
  return true;
}

// Settings
export function getLumiSettings(): LumiSettings {
  return lumiSettings;
}

export function updateLumiSettings(partial: Partial<LumiSettings>): LumiSettings {
  lumiSettings = { ...lumiSettings, ...partial };
  return lumiSettings;
}

// FAQs Management
export function getLumiFaqs(): TrackStackFAQ[] {
  return faqsList;
}

export function addLumiFaq(faq: Omit<TrackStackFAQ, "id">): TrackStackFAQ {
  const newFaq: TrackStackFAQ = {
    ...faq,
    id: `faq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  faqsList.unshift(newFaq);
  return newFaq;
}

export function updateLumiFaq(id: string, updates: Partial<TrackStackFAQ>): TrackStackFAQ | null {
  const index = faqsList.findIndex((f) => f.id === id);
  if (index === -1) return null;
  faqsList[index] = { ...faqsList[index], ...updates };
  return faqsList[index];
}

export function deleteLumiFaq(id: string): boolean {
  const index = faqsList.findIndex((f) => f.id === id);
  if (index === -1) return false;
  faqsList.splice(index, 1);
  return true;
}

export function importFaqsFromCsv(csvText: string): { imported: number; errors: string[] } {
  const lines = csvText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return { imported: 0, errors: ["Empty or invalid CSV file"] };

  let imported = 0;
  const errors: string[] = [];

  // Expected headers: question,answer,category,roles,active
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.replace(/^"|"$/g, "").trim());
    if (parts.length >= 3) {
      const [question, answer, category, rolesStr, activeStr] = parts;
      const roles = rolesStr ? rolesStr.split(";").map((r) => r.trim()) : ["student", "coordinator", "advisor", "campus_manager", "admin"];
      const active = activeStr ? activeStr.toLowerCase() === "true" || activeStr === "1" : true;

      addLumiFaq({
        question,
        answer,
        category: category as any,
        roles,
        keywords: question.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
        active,
      });
      imported++;
    } else {
      errors.push(`Line ${i + 1}: Insufficient columns`);
    }
  }

  return { imported, errors };
}

// Analytics
export function getLumiAnalytics() {
  const totalMessages = messagesList.length;
  const userMessages = messagesList.filter((m) => m.sender === "user");
  const lumiMessages = messagesList.filter((m) => m.sender === "lumi");

  const upvotes = lumiMessages.filter((m) => m.rating === "up").length;
  const downvotes = lumiMessages.filter((m) => m.rating === "down").length;

  const downratedAnswers = lumiMessages
    .filter((m) => m.rating === "down")
    .map((m) => {
      // Find previous user message
      const idx = messagesList.indexOf(m);
      const userQ = idx > 0 && messagesList[idx - 1].sender === "user" ? messagesList[idx - 1].content : "Unknown Query";
      return {
        message_id: m.id,
        user_query: userQ,
        lumi_response: m.content,
        comment: m.rating_comment,
        timestamp: m.created_at,
      };
    });

  // Top query categories inferred from keywords
  const categoryCounts: Record<string, number> = {
    checkin: 0,
    membership: 0,
    submissions: 0,
    evaluations: 0,
    certificates: 0,
    duty_leave: 0,
    events: 0,
    general: 0,
  };

  userMessages.forEach((msg) => {
    const text = msg.content.toLowerCase();
    if (text.includes("qr") || text.includes("check-in") || text.includes("attendance")) categoryCounts.checkin++;
    else if (text.includes("club") || text.includes("join") || text.includes("limit")) categoryCounts.membership++;
    else if (text.includes("submit") || text.includes("assignment") || text.includes("upload")) categoryCounts.submissions++;
    else if (text.includes("score") || text.includes("grade") || text.includes("rubric")) categoryCounts.evaluations++;
    else if (text.includes("certificate") || text.includes("transcript")) categoryCounts.certificates++;
    else if (text.includes("duty leave") || text.includes("od")) categoryCounts.duty_leave++;
    else if (text.includes("event") || text.includes("hackathon") || text.includes("gambade")) categoryCounts.events++;
    else categoryCounts.general++;
  });

  return {
    total_conversations: conversationsMap.size,
    total_user_queries: userMessages.length,
    upvotes,
    downvotes,
    satisfaction_rate: upvotes + downvotes > 0 ? `${Math.round((upvotes / (upvotes + downvotes)) * 100)}%` : "100%",
    category_breakdown: categoryCounts,
    downrated_answers: downratedAnswers,
  };
}
