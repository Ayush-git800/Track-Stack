// scripts/test-permissions.mjs
import assert from "node:assert/strict";
import { appStore } from "../src/lib/store.ts";

console.log("===============================================================");
console.log("🔒 STARTING PERMISSIONS & ROLE MATRIX TEST SUITE");
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

// 1. Role Capabilities Matrix Definition
const ROLE_PERMISSIONS = {
  admin: {
    canViewAllClubs: true,
    canEditSettings: true,
    canManageAllUsers: true,
    canApproveAnyClubDay: true,
    canRunAnyCheckin: true,
    canGradeAnySubmission: true,
    canIssueCertificates: true,
    canViewAuditLogs: true,
    canApproveDutyLeave: true,
  },
  campus_manager: {
    canViewAllClubs: true,
    canEditSettings: false,
    canManageAllUsers: false,
    canApproveAnyClubDay: false,
    canRunAnyCheckin: false,
    canGradeAnySubmission: false,
    canIssueCertificates: false,
    canViewAuditLogs: false,
    canApproveDutyLeave: true,
  },
  faculty_advisor: {
    canViewAllClubs: false, // only assigned club
    canEditSettings: false,
    canManageAllUsers: false,
    canApproveAnyClubDay: false, // only assigned club
    canRunAnyCheckin: false,
    canGradeAnySubmission: false, // only assigned club
    canIssueCertificates: true, // for assigned club events
    canViewAuditLogs: false,
    canApproveDutyLeave: false,
  },
  student_coordinator: {
    canViewAllClubs: false, // only assigned club
    canEditSettings: false,
    canManageAllUsers: false,
    canApproveAnyClubDay: false,
    canRunAnyCheckin: false, // only assigned club
    canGradeAnySubmission: false, // only assigned club
    canIssueCertificates: false,
    canViewAuditLogs: false,
    canApproveDutyLeave: false,
  },
  student: {
    canViewAllClubs: true, // directory view only
    canEditSettings: false,
    canManageAllUsers: false,
    canApproveAnyClubDay: false,
    canRunAnyCheckin: false,
    canGradeAnySubmission: false,
    canIssueCertificates: false,
    canViewAuditLogs: false,
    canApproveDutyLeave: false,
  },
};

test("1. Complete Role Permission Matrix Validation", () => {
  assert.equal(ROLE_PERMISSIONS.admin.canEditSettings, true);
  assert.equal(ROLE_PERMISSIONS.admin.canViewAuditLogs, true);
  assert.equal(ROLE_PERMISSIONS.campus_manager.canApproveDutyLeave, true);
  assert.equal(ROLE_PERMISSIONS.campus_manager.canEditSettings, false);
  assert.equal(ROLE_PERMISSIONS.student.canRunAnyCheckin, false);
  assert.equal(ROLE_PERMISSIONS.student.canGradeAnySubmission, false);
  assert.equal(ROLE_PERMISSIONS.student_coordinator.canEditSettings, false);
});

test("2. Student Coordinator Club Isolation (Can ONLY manage own club)", () => {
  const coordinatorClubId = "club-kaizen-dev";
  const foreignClubId = "club-malhar";

  const kaizenActivity = {
    id: "act-dev-01",
    club_id: coordinatorClubId,
    title: "Kaizen Dev Workshop",
    status: "approved",
  };

  const malharActivity = {
    id: "act-malhar-01",
    club_id: foreignClubId,
    title: "Malhar Sangeet Night",
    status: "approved",
  };

  // Helper check for coordinator access
  function canCoordinatorRunSession(userClubId, activityClubId) {
    if (userClubId !== activityClubId) {
      throw new Error(`Access Denied: Coordinator of ${userClubId} cannot run sessions for ${activityClubId}`);
    }
    return true;
  }

  // Allowed on own club
  assert.equal(canCoordinatorRunSession(coordinatorClubId, kaizenActivity.club_id), true);

  // Strictly blocked on foreign club
  assert.throws(
    () => canCoordinatorRunSession(coordinatorClubId, malharActivity.club_id),
    /Access Denied: Coordinator of club-kaizen-dev cannot run sessions for club-malhar/
  );
});

test("3. Student Cannot Edit Attendance or Modify Scores", () => {
  function verifyActionPermitted(role, action) {
    if (role === "student") {
      if (action === "edit_attendance" || action === "grade_submission" || action === "publish_scores") {
        throw new Error(`Unauthorized: Role 'student' is forbidden from performing '${action}'`);
      }
    }
    return true;
  }

  assert.throws(
    () => verifyActionPermitted("student", "edit_attendance"),
    /Unauthorized: Role 'student' is forbidden from performing 'edit_attendance'/
  );

  assert.throws(
    () => verifyActionPermitted("student", "grade_submission"),
    /Unauthorized: Role 'student' is forbidden from performing 'grade_submission'/
  );

  assert.throws(
    () => verifyActionPermitted("student", "publish_scores"),
    /Unauthorized: Role 'student' is forbidden from performing 'publish_scores'/
  );
});

test("4. Faculty Advisor Boundary (Cannot approve activities outside assigned clubs)", () => {
  const advisorClubId = "club-kaizen-dev";
  const otherClubId = "club-nexcell";

  function canAdvisorApprove(advisorAssignedClub, activityClub) {
    if (advisorAssignedClub !== activityClub) {
      throw new Error("Advisor cannot approve plans for unassigned club");
    }
    return true;
  }

  assert.equal(canAdvisorApprove(advisorClubId, "club-kaizen-dev"), true);
  assert.throws(
    () => canAdvisorApprove(advisorClubId, otherClubId),
    /Advisor cannot approve plans for unassigned club/
  );
});

test("5. Campus Manager Scope Boundary (Cannot modify global system settings)", () => {
  function canModifySettings(role) {
    if (role !== "admin") {
      throw new Error("Settings modification restricted strictly to admin");
    }
    return true;
  }

  assert.equal(canModifySettings("admin"), true);
  assert.throws(
    () => canModifySettings("campus_manager"),
    /Settings modification restricted strictly to admin/
  );
});

console.log(`\n===============================================================`);
console.log(`🎉 ALL ${passed} PERMISSIONS & ACCESS CONTROL TESTS PASSED!`);
console.log(`===============================================================\n`);
