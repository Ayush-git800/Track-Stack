import { appStore } from "../store.ts";
import type { UserProfile } from "../types.ts";

export interface SupportRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  club_id?: string;
  campus_id?: string;
  category: string;
  question: string;
  lumi_summary?: string;
  target_role: "coordinator" | "campus_manager" | "admin";
  target_user_id?: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  resolved_at?: string;
  response_notes?: string;
}

// In-memory or fallback support requests storage
const supportRequestsCache: SupportRequest[] = [];

export async function createSupportRequest(params: {
  user: UserProfile;
  question: string;
  lumiSummary?: string;
  clubId?: string;
  category?: string;
}): Promise<SupportRequest> {
  const state = appStore.getState();
  const id = `sr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  let targetRole: "coordinator" | "campus_manager" | "admin" = "campus_manager";
  let targetUserId: string | undefined;

  if (params.clubId) {
    const club = state.clubs.find((c) => c.id === params.clubId);
    if (club?.coordinators && club.coordinators.length > 0) {
      targetRole = "coordinator";
      targetUserId = club.coordinators[0];
    }
  }

  // If no coordinator found or club not specified, route to campus manager
  if (!targetUserId) {
    const campusManager = state.students.find(
      (s) => s.role === "campus_manager" && (!params.user.campus_id || s.campus_id === params.user.campus_id)
    );
    if (campusManager) {
      targetRole = "campus_manager";
      targetUserId = campusManager.id;
    } else {
      const admin = state.students.find((s) => s.role === "admin");
      targetRole = "admin";
      targetUserId = admin?.id;
    }
  }

  const newRequest: SupportRequest = {
    id,
    user_id: params.user.id,
    user_name: params.user.full_name,
    user_email: params.user.email,
    club_id: params.clubId,
    campus_id: params.user.campus_id,
    category: params.category || "General Assistance",
    question: params.question,
    lumi_summary: params.lumiSummary || "Student requested human assistance via Lumi.",
    target_role: targetRole,
    target_user_id: targetUserId,
    status: "open",
    created_at: new Date().toISOString(),
  };

  supportRequestsCache.unshift(newRequest);

  // Create In-App Notification for target user
  if (targetUserId) {
    appStore.createInAppNotification({
      user_id: targetUserId,
      title: `New Support Request from ${params.user.full_name}`,
      message: `Question: "${params.question.slice(0, 100)}..."`,
      type: "reminder",
      link_url: params.clubId ? `/clubs/${params.clubId}` : "/admin/lumi",
    });
  }

  return newRequest;
}

export function getSupportRequests(userId?: string): SupportRequest[] {
  if (!userId) return supportRequestsCache;
  return supportRequestsCache.filter((r) => r.user_id === userId || r.target_user_id === userId);
}
