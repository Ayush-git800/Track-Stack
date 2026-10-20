// scripts/setup.mjs
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

console.log("===============================================================");
console.log("🚀 TRACK STACK: ONE-COMMAND AUTOMATED SYSTEM SETUP");
console.log("===============================================================\n");

function step(title, fn) {
  process.stdout.write(`⏳ ${title}... `);
  try {
    fn();
    process.stdout.write("✅ DONE\n");
  } catch (err) {
    process.stdout.write("❌ FAILED\n");
    console.error(err.message);
    process.exit(1);
  }
}

// 1. Environment Configuration Check
step("1. Checking Environment Configuration (.env.local)", () => {
  const envPath = path.join(process.cwd(), ".env.local");
  const examplePath = path.join(process.cwd(), ".env.example");

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log("\n   Created .env.local from .env.example template.");
    } else {
      throw new Error(".env.example missing!");
    }
  }
});

// 2. Process Logos & Brand Assets
step("2. Processing Official Logos & Mascot Assets (sharp)", () => {
  execSync("node scripts/process-logos.mjs", { stdio: "pipe" });
});

// 3. Database Seeding & Mock Setup
step("3. Seeding Database & Societies (Delhi-NCR)", () => {
  execSync("node scripts/seed.mjs", { stdio: "pipe" });
  execSync("node scripts/seed-phase4.mjs", { stdio: "pipe" });
  execSync("node scripts/seed-load-test.mjs", { stdio: "pipe" });
});

// 4. Run Automated Test Verification
step("4. Running System Integrity Verification", () => {
  execSync("npm test", { stdio: "pipe" });
});

console.log("\n===============================================================");
console.log("🎉 TRACK STACK SETUP COMPLETE!");
console.log("👉 Run 'npm run dev' to start the local Next.js development server.");
console.log("👉 Open http://localhost:3000 in your browser.");
console.log("===============================================================\n");
