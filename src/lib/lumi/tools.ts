import { appStore } from "../store.ts";
import type { UserProfile } from "../types.ts";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "OBJECT";
    properties: Record<string, { type: "STRING" | "NUMBER" | "BOOLEAN"; description: string }>;
    required?: string[];
  };
}

export interface DeepLink {
  label: string;
  href: string;
}

export interface ToolExecutionResult {
  toolName: string;
  data: any;
  deepLinks: DeepLink[];
}

export const LUMI_TOOLS: ToolDefinition[] = [
  {
    name: "get_my_clubs",
    description: "Get the list of clubs the currently logged-in student/user is an approved member of.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_my_join_requests",
    description: "Get the current user's club membership requests and their status (pending, waitlisted, approved, rejected).",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_next_club_days",
    description: "Get upcoming scheduled Club Days and sessions for the user's clubs or campus.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_my_attendance_summary",
    description: "Get the student's overall attendance statistics: total sessions, attended, absent, late, excused, and attendance percentage.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "explain_my_checkin_status",
    description: "Explain the attendance and check-in status for a specific Club Day or recent sessions (why marked late, absent, or flagged).",
    parameters: {
      type: "OBJECT",
      properties: {
        club_day_id: {
          type: "STRING",
          description: "Optional specific Club Day ID to explain. If omitted, checks the most recent session.",
        },
      },
    },
  },
  {
    name: "get_my_pending_submissions_and_deadlines",
    description: "Get pending assignments, submission deadlines, and status of recent submissions for the student.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_my_scores",
    description: "Get the student's published activity scores, rubrics, and feedback.",
    parameters: {
      type: "OBJECT",
      properties: {
        club_id: {
          type: "STRING",
          description: "Optional club ID to filter scores.",
        },
      },
    },
  },
  {
    name: "get_my_certificates",
    description: "Get all verified certificates awarded to the student (participation and achievement) with verification links.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_my_event_registrations",
    description: "Get campus and inter-college events the student is currently registered for, including team info.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_my_duty_leave_status",
    description: "Get the status of Duty Leave requests submitted for inter-college events (pending, approved, rejected).",
    parameters: {
      type: "OBJECT",
      properties: {
        event_id: {
          type: "STRING",
          description: "Optional event ID to filter duty leave status.",
        },
      },
    },
  },
  {
    name: "get_membership_limit",
    description: "Get the maximum number of clubs allowed for the student, current active count, and remaining slots.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_club_pending_join_requests",
    description: "For Coordinators/Advisors: View pending membership applications for their club.",
    parameters: {
      type: "OBJECT",
      properties: {
        club_id: {
          type: "STRING",
          description: "Optional club ID. If omitted, uses coordinator's club.",
        },
      },
    },
  },
  {
    name: "get_club_upcoming_activity_status",
    description: "For Coordinators/Advisors: View upcoming activity planning status, submissions count, and check-in readiness.",
    parameters: {
      type: "OBJECT",
      properties: {
        club_id: {
          type: "STRING",
          description: "Optional club ID.",
        },
      },
    },
  },
];

/**
 * Execute a read-only tool strictly scoped to the authenticated user
 */
export async function executeLumiTool(
  toolName: string,
  args: Record<string, any> = {},
  user: UserProfile | null
): Promise<ToolExecutionResult> {
  const state = appStore.getState();
  const deepLinks: DeepLink[] = [];

  if (!user) {
    return {
      toolName,
      data: { error: "Authentication required to access personal data." },
      deepLinks: [{ label: "Sign In", href: "/login" }],
    };
  }

  const userId = user.id;

  switch (toolName) {
    case "get_my_clubs": {
      const myMemberships = state.memberships.filter(
        (m) => m.user_id === userId && m.status === "approved"
      );
      const clubs = myMemberships.map((m) => {
        const club = state.clubs.find((c) => c.id === m.club_id);
        const isCoord = club?.coordinators?.includes(userId);
        return {
          club_id: m.club_id,
          club_name: club?.name ?? "Unknown Club",
          club_code: club?.code,
          category: club?.category,
          joined_at: m.joined_at,
          role_in_club: isCoord ? "coordinator" : "member",
        };
      });

      if (clubs.length === 0) {
        deepLinks.push({ label: "Browse Clubs", href: "/clubs" });
      } else {
        clubs.forEach((c) => {
          deepLinks.push({ label: `Open ${c.club_name}`, href: `/clubs/${c.club_id}` });
        });
      }

      return {
        toolName,
        data: {
          approved_clubs_count: clubs.length,
          clubs,
        },
        deepLinks: deepLinks.slice(0, 3),
      };
    }

    case "get_my_join_requests": {
      const myRequests = state.memberships
        .filter((m) => m.user_id === userId)
        .map((m) => {
          const club = state.clubs.find((c) => c.id === m.club_id);
          return {
            club_id: m.club_id,
            club_name: club?.name ?? "Unknown Club",
            status: m.status,
            requested_at: m.joined_at,
          };
        });

      deepLinks.push({ label: "Browse Clubs", href: "/clubs" });

      return {
        toolName,
        data: { requests: myRequests },
        deepLinks,
      };
    }

    case "get_next_club_days": {
      const myClubIds = new Set(
        state.memberships
          .filter((m) => m.user_id === userId && m.status === "approved")
          .map((m) => m.club_id)
      );

      const now = new Date().toISOString();
      const upcoming = state.clubDays
        .filter((cd) => cd.date >= now.slice(0, 10))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5)
        .map((cd) => {
          const relatedAct = state.activities.find((a) => a.club_day_id === cd.id && myClubIds.has(a.club_id));
          const club = relatedAct ? state.clubs.find((c) => c.id === relatedAct.club_id) : null;
          return {
            club_day_id: cd.id,
            club_id: relatedAct?.club_id,
            club_name: club?.name ?? "Mirai Clubs",
            date: cd.date,
            title: cd.title || "Club Session",
            status: cd.status,
          };
        });

      if (upcoming.length > 0 && upcoming[0].club_id) {
        deepLinks.push({ label: "Open Check-in", href: `/clubs/${upcoming[0].club_id}/checkin` });
      } else {
        deepLinks.push({ label: "Check-in Hub", href: "/checkin" });
      }

      return {
        toolName,
        data: { upcoming_sessions: upcoming },
        deepLinks,
      };
    }

    case "get_my_attendance_summary": {
      const attendances = state.attendances.filter((a) => a.user_id === userId);
      const total = attendances.length;
      const present = attendances.filter((a) => a.status === "present").length;
      const late = attendances.filter((a) => a.status === "late").length;
      const excused = attendances.filter((a) => a.status === "excused").length;
      const absent = attendances.filter((a) => a.status === "absent").length;
      const attendedCount = present + late;
      const percentage = total > 0 ? Math.round((attendedCount / total) * 100) : 100;

      deepLinks.push({ label: "Download Transcript", href: "/transcript" });

      return {
        toolName,
        data: {
          total_sessions: total,
          present,
          late,
          excused,
          absent,
          effective_attendance_count: attendedCount,
          attendance_percentage: `${percentage}%`,
        },
        deepLinks,
      };
    }

    case "explain_my_checkin_status": {
      const clubDayId = args.club_day_id;
      let record = state.attendances.find((a) => a.user_id === userId && (!clubDayId || a.club_day_id === clubDayId));

      if (!record && !clubDayId) {
        // take latest attendance record
        record = [...state.attendances]
          .filter((a) => a.user_id === userId)
          .sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime())[0];
      }

      if (!record) {
        return {
          toolName,
          data: { message: "No attendance record found for this session or user." },
          deepLinks: [{ label: "Open Check-in", href: "/clubs" }],
        };
      }

      const club = state.clubs.find((c) => c.id === record?.club_id);
      const clubDay = state.clubDays.find((cd) => cd.id === record?.club_day_id);

      if (club) {
        deepLinks.push({ label: "Open Check-in", href: `/clubs/${club.id}/checkin` });
      }

      return {
        toolName,
        data: {
          club_name: club?.name,
          date: clubDay?.date,
          status: record.status,
          checked_in_at: record.checked_in_at,
          method: record.checkin_method,
          distance_meters: record.distance_meters ?? "Geo-check passed / not required",
          flagged: record.device_reuse_flag || record.is_late,
          flag_reason: record.correction_reason ?? (record.is_late ? "Checked in after window grace period" : null),
          correction_reason: record.correction_reason,
        },
        deepLinks,
      };
    }

    case "get_my_pending_submissions_and_deadlines": {
      const myClubIds = new Set(
        state.memberships
          .filter((m) => m.user_id === userId && m.status === "approved")
          .map((m) => m.club_id)
      );

      const activities = state.activities.filter(
        (act) => myClubIds.has(act.club_id) && act.status !== "draft"
      );

      const mySubmissions = state.submissions.filter((s) => s.user_id === userId);
      const subMap = new Map(mySubmissions.map((s) => [s.activity_id, s]));

      const results = activities.map((act) => {
        const sub = subMap.get(act.id);
        const club = state.clubs.find((c) => c.id === act.club_id);
        return {
          activity_id: act.id,
          club_id: act.club_id,
          club_name: club?.name,
          title: act.title,
          deadline: act.submission_deadline,
          submitted: !!sub,
          submission_version: sub?.version,
          submitted_at: sub?.submitted_at,
          is_late: sub?.is_late,
        };
      });

      const pending = results.filter((r) => !r.submitted);
      if (pending.length > 0) {
        deepLinks.push({
          label: "Submit Assignment",
          href: `/clubs/${pending[0].club_id}/submissions`,
        });
      }

      return {
        toolName,
        data: {
          pending_count: pending.length,
          activities: results,
        },
        deepLinks,
      };
    }

    case "get_my_scores": {
      const clubId = args.club_id;
      const myEvaluations = state.evaluations.filter((ev) => {
        if (!ev.is_published) return false;
        const sub = state.submissions.find((s) => s.id === ev.submission_id);
        if (!sub || sub.user_id !== userId) return false;
        if (clubId) {
          const act = state.activities.find((a) => a.id === sub.activity_id);
          if (act?.club_id !== clubId) return false;
        }
        return true;
      });

      const scores = myEvaluations.map((ev) => {
        const sub = state.submissions.find((s) => s.id === ev.submission_id);
        const act = state.activities.find((a) => a.id === sub?.activity_id);
        const club = state.clubs.find((c) => c.id === act?.club_id);
        return {
          activity_title: act?.title,
          club_name: club?.name,
          rubrics: ev.rubric_scores,
          total_score: (ev.rubric_scores as any)?.overall_score || 0,
          feedback: ev.feedback,
          graded_at: ev.created_at,
        };
      });

      deepLinks.push({ label: "Download Transcript", href: "/transcript" });

      return {
        toolName,
        data: { published_evaluations: scores },
        deepLinks,
      };
    }

    case "get_my_certificates": {
      const myCerts = state.certificates.filter((c) => c.user_id === userId);
      const list = myCerts.map((c) => ({
        certificate_id: c.id,
        type: c.type,
        title: c.title,
        recipient_name: c.user_name,
        issued_date: c.issue_date,
        status: c.status,
        verify_url: `/verify/${c.id}`,
      }));

      deepLinks.push({ label: "View Certificates", href: "/certificates" });
      deepLinks.push({ label: "Download Transcript", href: "/transcript" });

      return {
        toolName,
        data: {
          total_certificates: list.length,
          certificates: list,
        },
        deepLinks,
      };
    }

    case "get_my_event_registrations": {
      const myRegs = state.eventRegistrations.filter((r) => r.user_id === userId);
      const events = myRegs.map((r) => {
        const ev = state.events.find((e) => e.id === r.event_id);
        const team = r.team_id ? state.eventTeams.find((t) => t.id === r.team_id) : null;
        return {
          event_id: r.event_id,
          event_title: ev?.name,
          date: ev?.start_date,
          status: r.status,
          is_team: ev?.mode === "team",
          team_name: team?.name,
        };
      });

      deepLinks.push({ label: "Browse Events", href: "/events" });

      return {
        toolName,
        data: { registrations: events },
        deepLinks,
      };
    }

    case "get_my_duty_leave_status": {
      const eventId = args.event_id;
      const myLeaves = state.dutyLeaves.filter((dl) => {
        if (dl.user_id !== userId) return false;
        if (eventId && dl.event_id !== eventId) return false;
        return true;
      });

      const list = myLeaves.map((dl) => ({
        request_id: dl.id,
        event_name: dl.event_name ?? "Inter-college Event",
        dates: dl.dates,
        status: dl.status,
        approved_at: dl.updated_at,
        rejection_reason: dl.approver_comments,
      }));

      deepLinks.push({ label: "View Duty Leaves", href: "/duty-leave" });

      return {
        toolName,
        data: { duty_leaves: list },
        deepLinks,
      };
    }

    case "get_membership_limit": {
      const activeMemberships = state.memberships.filter(
        (m) => m.user_id === userId && (m.status === "approved" || m.status === "pending")
      );
      const limit = 2; // Standard MSOT limit
      const remaining = Math.max(0, limit - activeMemberships.length);

      deepLinks.push({ label: "Browse Clubs", href: "/clubs" });

      return {
        toolName,
        data: {
          max_allowed: limit,
          active_and_pending_count: activeMemberships.length,
          slots_remaining: remaining,
          can_join_more: remaining > 0,
        },
        deepLinks,
      };
    }

    case "get_club_pending_join_requests": {
      if (user.role !== "student_coordinator" && user.role !== "faculty_advisor" && user.role !== "admin") {
        return {
          toolName,
          data: { error: "Permission denied. Only Coordinators and Advisors can view pending join requests." },
          deepLinks: [],
        };
      }

      const pending = state.memberships.filter((m) => m.status === "pending");
      const list = pending.map((m) => {
        const stu = state.students.find((s) => s.id === m.user_id);
        const club = state.clubs.find((c) => c.id === m.club_id);
        return {
          membership_id: m.id,
          club_id: m.club_id,
          club_name: club?.name,
          student_name: stu?.full_name,
          student_email: stu?.email,
          applied_at: m.joined_at,
        };
      });

      deepLinks.push({ label: "Coordinator Hub", href: "/coordinator" });

      return {
        toolName,
        data: { pending_requests_count: list.length, requests: list },
        deepLinks,
      };
    }

    case "get_club_upcoming_activity_status": {
      if (user.role !== "student_coordinator" && user.role !== "faculty_advisor" && user.role !== "admin") {
        return {
          toolName,
          data: { error: "Permission denied. Only Coordinators and Advisors can view activity status." },
          deepLinks: [],
        };
      }

      const upcomingClubDays = state.clubDays.filter((cd) => cd.status === "active" || cd.status === "scheduled" || cd.status === "announced");

      deepLinks.push({ label: "Coordinator Hub", href: "/coordinator" });

      return {
        toolName,
        data: { upcoming_club_days: upcomingClubDays },
        deepLinks,
      };
    }

    default:
      return {
        toolName,
        data: { error: `Unknown tool: ${toolName}` },
        deepLinks: [],
      };
  }
}
