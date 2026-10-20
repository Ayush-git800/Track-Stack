// scripts/verify-phase4.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { appStore } from "../src/lib/store.ts";
import {
  buildCanonicalCertificateData,
  signCertificateData,
  verifyCertificateSignature,
} from "../src/lib/crypto.mjs";
import {
  generateCertificatePdf,
  generateDutyLeavePdf,
  generateTranscriptPdf,
} from "../src/lib/pdf.ts";

console.log("===============================================================");
console.log("🚀 STARTING PHASE 4 INTEGRITY & VERIFICATION TEST SUITE");
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
// TEST 1: CRYPTOGRAPHIC ANTI-TAMPER HMAC CERTIFICATE VERIFICATION
// ---------------------------------------------------------------------------
report("1. Certificate Cryptographic HMAC-SHA256 Signing & Verification", () => {
  const certId = "MSOT-CERT-2026-TEST";
  const canonicalData = buildCanonicalCertificateData({
    id: certId,
    user_id: "usr-student-1",
    event_id: "evt-gambade",
    type: "winner",
    issue_date: "2026-04-12",
    signatory_name: "Ayush Chauhan",
  });

  const validSig = signCertificateData(canonicalData);
  assert.equal(typeof validSig, "string");
  assert.equal(validSig.length, 64, "HMAC-SHA256 must be 64 hex characters");

  // Valid verification
  const isValid = verifyCertificateSignature(canonicalData, validSig);
  assert.equal(isValid, true, "Valid certificate canonical payload must verify successfully");

  // Tampered payload verification failure
  const tamperedPayload = canonicalData.replace("winner", "participation");
  const isTamperedValid = verifyCertificateSignature(tamperedPayload, validSig);
  assert.equal(isTamperedValid, false, "Tampered payload must fail cryptographic verification!");

  // Store verification check: VALID vs REVOKED vs INVALID_TAMPERED
  const issued = appStore.issueCertificate({
    user_id: "usr-student-1",
    user_name: "Alex Johnson",
    student_id: "2024-CS-001",
    campus_name: "Delhi-NCR Campus",
    type: "winner",
    title: "1st Place Winner - Gambade 2026",
    description: "Exemplary performance in hackathon track.",
    event_id: "evt-gambade",
    event_name: "Gambade 2026",
  });

  const checkValid = appStore.verifyCertificateById(issued.id);
  assert.equal(checkValid.valid, true);
  assert.equal(checkValid.status, "VALID");

  // Revoke test
  appStore.revokeCertificate(issued.id, "Violation of competition terms");
  const checkRevoked = appStore.verifyCertificateById(issued.id);
  assert.equal(checkRevoked.valid, false);
  assert.equal(checkRevoked.status, "REVOKED");

  // Tamper store data directly
  const directCert = appStore.getCertificateById(issued.id);
  directCert.status = "valid";
  directCert.canonical_data = directCert.canonical_data.replace("winner", "tampered_rank");
  const checkTampered = appStore.verifyCertificateById(issued.id);
  assert.equal(checkTampered.valid, false);
  assert.equal(checkTampered.status, "INVALID_TAMPERED");
});

// ---------------------------------------------------------------------------
// TEST 2: TEAM UNIQUENESS & DUPLICATE REGISTRATION PREVENTION
// ---------------------------------------------------------------------------
report("2. Team Uniqueness & Duplicate Registration Constraints", () => {
  const students = appStore.getState().students;
  const studentA = students[0];
  const studentB = students[1];

  const testEvent = appStore.createEvent({
    code: `EVT-TEAM-${Date.now()}`,
    name: "Hackathon Team League",
    description: "Team uniqueness test event",
    category: "Technical",
    mode: "team",
    venue: "Lab 1",
    rules: "Teams only",
    schedule_details: "Morning",
    start_date: "2026-05-10T09:00:00Z",
    end_date: "2026-05-10T18:00:00Z",
    registration_start: "2026-05-01T00:00:00Z",
    registration_end: "2026-05-09T23:59:59Z",
    min_team_size: 2,
    max_team_size: 4,
    capacity: 20,
    is_inter_campus: false,
    status: "published",
  });

  // 1. Create team with leader studentA
  const teamRes = appStore.createTeam(testEvent.id, "Alpha Squad", studentA.id);
  assert.equal(teamRes.success, true, "First team creation must succeed");

  // 2. Duplicate team name attempt must fail
  const dupTeamRes = appStore.createTeam(testEvent.id, "Alpha Squad", studentB.id);
  assert.equal(dupTeamRes.success, false, "Duplicate team name must be rejected");
  assert.match(dupTeamRes.message, /already registered/i);

  // 3. Leader cannot create second team for same event
  const leaderDupRes = appStore.createTeam(testEvent.id, "Beta Squad", studentA.id);
  assert.equal(leaderDupRes.success, false, "Leader cannot be in two teams for same event");

  // 4. Duplicate registration for same student must fail
  const dupReg = appStore.registerForEvent(testEvent.id, studentA.id, "individual");
  assert.equal(dupReg.success, false, "Duplicate registration for same student must be rejected");
  assert.match(dupReg.message, /already registered/i);
});

// ---------------------------------------------------------------------------
// TEST 3: 200+ CONCURRENT REGISTRATIONS WITH WAITLIST INTEGRITY
// ---------------------------------------------------------------------------
await reportAsync("3. 200+ Concurrent Registration Stress Test", async () => {
  // Create an isolated event with capacity 30
  const capacity = 30;
  const stressEvent = appStore.createEvent({
    code: `STRESS-${Date.now()}`,
    name: "Concurrent Registration Stress Summit",
    description: "High concurrency registration test event.",
    category: "Technical",
    mode: "individual",
    venue: "Main Hall",
    rules: "Individual integrity check.",
    schedule_details: "Full day sprint.",
    start_date: "2026-05-01T09:00:00Z",
    end_date: "2026-05-01T17:00:00Z",
    registration_start: "2026-04-01T00:00:00Z",
    registration_end: "2026-04-30T23:59:59Z",
    min_team_size: 1,
    max_team_size: 1,
    capacity,
    is_inter_campus: false,
    status: "published",
  });

  const totalAttempting = 210;
  // Ensure students exist in store for testing
  for (let i = 1; i <= totalAttempting; i++) {
    const sId = `usr-stress-${i}`;
    if (!appStore.getState().students.some((s) => s.id === sId)) {
      appStore.getState().students.push({
        id: sId,
        full_name: `Stress Tester ${i}`,
        email: `tester${i}@stress.msot.edu`,
        student_id: `2024-STRESS-${String(i).padStart(3, "0")}`,
        role: "student",
        campus_id: "delhi-ncr",
        campus_name: "Delhi-NCR Campus",
        year_of_study: 2,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Fire 210 concurrent registration attempts
  const registrationPromises = [];
  for (let i = 1; i <= totalAttempting; i++) {
    registrationPromises.push(
      Promise.resolve().then(() =>
        appStore.registerForEvent(stressEvent.id, `usr-stress-${i}`, "individual")
      )
    );
  }

  const results = await Promise.all(registrationPromises);
  assert.equal(results.length, totalAttempting, "All 210 concurrent attempts completed");

  const registrations = appStore.getEventRegistrations(stressEvent.id);
  assert.equal(registrations.length, totalAttempting, "Exactly 210 entries recorded without losses");

  const confirmed = registrations.filter((r) => r.status === "confirmed");
  const waitlisted = registrations.filter((r) => r.status === "waitlisted");

  assert.equal(confirmed.length, capacity, `Exactly ${capacity} students confirmed up to capacity`);
  assert.equal(
    waitlisted.length,
    totalAttempting - capacity,
    `Remaining ${totalAttempting - capacity} students safely waitlisted`
  );

  // Check no duplicate user IDs
  const userIds = registrations.map((r) => r.user_id);
  const uniqueUserIds = new Set(userIds);
  assert.equal(userIds.length, uniqueUserIds.size, "Zero duplicate registrations occurred!");
});

// ---------------------------------------------------------------------------
// TEST 4: INTER-CAMPUS EVENT AUTO DUTY LEAVE CREATION & APPROVAL
// ---------------------------------------------------------------------------
report("4. Inter-Campus Auto Duty Leave Routing & Manager Approval", () => {
  const interEvent = appStore.createEvent({
    code: `IC-${Date.now()}`,
    name: "National Robotics Olympiad 2026",
    description: "Inter-campus national robotics invitational.",
    category: "technical",
    mode: "individual",
    venue: "Bengaluru Tech Park",
    start_date: "2026-06-10T09:00:00Z",
    end_date: "2026-06-12T18:00:00Z",
    registration_start: "2026-05-01T00:00:00Z",
    registration_end: "2026-06-01T23:59:59Z",
    min_team_size: 1,
    max_team_size: 1,
    capacity: 20,
    is_inter_campus: true,
    status: "published",
  });

  const testStudent = appStore.getState().students[0];
  const testStudentId = testStudent.id;
  // Register for inter-campus event
  const regRes = appStore.registerForEvent(interEvent.id, testStudentId, "individual");
  assert.equal(regRes.success, true);

  // Verify Duty Leave was automatically filed
  const dlList = appStore.getState().dutyLeaves.filter((dl) => dl.event_id === interEvent.id);
  assert.equal(dlList.length, 1, "Duty Leave must be automatically filed for inter-campus event");
  const dl = dlList[0];
  assert.equal(dl.status, "pending");
  assert.equal(dl.user_id, testStudentId);

  // Campus manager reviews and approves
  const managerUser = {
    id: "usr-manager-delhi",
    full_name: "Rajesh Kumar",
    email: "rajesh.kumar@mirai.edu",
    role: "campus_manager",
  };

  const approveRes = appStore.approveDutyLeave(
    dl.id,
    managerUser,
    "Official delegation approved by Dean.",
    true
  );
  assert.equal(approveRes.success, true);
  assert.equal(approveRes.leave?.status, "approved");
  assert.equal(approveRes.leave?.approver_name, "Rajesh Kumar");
});

// ---------------------------------------------------------------------------
// TEST 5: PDF GENERATION & CO-CURRICULAR TRANSCRIPT DATA INTEGRITY
// ---------------------------------------------------------------------------
await reportAsync("5. Server-Side PDF Generation (Certificates, Duty Leave, Transcript)", async () => {
  const testCert = {
    id: "MSOT-CERT-VERIFY-SAMPLE",
    user_id: "usr-student-1",
    user_name: "Alex Johnson",
    student_id: "2024-CS-001",
    campus_name: "Delhi-NCR Campus",
    type: "winner",
    title: "1st Place Winner - Mirai HackTech 2026",
    description: "Awarded 1st place for pioneering AI autonomous agent architecture.",
    event_id: "evt-hackathon",
    event_name: "Mirai HackTech 2026",
    issue_date: "2026-04-12",
    signatory_name: "Ayush Chauhan",
    signatory_title: "Campus Director & System Administrator",
    canonical_data: "canonical_test_data",
    signature: "hmac_test_signature",
    status: "valid",
    pdf_url: "/api/certificates/MSOT-CERT-VERIFY-SAMPLE/download",
    verification_url: "http://localhost:3000/verify/MSOT-CERT-VERIFY-SAMPLE",
    created_at: new Date().toISOString(),
  };

  const certPdfBytes = await generateCertificatePdf(testCert);
  assert.ok(certPdfBytes instanceof Uint8Array, "Certificate PDF must be valid byte array");
  assert.ok(certPdfBytes.length > 1000, "Certificate PDF must contain substantial data");

  // Duty Leave PDF
  const testDl = {
    id: "DL-SAMPLE-VERIFY",
    user_id: "usr-student-1",
    user_name: "Alex Johnson",
    student_id: "2024-CS-001",
    campus_name: "Delhi-NCR Campus",
    event_id: "evt-gambade",
    event_name: "Gambade 2026 Sports & Esports Championship",
    event_registration_id: "reg-1",
    dates: "2026-04-10 to 2026-04-12",
    reason: "Representing campus in inter-campus flagship event",
    status: "approved",
    letter_pdf_url: "/api/duty-leave/DL-SAMPLE-VERIFY/download",
    approver_id: "usr-manager-delhi",
    approver_name: "Rajesh Kumar",
    approver_comments: "Official delegation approved.",
    created_at: new Date().toISOString(),
  };

  const dlPdfBytes = await generateDutyLeavePdf(testDl);
  assert.ok(dlPdfBytes instanceof Uint8Array, "Duty Leave PDF must be valid byte array");
  assert.ok(dlPdfBytes.length > 1000, "Duty Leave PDF must contain substantial data");

  // Co-Curricular Transcript PDF & Data
  const sampleStudent = appStore.getState().students[0];
  const transcriptData = appStore.getStudentTranscriptData(sampleStudent.id);
  assert.ok(transcriptData, "Transcript data must exist for sample student");
  assert.ok(transcriptData.student_id, "Transcript student ID must be present");
  assert.ok(Array.isArray(transcriptData.clubs), "Clubs list must be present");
  assert.ok(Array.isArray(transcriptData.certificates), "Certificates list must be present");

  const transcriptPdfBytes = await generateTranscriptPdf(transcriptData);
  assert.ok(transcriptPdfBytes instanceof Uint8Array, "Transcript PDF must be valid byte array");
  assert.ok(transcriptPdfBytes.length > 1000, "Transcript PDF must contain complete ledger data");
});

console.log("\n===============================================================");
console.log(`🎉 ALL ${passedTests} PHASE 4 TESTS PASSED FLAWLESSLY!`);
console.log("===============================================================\n");
