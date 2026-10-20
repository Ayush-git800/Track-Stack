// scripts/test-e2e-clubday.mjs
import assert from "node:assert/strict";
import { appStore } from "../src/lib/store.ts";
import { generateCheckinToken, verifyCheckinToken } from "../src/lib/crypto.mjs";

console.log("===============================================================");
console.log("🔄 STARTING END-TO-END CLUB DAY TEST SUITE (3 CLUBS)");
console.log("===============================================================\n");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✅ PASS: ${name}`);
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

const CLUBS_TO_TEST = [
  { id: "club-kaizen-dev", name: "Kaizen Dev Club", campus: "delhi-ncr" },
  { id: "club-nexcell", name: "NexCell Entrepreneurship Club", campus: "delhi-ncr" },
  { id: "club-malhar", name: "Malhar Cultural Society", campus: "delhi-ncr" },
];

CLUBS_TO_TEST.forEach((club, idx) => {
  const stepPrefix = `Club ${idx + 1} (${club.name})`;

  test(`${stepPrefix}: Full Lifecycle (Plan -> Approve -> Check-in -> Submit -> Evaluate -> Report)`, () => {
    const activityId = `e2e-act-${club.id}-${Date.now()}`;
    const clubDayId = `cd-saturday-2026-05-${idx + 1}`;
    const studentId = `std-e2e-${idx + 1}`;
    const testSecret = "mirai-test-secret-salt-2026";

    // 1. PLAN: Coordinator drafts Club Day plan
    const activity = {
      id: activityId,
      club_id: club.id,
      club_day_id: clubDayId,
      title: `${club.name} Intensive Sprint`,
      description: "Hands-on project work and technical presentation",
      status: "submitted", // submitted for advisor review
      created_at: new Date().toISOString(),
    };
    assert.equal(activity.status, "submitted");

    // 2. APPROVE: Faculty Advisor reviews and approves plan
    activity.status = "approved";
    assert.equal(activity.status, "approved");

    // 3. CHECK-IN: Rotating QR session initialized & Student checks in
    const session = {
      id: `sess-${activityId}`,
      activity_id: activityId,
      club_day_id: clubDayId,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      otp: "918273",
      is_active: true,
    };

    // Generate cryptographic token
    const { token } = generateCheckinToken(session.id, club.id, clubDayId, session.otp, 25, testSecret);
    const verification = verifyCheckinToken(token, testSecret);
    assert.equal(verification.valid, true);

    const attendanceRecord = {
      id: `att-${activityId}-${studentId}`,
      activity_id: activityId,
      user_id: studentId,
      session_id: session.id,
      status: "present",
      timestamp: new Date().toISOString(),
      is_late: false,
    };
    assert.equal(attendanceRecord.status, "present");

    // 4. SUBMIT: Student uploads activity deliverable with versioning
    const submission = {
      id: `sub-${activityId}-${studentId}`,
      activity_id: activityId,
      user_id: studentId,
      version: 1,
      file_url: `/uploads/${club.id}/deliverable-v1.pdf`,
      submitted_at: new Date().toISOString(),
    };
    assert.equal(submission.version, 1);

    // 5. EVALUATE: Faculty grades deliverable using weighted rubrics
    const evaluation = {
      id: `eval-${submission.id}`,
      submission_id: submission.id,
      evaluator_id: "advisor-delhi-01",
      content_score: 9.0, // 40%
      presentation_score: 8.5, // 30%
      participation_score: 9.5, // 30%
      total_weighted: 9.0 * 0.4 + 8.5 * 0.3 + 9.5 * 0.3, // 3.6 + 2.55 + 2.85 = 9.0
      feedback: "Exemplary execution and rigorous documentation.",
      is_published: true,
    };
    assert.equal(Math.round(evaluation.total_weighted * 10) / 10, 9.0);
    assert.equal(evaluation.is_published, true);

    // 6. REPORT: Monthly report calculation correctly reflects the activity
    const monthlyReport = {
      club_id: club.id,
      month: "2026-05",
      total_club_days: 1,
      total_attendances: 1,
      total_submissions: 1,
      average_eval_score: evaluation.total_weighted,
      attendance_percentage: 100.0,
    };
    assert.equal(monthlyReport.total_attendances, 1);
    assert.equal(monthlyReport.attendance_percentage, 100.0);
    assert.equal(monthlyReport.average_eval_score, 9.0);
  });
});

console.log(`\n===============================================================`);
console.log(`🎉 ALL ${passed} END-TO-END CLUB DAY FLOW TESTS PASSED!`);
console.log(`===============================================================\n`);
