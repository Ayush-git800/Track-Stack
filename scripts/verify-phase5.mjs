// scripts/verify-phase5.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { appStore } from "../src/lib/store.ts";
import { generateCsvString, generateTabularReportPdf } from "../src/lib/export.ts";
import { sendEmail } from "../src/lib/email.ts";

console.log("===============================================================");
console.log("🚀 STARTING PHASE 5 INTEGRITY & AUTOMATION TEST SUITE");
console.log("===============================================================\n");

let passedTests = 0;

function report(name, fn) {
  try {
    fn();
    passedTests++;
    console.log(`✅ PASS: ${name}`);
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function reportAsync(name, fn) {
  try {
    await fn();
    passedTests++;
    console.log(`✅ PASS: ${name}`);
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: MONTHLY REPORT FIGURES EQUAL RAW ATTENDANCE AND SUBMISSIONS DATA
// ---------------------------------------------------------------------------
report("1. Monthly Report Integrity (Numbers strictly equal raw database records)", () => {
  const clubs = appStore.getState().clubs.filter((c) => c.category !== "Parent Society");
  const testClub = clubs[0]; // e.g. Kaizen Dev Club

  const month = "October 2026";
  const reportObj = appStore.generateMonthlyReport(testClub.id, month);

  // 1. Raw attendances verification
  const rawAttendances = appStore
    .getState()
    .attendances.filter((a) => a.club_id === testClub.id && a.status === "present");
  assert.equal(
    reportObj.total_attendances,
    rawAttendances.length,
    `Monthly report total_attendances (${reportObj.total_attendances}) must strictly equal raw attendances count (${rawAttendances.length})`
  );

  // 2. Raw submissions verification
  const rawSubmissions = appStore.getState().submissions.filter((s) => s.club_id === testClub.id);
  assert.equal(
    reportObj.submissions_count,
    rawSubmissions.length,
    `Monthly report submissions_count (${reportObj.submissions_count}) must strictly equal raw submissions count (${rawSubmissions.length})`
  );

  // 3. Raw evaluations & average score
  const subIds = new Set(rawSubmissions.map((s) => s.id));
  const rawEvaluations = appStore.getState().evaluations.filter((e) => subIds.has(e.submission_id));
  const expectedAvg = rawEvaluations.length > 0
    ? Math.round((rawEvaluations.reduce((acc, e) => acc + e.rubric_scores.total, 0) / rawEvaluations.length) * 10) / 10
    : 0.0;
  assert.equal(
    reportObj.average_score,
    expectedAvg,
    `Monthly report average_score (${reportObj.average_score}) must strictly equal raw evaluation average (${expectedAvg})`
  );

  // 4. Stored in store and retrievable
  const fetched = appStore.getMonthlyReportById(reportObj.id);
  assert.ok(fetched, "Generated monthly report must be saved and retrievable by ID");
  assert.equal(fetched.month, month);
});

// ---------------------------------------------------------------------------
// TEST 2: EXPORTS (CSV & TABULAR PDF ENGINE)
// ---------------------------------------------------------------------------
await reportAsync("2. Export Engine (CSV generation and tabular PDF reports)", async () => {
  const headers = ["Student Name", "Student ID", "Attendances", "Score"];
  const rows = [
    ["Alex Johnson", "2024-CS-001", 4, 9.5],
    ["Priya Sharma, Lead", "2024-CS-002", 3, 8.8],
    ['Special "Quoted" User', "2024-CS-003", 2, 7.0],
  ];

  // CSV generation
  const csvString = generateCsvString(headers, rows);
  assert.ok(csvString.includes("Student Name,Student ID,Attendances,Score"), "CSV contains headers");
  assert.ok(csvString.includes('"Priya Sharma, Lead"'), "CSV escapes comma in names");
  assert.ok(csvString.includes('""Quoted""'), "CSV escapes double quotes properly");

  // PDF report generation
  const pdfBytes = await generateTabularReportPdf({
    title: "Phase 5 Test Tabular Report",
    subtitle: "Automated test subtitle",
    campusName: "Delhi-NCR Campus",
    headers,
    rows,
  });
  assert.ok(pdfBytes instanceof Uint8Array, "Generated report must be valid Uint8Array");
  assert.ok(pdfBytes.length > 500, "Generated report PDF must contain valid binary PDF structure");
});

// ---------------------------------------------------------------------------
// TEST 3: CRON AUTOMATION SCHEDULER & IDEMPOTENCY
// ---------------------------------------------------------------------------
report("3. Automated Scheduled Flow & Idempotency Ledger", () => {
  const idempotencyKey = `cron-test-${Date.now()}`;

  // Initially key is not idempotent
  assert.equal(appStore.isCronIdempotent(idempotencyKey), false);

  // Record cron run
  appStore.recordCronRun({
    job_name: "test_automation_flow",
    idempotency_key: idempotencyKey,
    status: "success",
    items_processed: 5,
    details: { notice: "Idempotency test verified" },
  });

  // Now key is idempotent (will skip duplicate execution)
  assert.equal(appStore.isCronIdempotent(idempotencyKey), true);
  const logs = appStore.getCronRunLogs();
  assert.ok(logs.some((l) => l.idempotency_key === idempotencyKey));
});

// ---------------------------------------------------------------------------
// TEST 4: NOTIFICATION CENTRE & EMAIL DISPATCH LOG
// ---------------------------------------------------------------------------
await reportAsync("4. Notification Centre (In-app alerts, read status, outbound log)", async () => {
  const testUserId = "s0000000-0000-0000-0000-0000000000100";

  // Create in-app notification
  const notif = appStore.createInAppNotification({
    user_id: testUserId,
    title: "Upcoming Project Milestone",
    message: "Submission window for Activity #2 closes in 24 hours.",
    type: "reminder",
    link_url: "/activities",
  });
  assert.equal(notif.read, false);

  // User notifications list includes it
  const userNotifs = appStore.getUserNotifications(testUserId);
  assert.ok(userNotifs.some((n) => n.id === notif.id));

  // Mark as read
  appStore.markNotificationRead(notif.id);
  const updatedNotifs = appStore.getUserNotifications(testUserId);
  const marked = updatedNotifs.find((n) => n.id === notif.id);
  assert.equal(marked?.read, true);

  // Outbound email dispatch (console fallback in test)
  const emailRes = await sendEmail({
    to: "student.test@mirai.edu",
    recipientName: "Test Student",
    subject: "Automated Club Day Reminder",
    template: "reminder_test",
    html: "<p>Automated test email body</p>",
  });
  assert.equal(emailRes.success, true);
  assert.ok(emailRes.status === "sent" || emailRes.status === "console_fallback");

  // Verify registered in sent notifications audit ledger
  const sentLogs = appStore.getSentNotificationLogs();
  assert.ok(sentLogs.some((l) => l.recipient_email === "student.test@mirai.edu"));
});

// ---------------------------------------------------------------------------
// TEST 5: ANNOUNCEMENTS & UNIFIED "NEEDS ATTENTION" RADAR
// ---------------------------------------------------------------------------
report("5. Announcements Broadcast & 'Needs Attention' Unified Radar", () => {
  const club = appStore.getState().clubs[1]; // Kaizen Dev Club

  // 1. Post announcement
  const announcement = appStore.createAnnouncement({
    club_id: club.id,
    club_name: club.name,
    title: "Hackathon Preparation Sprint",
    content: "Special mentorship session with industry partners on Friday 6 PM.",
    author_id: "usr-coordinator-test",
    author_name: "Vivaan Verma",
    author_role: "student_coordinator",
    is_pinned: true,
    target_audience: "all_members",
  });
  assert.ok(announcement.id.startsWith("ann-"));

  // Pinned announcements list contains it
  const pinned = appStore.getPinnedAnnouncements(undefined, [club.id]);
  assert.ok(pinned.some((p) => p.id === announcement.id));

  // 2. Needs Attention Widget aggregator
  const attentionItems = appStore.getNeedsAttentionItems();
  assert.ok(Array.isArray(attentionItems), "Needs attention items must be returned as an array");

  // Confirm inactive clubs and zero participation students flow into needs attention
  const hasInactiveOrPending = attentionItems.some(
    (item) => item.type === "inactive_club" || item.type === "zero_participation_student" || item.type === "pending_activity"
  );
  assert.ok(hasInactiveOrPending, "Needs attention radar must capture inactive societies, zero-participation students, or pending items");
});

console.log("\n===============================================================");
console.log(`🎉 ALL ${passedTests} PHASE 5 TESTS PASSED FLAWLESSLY!`);
console.log("===============================================================\n");
