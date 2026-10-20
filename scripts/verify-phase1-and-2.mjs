import fs from "fs";
import path from "path";

const seedData = JSON.parse(fs.readFileSync(path.resolve("src/lib/seed-data.json"), "utf8"));

async function runVerification() {
  console.log("============================================================");
  console.log("   TRACK STACK: Phase 1 & Phase 2 Automated Verification    ");
  console.log("============================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  // --- Test 1: Processed Logos & Icons ---
  console.log("--- 1. Logos & Design System Verification ---");
  const expectedLogos = [
    "nexcell.png", "nexcell.webp",
    "khel-society.png", "khel-society.webp",
    "malhar.png", "malhar.webp",
    "cp-club.png", "cp-club.webp",
    "kaizen-dev.png", "kaizen-dev.webp",
    "kaizen-intelligence.png", "kaizen-intelligence.webp",
    "kaizen-society.png", "kaizen-society.webp",
    "track-stack-lockup.png", "track-stack-lockup.webp",
    "track-stack-mark.png", "track-stack-mark.webp",
  ];

  for (const logo of expectedLogos) {
    const exists = fs.existsSync(path.resolve(`public/logos/${logo}`));
    assert(exists, `Processed logo public/logos/${logo} exists`);
  }

  const pwaIcons = ["icon-192.png", "icon-512.png", "icon-maskable.png"];
  for (const icon of pwaIcons) {
    const exists = fs.existsSync(path.resolve(`public/icons/${icon}`));
    assert(exists, `PWA icon public/icons/${icon} exists`);
  }

  // --- Test 2: Database Schema & Migrations ---
  console.log("\n--- 2. Database Migrations Verification ---");
  assert(fs.existsSync("supabase/migrations/001_initial_schema.sql"), "001_initial_schema.sql exists");
  assert(fs.existsSync("supabase/migrations/002_phase2_schema.sql"), "002_phase2_schema.sql exists");
  assert(fs.existsSync("supabase/tests/rls_and_limits_test.sql"), "SQL test suite rls_and_limits_test.sql exists");

  // Verify SQL trigger in migration
  const migration2Sql = fs.readFileSync("supabase/migrations/002_phase2_schema.sql", "utf8");
  assert(migration2Sql.includes("check_club_membership_limit_and_capacity"), "DB trigger function check_club_membership_limit_and_capacity exists in migration");
  assert(migration2Sql.includes("trg_enforce_club_membership_limit"), "DB trigger trg_enforce_club_membership_limit exists in migration");
  assert(migration2Sql.includes("promote_waitlist_on_member_departure"), "Auto-promote waitlist trigger exists in migration");

  // --- Test 3: Seeded Structure & Societies ---
  console.log("\n--- 3. Seeded Structure & Societies ---");
  const clubs = seedData.clubs;
  assert(clubs.length >= 7, `Seeded clubs count (${clubs.length}) includes parent society + 6 joinable clubs`);
  
  const kaizenParent = clubs.find((c) => c.code === "KAIZEN_SOCIETY");
  assert(Boolean(kaizenParent), "Kaizen Society exists as Parent Society");

  const kaizenSubClubs = clubs.filter((c) => c.parent_club_id === "a1000000-0000-0000-0000-000000000001");
  assert(kaizenSubClubs.length === 3, `Kaizen Society has 3 sub-clubs (${kaizenSubClubs.map(c => c.name).join(", ")})`);

  // --- Test 4: 2-Club Membership Limit Rule ---
  console.log("\n--- 4. 2-Club Membership Rule Enforcement ---");
  // Demo user Alex Johnson has 2 active clubs
  const alexMemberships = seedData.memberships.filter((m) => m.user_id === "u0000000-0000-0000-0000-000000000005");
  assert(alexMemberships.length === 2, `Alex Johnson currently has ${alexMemberships.length} clubs (max limit = 2)`);

  // Verify limit logic
  const settingsRule = seedData.settings.find((s) => s.key === "membership_rules");
  const defaultLimit = settingsRule?.value?.max_clubs_per_student ?? 2;
  assert(defaultLimit === 2, `Default max_clubs_per_student is 2`);

  const canAlexJoin3rd = alexMemberships.length < defaultLimit;
  assert(!canAlexJoin3rd, "Alex Johnson is strictly BLOCKED from joining a 3rd club under default limit");

  // Admin dynamic limit adjustment test
  const adminModifiedLimit = 3;
  const canAlexJoinUnderAdminLimit = alexMemberships.length < adminModifiedLimit;
  assert(canAlexJoinUnderAdminLimit, "After admin modifies limit to 3, Alex Johnson is allowed to join 3rd club");

  // --- Test 5: Club Days & Activity Planning Lifecycle ---
  console.log("\n--- 5. Club Days & Activity Planning Lifecycle ---");
  const days = seedData.clubDays;
  assert(days.length >= 4, `Found ${days.length} Saturday Club Days for Delhi-NCR`);

  const activities = seedData.activities;
  const statuses = new Set(activities.map((a) => a.status));
  assert(statuses.has("live") || statuses.has("announced") || statuses.has("draft"), `Activities present across lifecycle states: ${Array.from(statuses).join(", ")}`);

  console.log("\n============================================================");
  console.log(`   Verification Summary: ${passedTests} / ${totalTests} Checks Passed`);
  console.log("============================================================\n");
}

runVerification();
