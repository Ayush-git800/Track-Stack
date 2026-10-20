// scripts/seed-load-test.mjs
import fs from "node:fs";
import path from "node:path";
import { appStore } from "../src/lib/store.ts";
import { generateCheckinToken } from "../src/lib/crypto.mjs";

console.log("===============================================================");
console.log("🌱 SEEDING 500 TEST STUDENTS & ACTIVE CHECK-IN SESSION FOR LOAD TESTING");
console.log("===============================================================\n");

const clubId = "club-kaizen-dev";
const clubDayId = "cd-saturday-load-test";
const sessionId = "sess-load-test-01";
const activityId = "act-load-test-01";
const otp = "849201";

// 1. Create or ensure active checkin session
const session = {
  id: sessionId,
  activity_id: activityId,
  club_id: clubId,
  club_day_id: clubDayId,
  otp: otp,
  started_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 7200000).toISOString(), // 2 hours
  is_active: true,
  device_reuse_flag: false,
};

const tokenData = generateCheckinToken(sessionId, clubId, clubDayId, otp, 7200);

// 2. Generate 500 synthetic students
const students = [];
for (let i = 1; i <= 500; i++) {
  const paddedId = String(i).padStart(4, "0");
  students.push({
    id: `std-load-${paddedId}`,
    email: `loadstudent${paddedId}@msot.edu`,
    full_name: `Load Test Student ${paddedId}`,
    student_id: `MSOT-2026-${paddedId}`,
    campus_id: "delhi-ncr",
    role: "student",
  });
}

// 3. Write data to load test payload fixture
const fixture = {
  session,
  token: tokenData.token,
  otp,
  students,
};

const fixtureDir = path.join(process.cwd(), "load");
if (!fs.existsSync(fixtureDir)) {
  fs.mkdirSync(fixtureDir, { recursive: true });
}

fs.writeFileSync(
  path.join(fixtureDir, "load-test-fixture.json"),
  JSON.stringify(fixture, null, 2),
  "utf8"
);

console.log(`✅ Created active session: ${sessionId}`);
console.log(`✅ Generated valid check-in token (valid 2h)`);
console.log(`✅ Seeded ${students.length} synthetic student profiles into load/load-test-fixture.json`);
console.log("\nReady for k6 / concurrent load testing execution.\n");
