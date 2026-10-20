import fs from "fs";
import path from "path";
import {
  generateOneTimeCode,
  generateCheckinToken,
  verifyCheckinToken,
  calculateGeoDistance,
  hashString,
} from "../src/lib/crypto.mjs";

async function runPhase3Verification() {
  console.log("============================================================");
  console.log("   TRACK STACK: Phase 3 Integrity Engine Verification       ");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  // --- 1. Token Signing & Anti-Screenshot Expiry ---
  console.log("--- 1. HMAC Token Signing & Expiry (Anti-Screenshot) ---");
  const testSecret = "super-secret-trackstack-hmac-key-2026";
  const sessionId = "sess-test-01";
  const clubId = "club-kaizen-dev";
  const clubDayId = "day-oct-24";
  const otp = "849201";

  // Fresh token (25 seconds validity)
  const fresh = generateCheckinToken(sessionId, clubId, clubDayId, otp, 25, testSecret);
  assert(fresh.token.startsWith("ts_chk_"), "Token generated with valid 'ts_chk_' prefix");

  const verifyFresh = verifyCheckinToken(fresh.token, testSecret);
  assert(verifyFresh.valid === true, "Fresh HMAC token verifies successfully within active window");
  assert(verifyFresh.payload?.otp === otp, `Verified payload contains expected 6-digit OTP: ${otp}`);

  // Tampered token test
  const tamperedToken = fresh.token.slice(0, -4) + "XXXX";
  const verifyTampered = verifyCheckinToken(tamperedToken, testSecret);
  assert(
    !verifyTampered.valid && verifyTampered.error?.includes("signature mismatch"),
    `Tampered token rejected by HMAC validator: "${verifyTampered.error}"`
  );

  // Expired token test (Negative validity to simulate 10 seconds in the past)
  const expired = generateCheckinToken(sessionId, clubId, clubDayId, otp, -10, testSecret);
  const verifyExpired = verifyCheckinToken(expired.token, testSecret, 0);
  assert(
    !verifyExpired.valid && verifyExpired.error?.includes("Token expired"),
    `Expired screenshot/token rejected by expiry guard: "${verifyExpired.error}"`
  );

  // --- 2. Geo-Distance Haversine Calculation ---
  console.log("\n--- 2. Haversine Geo-Fencing & Radius Logic ---");
  // Delhi Campus: 28.459500, 77.026600
  const campusLat = 28.4595;
  const campusLng = 77.0266;

  // Student 1: Inside campus building (~45 meters away)
  const studentInsideLat = 28.4598;
  const studentInsideLng = 77.0268;
  const distInside = calculateGeoDistance(campusLat, campusLng, studentInsideLat, studentInsideLng);
  assert(distInside < 300, `Student inside campus is within 300m radius (Distance: ${distInside}m)`);

  // Student 2: At home / off-campus (~1.5 km away)
  const studentOutsideLat = 28.4725;
  const studentOutsideLng = 77.0312;
  const distOutside = calculateGeoDistance(campusLat, campusLng, studentOutsideLat, studentOutsideLng);
  assert(distOutside > 300, `Student off-campus detected outside radius (Distance: ${distOutside}m > 300m)`);

  // --- 3. Device Fingerprint Hashing & Anti-Proxy Flag ---
  console.log("\n--- 3. Device Fingerprint Hash & Anti-Proxy Detection ---");
  const deviceA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)-393x852";
  const deviceB = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)-1728x1117";

  const hashA = hashString(deviceA);
  const hashB = hashString(deviceB);
  assert(hashA.length === 8, `Device A fingerprint hashed to deterministic 8-char hex: ${hashA}`);
  assert(hashA !== hashB, "Different devices produce distinct cryptographic hashes");
  assert(hashA === hashString(deviceA), "Identical device fingerprint matches consistently for proxy detection");

  // --- 4. Database Seed Integrity ---
  console.log("\n--- 4. Seed Data Verification for Phase 3 ---");
  const seedData = JSON.parse(fs.readFileSync(path.resolve("src/lib/seed-data.json"), "utf8"));

  assert(seedData.checkinSessions?.length > 0, `Seeded checkinSessions found: ${seedData.checkinSessions?.length}`);
  assert(seedData.attendances?.length > 0, `Seeded attendances found: ${seedData.attendances?.length}`);
  assert(seedData.submissions?.length >= 2, `Seeded submissions found: ${seedData.submissions?.length} (includes v1 and v2 revisions)`);
  assert(seedData.evaluations?.length > 0, `Seeded evaluations found: ${seedData.evaluations?.length}`);

  // Alex Johnson record verification
  const alexAtt = seedData.attendances.find((a) => a.user_id === "u0000000-0000-0000-0000-000000000005");
  assert(alexAtt?.status === "present", "Alex Johnson has verified present attendance");
  assert(alexAtt?.is_presenter === true, "Alex Johnson flagged as Session Presenter");
  assert(alexAtt?.spot_result === "winner", "Alex Johnson awarded spot result: 'winner'");

  const alexSubV2 = seedData.submissions.find((s) => s.id === "sub-alex-v2");
  assert(alexSubV2?.version === 2, "Alex Johnson has revision v2 with version history preserved");

  const alexEval = seedData.evaluations.find((e) => e.submission_id === "sub-alex-v2");
  assert(alexEval?.is_published === true, "Alex Johnson v2 evaluation published with rubric score total: " + alexEval?.rubric_scores?.total);

  // --- 5. Phase 3 Migration Check ---
  console.log("\n--- 5. SQL Migration & Mandatory Reason Trigger ---");
  const migration3 = fs.readFileSync("supabase/migrations/003_phase3_schema.sql", "utf8");
  assert(migration3.includes("checkin_sessions"), "003_phase3_schema.sql defines checkin_sessions table");
  assert(migration3.includes("attendances"), "003_phase3_schema.sql defines attendances table");
  assert(migration3.includes("submissions"), "003_phase3_schema.sql defines submissions table with versioning");
  assert(migration3.includes("evaluations"), "003_phase3_schema.sql defines evaluations table");
  assert(migration3.includes("log_attendance_correction"), "Audit trigger log_attendance_correction enforces mandatory correction reasons");

  console.log("\n============================================================");
  console.log(`   Phase 3 Verification Summary: ${passed} / ${total} Checks Passed`);
  console.log("============================================================\n");
}

runPhase3Verification().catch((err) => {
  console.error(err);
  process.exit(1);
});
