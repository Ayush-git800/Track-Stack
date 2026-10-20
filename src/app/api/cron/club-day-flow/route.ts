// src/app/api/cron/club-day-flow/route.ts
import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import {
  sendClubDayPlanReminder,
  sendSubmissionReminder,
  sendMonthlyReportNotification,
} from "@/lib/email";

export async function GET(request: NextRequest) {
  return handleCronJob(request);
}

export async function POST(request: NextRequest) {
  return handleCronJob(request);
}

async function handleCronJob(request: NextRequest) {
  // Security: Validate CRON_SECRET from header or query param
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  const expectedSecret = process.env.CRON_SECRET || "mirai-trackstack-cron-secret-2026";
  const providedSecret = authHeader?.replace("Bearer ", "").trim() || querySecret;

  if (providedSecret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET token." },
      { status: 401 }
    );
  }

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const portalOrigin = request.nextUrl.origin || "http://localhost:3000";

  const results: {
    planRemindersSent: number;
    memberAnnouncementsSent: number;
    sessionsClosed: number;
    submissionRemindersSent: number;
    evaluationRemindersSent: number;
    monthlyReportsGenerated: number;
  } = {
    planRemindersSent: 0,
    memberAnnouncementsSent: 0,
    sessionsClosed: 0,
    submissionRemindersSent: 0,
    evaluationRemindersSent: 0,
    monthlyReportsGenerated: 0,
  };

  const state = appStore.getState();
  const settings = state.settings;
  const flowTimings = (settings as any).flow_timings || {
    plan_reminder_days: 7,
    member_announcement_days: 3,
    submission_window_hours: 48,
    evaluation_window_days: 5,
  };

  // ---------------------------------------------------------------------------
  // 1. 7-DAY PLAN REMINDER TO COORDINATOR & REVIEW NUDGE TO ADVISOR
  // ---------------------------------------------------------------------------
  const planReminderKey = `cron-plan-reminders-${todayStr}`;
  if (!appStore.isCronIdempotent(planReminderKey)) {
    const upcomingClubDays = state.clubDays.filter((cd) => {
      const daysUntil = Math.ceil(
        (new Date(cd.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil >= 0 && daysUntil <= flowTimings.plan_reminder_days;
    });

    for (const cd of upcomingClubDays) {
      for (const club of state.clubs) {
        if (club.category === "Parent Society") continue;

        // Check if activity planned
        const plannedAct = state.activities.find(
          (a) => a.club_id === club.id && a.club_day_id === cd.id
        );

        // Find coordinators
        const coordinators = state.memberships.filter(
          (m) => m.club_id === club.id && m.designation?.toLowerCase().includes("coordinator")
        );

        if (!plannedAct) {
          for (const coord of coordinators) {
            const user = state.students.find((s) => s.id === coord.user_id);
            if (user) {
              await sendClubDayPlanReminder(
                user.email,
                user.full_name,
                club.name,
                cd.date.substring(0, 10),
                `${portalOrigin}/activities`
              );
              appStore.createInAppNotification({
                user_id: user.id,
                title: `Action Required: Submit Plan for ${club.name}`,
                message: `Club Day on ${cd.date.substring(0, 10)} is 7 days away. Please submit activity lesson plan.`,
                type: "reminder",
                link_url: "/activities",
              });
              results.planRemindersSent++;
            }
          }
        } else if (plannedAct.status === "submitted") {
          // Nudge advisors if plan is submitted but unreviewed
          const advisorId = club.advisors?.[0];
          const advisor = advisorId ? state.students.find((s) => s.id === advisorId) : null;
          if (advisor) {
            appStore.createInAppNotification({
              user_id: advisor.id,
              title: `Review Nudge: ${club.name} Plan Submitted`,
              message: `Lesson plan for "${plannedAct.title}" awaiting your review.`,
              type: "approval",
              link_url: "/activities",
            });
          }
        }
      }
    }

    appStore.recordCronRun({
      job_name: "plan_reminders",
      idempotency_key: planReminderKey,
      status: "success",
      items_processed: results.planRemindersSent,
      details: { upcomingDaysCount: upcomingClubDays.length },
    });
  }

  // ---------------------------------------------------------------------------
  // 2. 3-DAY ANNOUNCEMENT TO MEMBERS
  // ---------------------------------------------------------------------------
  const announceKey = `cron-3d-announcements-${todayStr}`;
  if (!appStore.isCronIdempotent(announceKey)) {
    const nearClubDays = state.clubDays.filter((cd) => {
      const daysUntil = Math.ceil(
        (new Date(cd.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil >= 0 && daysUntil <= flowTimings.member_announcement_days;
    });

    for (const cd of nearClubDays) {
      for (const club of state.clubs) {
        if (club.category === "Parent Society") continue;
        const members = state.memberships.filter(
          (m) => m.club_id === club.id && m.status === "approved"
        );
        for (const m of members) {
          appStore.createInAppNotification({
            user_id: m.user_id,
            title: `Club Day in 3 Days: ${club.name}`,
            message: `Join ${club.name} this Saturday for ${cd.title}.`,
            type: "reminder",
            link_url: "/calendar",
          });
          results.memberAnnouncementsSent++;
        }
      }
    }

    appStore.recordCronRun({
      job_name: "member_announcements",
      idempotency_key: announceKey,
      status: "success",
      items_processed: results.memberAnnouncementsSent,
      details: { nearDaysCount: nearClubDays.length },
    });
  }

  // ---------------------------------------------------------------------------
  // 3. CHECK-IN WINDOW AUTO-CLOSE
  // ---------------------------------------------------------------------------
  state.checkinSessions.forEach((sess) => {
    if (sess.status === "active" && new Date(sess.expires_at).getTime() < now.getTime()) {
      sess.status = "closed";
      results.sessionsClosed++;
    }
  });

  // ---------------------------------------------------------------------------
  // 4. 48-HOUR SUBMISSION REMINDER TO MEMBERS WHO HAVE NOT SUBMITTED
  // ---------------------------------------------------------------------------
  const subReminderKey = `cron-sub-reminders-${todayStr}`;
  if (!appStore.isCronIdempotent(subReminderKey)) {
    // Find live/announced activities with upcoming submission deadlines
    for (const act of state.activities) {
      if (!act.submission_deadline) continue;
      const hoursUntil =
        (new Date(act.submission_deadline).getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntil > 0 && hoursUntil <= flowTimings.submission_window_hours) {
        const clubMembers = state.memberships.filter(
          (m) => m.club_id === act.club_id && m.status === "approved"
        );

        for (const m of clubMembers) {
          // Check if already submitted
          const hasSubmitted = state.submissions.some(
            (s) => s.activity_id === act.id && s.user_id === m.user_id
          );
          if (!hasSubmitted) {
            const student = state.students.find((s) => s.id === m.user_id);
            if (student) {
              await sendSubmissionReminder(
                student.email,
                student.full_name,
                act.title,
                act.submission_deadline.substring(0, 10),
                `${portalOrigin}/activities`
              );
              appStore.createInAppNotification({
                user_id: student.id,
                title: `Submission Due in 48h: ${act.title}`,
                message: `Please upload your deliverable before ${act.submission_deadline.substring(0, 10)}.`,
                type: "reminder",
                link_url: "/activities",
              });
              results.submissionRemindersSent++;
            }
          }
        }
      }
    }

    appStore.recordCronRun({
      job_name: "submission_reminders",
      idempotency_key: subReminderKey,
      status: "success",
      items_processed: results.submissionRemindersSent,
      details: {},
    });
  }

  // ---------------------------------------------------------------------------
  // 5. 5-DAY EVALUATION REMINDER TO ADVISORS AND COORDINATORS
  // ---------------------------------------------------------------------------
  const evalReminderKey = `cron-eval-reminders-${todayStr}`;
  if (!appStore.isCronIdempotent(evalReminderKey)) {
    const pendingSubmissions = state.submissions.filter((s) => {
      return !state.evaluations.some((e) => e.submission_id === s.id);
    });

    if (pendingSubmissions.length > 0) {
      // Find staff
      const advisors = state.students.filter(
        (s) => s.role === "faculty_advisor" || s.role === "student_coordinator"
      );
      for (const staff of advisors) {
        appStore.createInAppNotification({
          user_id: staff.id,
          title: `Evaluation Queue: ${pendingSubmissions.length} Pending Submissions`,
          message: `Please grade member submissions within the 5-day evaluation grace window.`,
          type: "reminder",
          link_url: "/activities",
        });
        results.evaluationRemindersSent++;
      }
    }

    appStore.recordCronRun({
      job_name: "evaluation_reminders",
      idempotency_key: evalReminderKey,
      status: "success",
      items_processed: results.evaluationRemindersSent,
      details: { pendingCount: pendingSubmissions.length },
    });
  }

  // ---------------------------------------------------------------------------
  // 6. MONTH-END AUTOMATIC REPORT GENERATION FOR ALL CLUBS
  // ---------------------------------------------------------------------------
  const monthName = "October 2026";
  const monthlyReportKey = `cron-monthly-reports-${monthName.toLowerCase().replace(" ", "-")}`;
  if (!appStore.isCronIdempotent(monthlyReportKey)) {
    for (const club of state.clubs) {
      if (club.category === "Parent Society") continue;
      const report = appStore.generateMonthlyReport(club.id, monthName);
      results.monthlyReportsGenerated++;

      // Email notification to Campus Manager
      const managers = state.students.filter((s) => s.role === "campus_manager");
      for (const mgr of managers) {
        await sendMonthlyReportNotification(
          mgr.email,
          mgr.full_name,
          club.name,
          monthName,
          `${portalOrigin}${report.pdf_url}`,
          {
            attendanceRate: report.attendance_rate,
            submissions: report.submissions_count,
            avgScore: report.average_score,
          }
        );
      }
    }

    appStore.recordCronRun({
      job_name: "monthly_reports",
      idempotency_key: monthlyReportKey,
      status: "success",
      items_processed: results.monthlyReportsGenerated,
      details: { month: monthName },
    });
  }

  return NextResponse.json({
    success: true,
    message: "Club Day flow automated tasks completed successfully.",
    timestamp: now.toISOString(),
    results,
  });
}
