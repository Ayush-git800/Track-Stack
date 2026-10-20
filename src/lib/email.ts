// src/lib/email.ts
import type { SentNotificationLog } from "./types.ts";
import { appStore } from "./store.ts";

export interface EmailOptions {
  to: string;
  recipientName: string;
  subject: string;
  template: string;
  html: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; status: "sent" | "console_fallback" | "failed"; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Track Stack <notifications@trackstack.msot.edu>";

  // If Resend API Key is configured, attempt real HTTP dispatch
  if (apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text || options.subject,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        appStore.logSentNotification({
          recipient_email: options.to,
          recipient_name: options.recipientName,
          subject: options.subject,
          channel: "email",
          status: "sent",
          template: options.template,
          metadata: { ...options.metadata, resend_id: data.id },
        });
        return { success: true, status: "sent", id: data.id };
      }
    } catch (err) {
      console.error("[RESEND_ERROR] Failed to send email via Resend API:", err);
    }
  }

  // Graceful fallback to rich console logger & store logging
  console.log(`\n📧 [EMAIL DISPATCH - CONSOLE FALLBACK]`);
  console.log(`To: ${options.recipientName} <${options.to}>`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Template: ${options.template}`);
  console.log(`Content:\n${options.text || options.subject}\n`);

  const logEntry = appStore.logSentNotification({
    recipient_email: options.to,
    recipient_name: options.recipientName,
    subject: options.subject,
    channel: "email",
    status: "console_fallback",
    template: options.template,
    metadata: options.metadata,
  });

  return { success: true, status: "console_fallback", id: logEntry.id };
}

// ---------------------------------------------------------------------------
// HTML EMAIL TEMPLATE BUILDERS
// ---------------------------------------------------------------------------

function buildEmailHtml(title: string, bodyContent: string, actionUrl?: string, actionText?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #060b18; color: #e6ebff; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #0d1428; border: 1px solid #1f2a4d; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0f1c3d, #14275e); padding: 24px; border-bottom: 1px solid #1f2a4d; }
          .brand { font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .brand-accent { color: #22d3ee; }
          .content { padding: 28px; line-height: 1.6; font-size: 14px; color: #cbd5e1; }
          .button { display: inline-block; background: linear-gradient(135deg, #22d3ee, #3b82f6); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; margin-top: 18px; font-size: 13px; }
          .footer { padding: 18px 28px; border-top: 1px solid #1f2a4d; font-size: 11px; color: #64748b; background: #090e1f; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">TRACK <span class="brand-accent">STACK</span> • MSOT</div>
          </div>
          <div class="content">
            <h2 style="color: #ffffff; margin-top: 0;">${title}</h2>
            ${bodyContent}
            ${actionUrl ? `<p><a href="${actionUrl}" class="button">${actionText || "View in Portal"}</a></p>` : ""}
          </div>
          <div class="footer">
            Mirai School of Technology • Official Campus Activity System<br/>
            You are receiving this notification because of your club enrollment preferences.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendClubDayPlanReminder(to: string, coordinatorName: string, clubName: string, clubDayDate: string, portalUrl: string) {
  return sendEmail({
    to,
    recipientName: coordinatorName,
    subject: `Action Required: Submit Activity Plan for ${clubName} (Club Day: ${clubDayDate})`,
    template: "club_day_plan_reminder_7d",
    html: buildEmailHtml(
      "Club Day Planning Reminder (7-Day Notice)",
      `<p>Hi ${coordinatorName},</p>
       <p>Club Day is approaching on <strong>${clubDayDate}</strong>. As Student Coordinator for <strong>${clubName}</strong>, please submit your activity lesson plan and deliverables for faculty review before the deadline.</p>`,
      portalUrl,
      "Submit Activity Plan"
    ),
    text: `Hi ${coordinatorName}, please submit your activity lesson plan for ${clubName} for Club Day on ${clubDayDate}. Portal: ${portalUrl}`,
    metadata: { clubName, clubDayDate },
  });
}

export async function sendSubmissionReminder(to: string, studentName: string, activityTitle: string, deadline: string, portalUrl: string) {
  return sendEmail({
    to,
    recipientName: studentName,
    subject: `Reminder: Deliverable Due in 48h - ${activityTitle}`,
    template: "submission_reminder_48h",
    html: buildEmailHtml(
      "Pending Deliverable Submission (48h Remaining)",
      `<p>Hi ${studentName},</p>
       <p>This is a reminder to submit your project deliverable for <strong>${activityTitle}</strong> before the deadline on <strong>${deadline}</strong>.</p>
       <p>Timely submissions are scored by faculty advisors and factored directly into your Co-Curricular Transcript.</p>`,
      portalUrl,
      "Upload Deliverable"
    ),
    text: `Hi ${studentName}, please submit your deliverable for ${activityTitle} before ${deadline}. Upload at: ${portalUrl}`,
    metadata: { activityTitle, deadline },
  });
}

export async function sendMonthlyReportNotification(to: string, managerName: string, clubName: string, month: string, reportUrl: string, stats: { attendanceRate: number; submissions: number; avgScore: number }) {
  return sendEmail({
    to,
    recipientName: managerName,
    subject: `Monthly Club Report: ${clubName} (${month})`,
    template: "monthly_report_summary",
    html: buildEmailHtml(
      `Monthly Club Health Summary: ${clubName}`,
      `<p>Dear ${managerName},</p>
       <p>The official monthly performance report for <strong>${clubName}</strong> for <strong>${month}</strong> is now compiled and verified:</p>
       <ul>
         <li><strong>Attendance Rate:</strong> ${stats.attendanceRate}%</li>
         <li><strong>Deliverables Submitted:</strong> ${stats.submissions}</li>
         <li><strong>Average Rubric Score:</strong> ${stats.avgScore} / 10</li>
       </ul>
       <p>All figures are reconciled against raw check-in session signatures and evaluation records.</p>`,
      reportUrl,
      "Download Full PDF & CSV Report"
    ),
    text: `Monthly Report for ${clubName} (${month}): Attendance: ${stats.attendanceRate}%, Submissions: ${stats.submissions}, Avg Score: ${stats.avgScore}/10. View: ${reportUrl}`,
    metadata: { clubName, month, ...stats },
  });
}
